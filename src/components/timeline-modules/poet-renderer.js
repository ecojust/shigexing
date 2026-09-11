/**
 * 诗人绘制模块
 * 负责绘制诗人时间条和交互
 * 布局: 横轴=时间(年份)，纵轴=诗人(每位诗人一行)
 */

import * as PIXI from "pixi.js";
import { timelineConfig } from "./config.js";
import {
  getYearPosition,
  getPoetYPosition,
  getPoetColor,
  createTextStyle,
} from "./utils.js";
import { TauriFetch } from "@/types/tauri-fetch";
import history from "@/poetdata/index.js";
import { poetAvatarMap } from "./avatar-map.js";

let isFetching = false;

const getHistory = async (poet, onMarkersReceived) => {
  console.log("正在获取历史数据：", poet.name);
  if (isFetching) {
    return;
  }
  try {
    isFetching = true;
    const name = poet.name;
    // 简单 GET 请求
    const data = await TauriFetch.json(
      `https://cnkgraph.com/Api/Biography?scope=&author=${name}&beginYear=0&endYear=0`
    );

    const markers = data.Traces[0].Markers;

    // 调用回调函数传递markers数据
    if (onMarkersReceived && typeof onMarkersReceived === "function") {
      onMarkersReceived(markers, `${name}(${poet.birth}-${poet.death})`);
    }

    return markers;
  } catch (error) {
    console.error("获取历史数据失败:", error);
    return [];
  } finally {
    isFetching = false;
  }
};

const getHistoryFromLocal = async (poet, onMarkersReceived) => {
  console.log("history", history);
  // 调用回调函数传递markers数据
  if (
    onMarkersReceived &&
    typeof onMarkersReceived === "function" &&
    history[poet.name]
  ) {
    onMarkersReceived(
      history[poet.name],
      `${poet.name} (${poet.birth} - ${poet.death})`
    );
  }
};

/**
 * 创建圆形头像（优先网络头像，加载失败回退首字占位）
 * @param {PIXI.Container} container - 父容器
 * @param {number} cx - 圆心X坐标
 * @param {number} cy - 圆心Y坐标
 * @param {Object} poet - 诗人数据
 * @param {number} color - 主题色
 */
const createAvatar = (container, cx, cy, poet, color) => {
  const size = timelineConfig.avatarSize;
  const half = size / 2;

  const avatarContainer = new PIXI.Container();
  avatarContainer.x = cx;
  avatarContainer.y = cy;

  // 占位圆形（名字首字）
  const placeholder = new PIXI.Graphics();
  placeholder.circle(0, 0, half).fill({ color: color, alpha: 0.85 });

  const initial = new PIXI.Text({
    text: poet.name[0],
    style: createTextStyle({
      fontSize: 20,
      fill: 0xffffff,
      fontWeight: "bold",
      align: "center",
    }),
  });
  initial.anchor.set(0.5);
  placeholder.addChild(initial);

  avatarContainer.addChild(placeholder);

  // 从网络加载头像（Wikimedia 公有领域画像）
  const url = poetAvatarMap[poet.name];
  if (url) {
    PIXI.Assets.load(url)
      .then((texture) => {
        if (avatarContainer.destroyed || !texture || !texture.valid) return;

        const sprite = new PIXI.Sprite(texture);
        sprite.anchor.set(0.5);

        // 等比缩放并居中裁剪为圆形
        const imgW = texture.width || 1;
        const imgH = texture.height || 1;
        sprite.scale.set(Math.max(size / imgW, size / imgH));

        // 圆形遮罩
        const mask = new PIXI.Graphics();
        mask.circle(0, 0, half).fill(0xffffff);

        avatarContainer.addChild(sprite);
        avatarContainer.addChild(mask);
        sprite.mask = mask;

        avatarContainer.removeChild(placeholder);
        placeholder.destroy({ children: true });
      })
      .catch(() => {});
  }

  container.addChild(avatarContainer);
  return avatarContainer;
};

/**
 * 绘制诗人时间条（横向布局）
 * @param {PIXI.Container} container - 诗人容器
 * @param {Array} poets - 诗人数据数组
 * @param {Function} onPoetClick - 诗人点击回调
 * @param {Function} onMarkersReceived - markers数据接收回调
 */
export const drawPoets = (container, poets, onPoetClick, onMarkersReceived) => {
  // 清空容器
  container.removeChildren();

  const sortedPoets = [...poets].sort((a, b) => a.birth - b.birth);

  sortedPoets.forEach((poet, index) => {
    const y = getPoetYPosition(index);
    const centerY = y + timelineConfig.poetBarHeight / 2;
    const startX = getYearPosition(poet.birth);
    const endX = getYearPosition(poet.death);
    const avatarHalf = timelineConfig.avatarSize / 2;

    const poetColor = getPoetColor(poet.category);

    // 诗人姓名标签（左侧固定区）
    const nameText = new PIXI.Text({
      text: poet.name,
      style: createTextStyle({
        fontSize: 24,
        fill: 0xffffff,
        fontWeight: "bold",
        align: "right",
      }),
    });
    nameText.anchor.set(1, 0.5);
    nameText.x = timelineConfig.margin.left - 10;
    nameText.y = centerY - 4;

    // 生卒年份标签（名字下方小字）
    const yearsText = new PIXI.Text({
      text: `${poet.birth}~${poet.death}`,
      style: createTextStyle({
        fontSize: 12,
        fill: 0xbbbbbb,
        align: "right",
      }),
    });
    yearsText.anchor.set(1, 0);
    yearsText.x = timelineConfig.margin.left - 10;
    yearsText.y = centerY + 6;

    // 头像（开始位置圆形）
    const avatar = createAvatar(
      container,
      startX,
      centerY,
      poet,
      poetColor
    );

    // 时间条（从头像右侧延伸到死亡年份）
    const barStartX = startX + avatarHalf + 4;
    const barWidth = Math.max(endX - barStartX, 20);

    const poetBar = new PIXI.Graphics();
    poetBar
      .roundRect(barStartX, y + 6, barWidth, timelineConfig.poetBarHeight - 12, 10)
      .fill({ color: poetColor, alpha: poet.over ? 0.5 : 0.3 })
      .stroke({ width: 2, color: poetColor, alpha: 0.9 });

    container.addChild(nameText);
    container.addChild(yearsText);
    container.addChild(poetBar);

    // 添加交互
    poetBar.eventMode = "static";
    poetBar.cursor = "pointer";
    poetBar.poetData = poet;

    poetBar.on("pointerdown", () => {
      console.log("点击了bar", poet);
      // 获取历史数据并触发dialog显示
      getHistoryFromLocal(poet, onMarkersReceived);
    });

    // 悬停效果
    poetBar.on("pointerover", () => {
      poetBar.alpha = 1.2;
      nameText.style.fill = 0xffffff;
    });

    poetBar.on("pointerout", () => {
      poetBar.alpha = 1;
      nameText.style.fill = 0xffffff;
    });
  });
};

/**
 * 计算诗人在时间轴上的位置
 * @param {Object} poet - 诗人数据
 * @param {Array} allPoets - 所有诗人数据
 * @returns {Object} 包含x和y坐标的对象
 */
export const getPoetPosition = (poet, allPoets) => {
  const sortedPoets = [...allPoets].sort((a, b) => a.birth - b.birth);
  const poetIndex = sortedPoets.findIndex((p) => p.name === poet.name);

  const x = getYearPosition(poet.birth);
  const y = getPoetYPosition(Math.max(poetIndex, 0));

  return { x, y };
};
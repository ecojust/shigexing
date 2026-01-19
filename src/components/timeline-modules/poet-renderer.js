/**
 * 诗人绘制模块
 * 负责绘制诗人时间条和交互
 */

import * as PIXI from "pixi.js";
import { timelineConfig } from "./config.js";
import { getYearPosition, getPoetColor, createTextStyle } from "./utils.js";
import { TauriFetch } from "@/types/tauri-fetch";
import history from "@/poetdata/index.js";

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
 * 绘制诗人时间条
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
    const startY = getYearPosition(poet.birth);
    const endY = getYearPosition(poet.death);
    const height = Math.max(endY - startY, 15); // 最小高度15px

    // 计算诗人条的水平位置（多列布局）
    const column = index % 22; // 12列布局
    const x =
      timelineConfig.margin.left +
      380 + // 为帝皇块留出空间
      column * (timelineConfig.poetBarWidth + 12 * 3);

    // 诗人生活时间条
    const poetBar = new PIXI.Graphics();
    const poetColor = getPoetColor(poet.category);

    // 绘制外边框
    poetBar
      .rect(x, startY, timelineConfig.poetBarWidth, height)
      .fill({ color: poetColor, alpha: poet.over ? 0.5 : 0.15 })
      .stroke({ width: 2, color: poetColor });

    // 绘制内部实心部分（代表诗人的创作高峰期）
    // if (poet.peakPeriod) {
    //   const peakStartY = getYearPosition(poet.peakPeriod.start);
    //   const peakEndY = getYearPosition(poet.peakPeriod.end);
    //   const peakHeight = Math.max(peakEndY - peakStartY, 8);

    //   poetBar
    //     .rect(x + 3, peakStartY, timelineConfig.poetBarWidth - 6, peakHeight)
    //     .fill({ color: poetColor, alpha: 0.8 });
    // }

    // 诗人姓名标签
    const nameText = new PIXI.Text({
      text: poet.name,
      style: createTextStyle({
        fontSize: 27,
        fill: poetColor,
        fontWeight: "bold",
        align: "center",
      }),
    });
    nameText.anchor.set(0.5, 1);
    nameText.x = x + timelineConfig.poetBarWidth / 2;
    nameText.y = startY - 3;

    // 出生和死亡年份标签
    const yearText = new PIXI.Text({
      text: `${poet.birth}`,
      style: createTextStyle({
        fontSize: 20,
        fill: poetColor,
        fontWeight: "normal",
        align: "center",
      }),
    });
    yearText.anchor.set(0.5, 0);
    yearText.x = x + timelineConfig.poetBarWidth / 2;
    yearText.y = startY - 0;
    yearText.interactive = false;

    // 出生和死亡年份标签
    const yearText_ = new PIXI.Text({
      text: `|`,
      style: createTextStyle({
        fontSize: 20,
        fill: poetColor,
        fontWeight: "normal",
        align: "center",
      }),
    });
    yearText_.anchor.set(0.5, 0);
    yearText_.x = x + timelineConfig.poetBarWidth / 2;
    yearText_.y = startY + 20;
    yearText_.interactive = false;

    // 出生和死亡年份标签
    const yearText2 = new PIXI.Text({
      text: `${poet.death}`,
      style: createTextStyle({
        fontSize: 20,
        fill: poetColor,
        fontWeight: "normal",
        align: "center",
      }),
    });
    yearText2.anchor.set(0.5, 0);
    yearText2.x = x + timelineConfig.poetBarWidth / 2;
    yearText2.y = startY + 44;
    yearText2.interactive = false;

    container.addChild(nameText);
    container.addChild(yearText);
    container.addChild(yearText_);

    container.addChild(yearText2);

    container.addChild(poetBar);

    // 添加交互
    poetBar.eventMode = "static";
    poetBar.cursor = "pointer";
    poetBar.poetData = poet;

    poetBar.on("pointerdown", () => {
      console.log("点击了bar", poet);
      // if (onPoetClick) {
      //   onPoetClick(poet);
      // }

      // 获取历史数据并触发dialog显示
      getHistoryFromLocal(poet, onMarkersReceived);
    });

    // 悬停效果
    poetBar.on("pointerover", () => {
      poetBar.alpha = 1.2;
      nameText.style.fill = 0x000000;
      yearText.style.fill = 0x000000;
      yearText_.style.fill = 0x000000;
      yearText2.style.fill = 0x000000;
      // poetBar.style.fill = 0x000000;
      // poetBar.style.stroke = 0x000000;
    });

    poetBar.on("pointerout", () => {
      poetBar.alpha = 1;
      nameText.style.fill = poetColor;
      yearText.style.fill = poetColor;
      yearText_.style.fill = poetColor;
      yearText2.style.fill = poetColor;
      // poetBar.style.fill = poetColor;
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
  const column = poetIndex % 12;

  const x =
    timelineConfig.margin.left +
    280 +
    column * (timelineConfig.poetBarWidth + 12 * 3);
  const y = getYearPosition(poet.birth);

  return { x, y };
};

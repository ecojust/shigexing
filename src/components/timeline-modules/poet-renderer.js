/**
 * 诗人绘制模块
 * 负责绘制诗人时间条和交互
 */

import * as PIXI from "pixi.js";
import { timelineConfig } from "./config.js";
import { getYearPosition, getPoetColor, createTextStyle } from "./utils.js";

/**
 * 绘制诗人时间条
 * @param {PIXI.Container} container - 诗人容器
 * @param {Array} poets - 诗人数据数组
 * @param {Function} onPoetClick - 诗人点击回调
 */
export const drawPoets = (container, poets, onPoetClick) => {
  // 清空容器
  container.removeChildren();

  const sortedPoets = [...poets].sort((a, b) => a.birth - b.birth);

  sortedPoets.forEach((poet, index) => {
    const startY = getYearPosition(poet.birth);
    const endY = getYearPosition(poet.death);
    const height = Math.max(endY - startY, 15); // 最小高度15px

    // 计算诗人条的水平位置（多列布局）
    const column = index % 12; // 12列布局
    const x =
      timelineConfig.margin.left +
      280 + // 为帝皇块留出空间
      column * (timelineConfig.poetBarWidth + 12 * 3);

    // 诗人生活时间条
    const poetBar = new PIXI.Graphics();
    const poetColor = getPoetColor(poet.category);

    // 绘制外边框
    poetBar
      .rect(x, startY, timelineConfig.poetBarWidth, height)
      .fill({ color: poetColor, alpha: 0.15 })
      .stroke({ width: 2, color: poetColor });

    // 绘制内部实心部分（代表诗人的创作高峰期）
    if (poet.peakPeriod) {
      const peakStartY = getYearPosition(poet.peakPeriod.start);
      const peakEndY = getYearPosition(poet.peakPeriod.end);
      const peakHeight = Math.max(peakEndY - peakStartY, 8);

      poetBar
        .rect(x + 3, peakStartY, timelineConfig.poetBarWidth - 6, peakHeight)
        .fill({ color: poetColor, alpha: 0.8 });
    }

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

    container.addChild(poetBar);
    container.addChild(nameText);

    // 添加交互
    poetBar.eventMode = "static";
    poetBar.cursor = "pointer";
    poetBar.poetData = poet;

    poetBar.on("pointerdown", () => {
      if (onPoetClick) {
        onPoetClick(poet);
      }
    });

    // 悬停效果
    poetBar.on("pointerover", () => {
      poetBar.alpha = 1.2;
      nameText.style.fill = 0x000000;
    });

    poetBar.on("pointerout", () => {
      poetBar.alpha = 1;
      nameText.style.fill = poetColor;
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

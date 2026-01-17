/**
 * 朝代绘制模块
 * 负责绘制朝代背景和标签
 */

import * as PIXI from "pixi.js";
import { timelineConfig, dynasties } from "./config.js";
import { getYearPosition, createTextStyle } from "./utils.js";

/**
 * 绘制朝代背景
 * @param {PIXI.Container} container - 朝代容器
 * @param {boolean} visible - 是否显示朝代
 */
export const drawDynasties = (container, visible = true) => {
  // 清空容器
  container.removeChildren();

  if (!visible) return;

  dynasties.forEach((dynasty) => {
    const startY = getYearPosition(dynasty.start);
    const endY = getYearPosition(dynasty.end);
    const height = endY - startY;

    // 朝代背景矩形
    const rect = new PIXI.Graphics();
    rect
      .rect(
        timelineConfig.margin.left + 20,
        startY,
        timelineConfig.width - 40,
        height
      )
      .fill({ color: dynasty.color, alpha: 0.05 })
      .stroke({ width: 2, color: dynasty.color, alpha: 0.6 });

    container.addChild(rect);

    // 朝代标签
    const dynastyText = new PIXI.Text({
      text: dynasty.name,
      style: createTextStyle({
        fontSize: 32,
        fill: dynasty.color,
        fontWeight: "bold",
      }),
    });
    dynastyText.x = timelineConfig.margin.left + 30;
    dynastyText.y = startY + 20;
    container.addChild(dynastyText);
  });
};

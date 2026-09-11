/**
 * 朝代绘制模块
 * 负责绘制朝代背景和标签
 * 横轴: 时间（年份），纵轴: 诗人
 */

import * as PIXI from "pixi.js";
import { timelineConfig, dynasties } from "./config.js";
import { getYearPosition, createTextStyle } from "./utils.js";

/**
 * 绘制朝代背景
 * @param {PIXI.Container} container - 朝代容器
 * @param {boolean} visible - 是否显示朝代
 * @param {Array} poets - 诗人数据数组
 */
export const drawDynasties = (container, visible = true, poetCount = 0) => {
  // 清空容器
  container.removeChildren();

  if (!visible) return;

  const totalHeight = timelineConfig.height;

  dynasties.forEach((dynasty) => {
    const startX = getYearPosition(dynasty.start);
    const endX = getYearPosition(dynasty.end);
    const width = endX - startX;

    // 朝代背景矩形（横向）
    const rect = new PIXI.Graphics();
    rect
      .rect(
        startX,
        timelineConfig.margin.top - 20,
        width,
        totalHeight - timelineConfig.margin.top + 20
      )
      .fill({ color: dynasty.color, alpha: 0.05 })
      .stroke({ width: 2, color: dynasty.color, alpha: 0.6 });

    container.addChild(rect);

    // 朝代标签（顶部）
    const dynastyText = new PIXI.Text({
      text: dynasty.name,
      style: createTextStyle({
        fontSize: 28,
        fill: dynasty.color,
        fontWeight: "bold",
      }),
    });
    dynastyText.x = startX + 10;
    dynastyText.y = timelineConfig.margin.top - 40;
    container.addChild(dynastyText);
  });
};

/**
 * 时间轴绘制模块
 * 负责绘制主时间轴和年份刻度
 */

import * as PIXI from "pixi.js";
import { timelineConfig } from "./config.js";
import { getYearPosition, createTextStyle } from "./utils.js";

/**
 * 绘制主时间轴
 * @param {PIXI.Container} container - 时间轴容器
 */
export const drawTimeline = (container) => {
  // 清空容器
  container.removeChildren();

  const graphics = new PIXI.Graphics();

  // 主时间轴线
  graphics
    .moveTo(timelineConfig.margin.left, 0)
    .lineTo(timelineConfig.margin.left, timelineConfig.height)
    .stroke({ width: 3, color: 0x333333 });

  // 绘制年份刻度
  const yearStep = 50; // 每50年一个刻度
  for (
    let year = timelineConfig.minYear;
    year <= timelineConfig.maxYear;
    year += yearStep
  ) {
    const y = getYearPosition(year);

    // 刻度线
    graphics
      .moveTo(timelineConfig.margin.left - 10, y)
      .lineTo(timelineConfig.margin.left + 10, y)
      .stroke({ width: 2, color: 0x666666 });

    // 年份标签
    const yearText = new PIXI.Text({
      text: year.toString(),
      style: createTextStyle({
        fontSize: 24,
        fill: 0x333333,
        align: "right",
      }),
    });
    yearText.anchor.set(1, 0.5);
    yearText.x = timelineConfig.margin.left - 15;
    yearText.y = y;
    container.addChild(yearText);
  }

  container.addChild(graphics);
};

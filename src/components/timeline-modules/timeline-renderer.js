/**
 * 时间轴绘制模块
 * 负责绘制主时间轴和年份刻度
 * 横轴: 时间（年份），纵轴: 诗人
 */

import * as PIXI from "pixi.js";
import { timelineConfig } from "./config.js";
import { getYearPosition, createTextStyle } from "./utils.js";

/**
 * 绘制主时间轴（横向）
 * @param {PIXI.Container} container - 时间轴容器
 * @param {number}诗人数量 - 诗人数量
 */
export const drawTimeline = (container, poetCount = 0) => {
  // 清空容器
  container.removeChildren();

  const graphics = new PIXI.Graphics();

  // 主时间轴线（横向）
  graphics
    .moveTo(timelineConfig.margin.left, timelineConfig.margin.top - 30)
    .lineTo(timelineConfig.margin.left + timelineConfig.width, timelineConfig.margin.top - 30)
    .stroke({ width: 3, color: 0x666666 });

  // 绘制年份刻度：每年一条细刻度（600-1300 共 700 个刻度），每100年加粗并标标签
  for (
    let year = timelineConfig.minYear;
    year <= timelineConfig.maxYear;
    year += 1
  ) {
    const x = getYearPosition(year);
    const isCentury = year % 100 === 0;

    // 刻度线（纵向）
    graphics
      .moveTo(x, timelineConfig.margin.top - 40)
      .lineTo(x, timelineConfig.margin.top - 20)
      .stroke({ width: isCentury ? 2 : 1, color: isCentury ? 0xcccccc : 0x999999, alpha: isCentury ? 1 : 0.4 });

    // 竖向参考线（浅色）
    graphics
      .moveTo(x, timelineConfig.margin.top)
      .lineTo(x, timelineConfig.height)
      .stroke({ width: 1, color: 0xcccccc, alpha: isCentury ? 0.18 : 0.06 });

    // 每100年标一次年份标签
    if (isCentury) {
      const yearText = new PIXI.Text({
        text: year.toString(),
        style: createTextStyle({
          fontSize: 20,
          fill: 0x999999,
          align: "center",
        }),
      });
      yearText.anchor.set(0.5, 1);
      yearText.x = x;
      yearText.y = timelineConfig.margin.top - 45;
      container.addChild(yearText);
    }
  }

  container.addChild(graphics);
};

/**
 * 人生起落折线图渲染模块
 * 为单个诗人绘制标准的直角坐标折线图：
 *   - 横轴：时间（年份）
 *   - 纵轴：life 数据的 value（人生起落值）
 */

import * as PIXI from "pixi.js";
import { timelineConfig } from "./config.js";
import { getPoetColor, createTextStyle } from "./utils.js";

export const CHART_H = 340;
export const CHART_TOP_OFFSET = 60;

const axisLabelColor = 0xcccccc;
const gridAlpha = 0.18;

/**
 * 将诗人的 life 数据处理为有序点集
 * 格式: [{ year, value, event }]
 * @param {Object} poet - 诗人数据
 * @returns {Array|null} 排序后的数据点
 */
const buildPoints = (poet) => {
  if (!Array.isArray(poet.life) || poet.life.length < 2) return null;

  const points = poet.life
    .filter((p) => p && typeof p.time === "number" && typeof p.value === "number")
    .map((p) => ({ year: p.time, value: p.value, event: p.event }))
    .sort((a, b) => a.year - b.year);

  return points.length >= 2 ? points : null;
};

const showChartTooltip = (point, x, y) => {
  hideChartTooltip();

  const tooltip = document.createElement("div");
  tooltip.id = "life-chart-tooltip";
  tooltip.style.cssText = `
    position: fixed;
    left: ${x + 12}px;
    top: ${y + 12}px;
    background: rgba(26, 26, 26, 0.95);
    border: 1px solid rgba(255, 215, 0, 0.5);
    border-radius: 6px;
    padding: 8px 12px;
    color: #e0e0e0;
    font-family: 'Microsoft YaHei', Arial, sans-serif;
    font-size: 12px;
    line-height: 1.5;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    z-index: 1000;
    pointer-events: none;
    max-width: 260px;
    white-space: nowrap;
  `;

  tooltip.innerHTML = `<div style="color:#ffd700;font-weight:bold;margin-bottom:2px">
    ${point.year}年 · 起落值 ${point.value}
  </div>${point.event || ""}`;
  document.body.appendChild(tooltip);

  const rect = tooltip.getBoundingClientRect();
  if (rect.right > window.innerWidth) {
    tooltip.style.left = `${x - rect.width - 12}px`;
  }
  if (rect.bottom > window.innerHeight) {
    tooltip.style.top = `${y - rect.height - 12}px`;
  }
};

const hideChartTooltip = () => {
  const tooltip = document.getElementById("life-chart-tooltip");
  if (tooltip) tooltip.remove();
};

/**
 * 绘制指定诗人的人生起落折线图
 * @param {PIXI.Container} container - 图表容器
 * @param {Object} poet - 诗人数据
 */
export const drawLifeChart = (container, poet) => {
  // 每次重绘清空图表容器
  container.removeChildren();

  const points = buildPoints(poet);
  if (!points) return;

  const color = getPoetColor(poet.category);

  // 图表区域（去左右 margin，底部留年份标签空间）
  const chartLeft = timelineConfig.margin.left + 44;
  const chartRight = timelineConfig.width - timelineConfig.margin.right;
  const chartWidth = chartRight - chartLeft;
  const chartTop = timelineConfig.margin.top + CHART_TOP_OFFSET;
  const chartBottom = chartTop + CHART_H;
  const innerBottom = chartBottom - 36;

  const minYear = points[0].year;
  const maxYear = points[points.length - 1].year;
  const yearSpan = Math.max(maxYear - minYear, 1);

  const maxValue = Math.max(...points.map((p) => p.value), 1);

  const xFor = (year) => chartLeft + ((year - minYear) / yearSpan) * chartWidth;
  const yFor = (value) => innerBottom - (value / maxValue) * (innerBottom - chartTop);

  const graphics = new PIXI.Graphics();

  // 网格线 + 坐标轴
  const yStep = Math.max(Math.ceil(maxValue / 5), 1);
  for (let v = 0; v <= maxValue; v += yStep) {
    const gy = yFor(v);
    graphics.moveTo(chartLeft, gy).lineTo(chartRight, gy);
  }
  graphics.stroke({ width: 1, color: 0xffffff, alpha: gridAlpha });

  // 底部时间轴（横轴）
  graphics
    .moveTo(chartLeft, innerBottom)
    .lineTo(chartRight, innerBottom)
    .stroke({ width: 2, color: 0xffffff, alpha: 0.7 });
  // 纵轴
  graphics
    .moveTo(chartLeft, chartTop)
    .lineTo(chartLeft, innerBottom)
    .stroke({ width: 2, color: 0xffffff, alpha: 0.7 });

  container.addChild(graphics);

  // Y 轴刻度标签（起落值）
  for (let v = 0; v <= maxValue; v += yStep) {
    const label = new PIXI.Text({
      text: `${v}`,
      style: createTextStyle({
        fontSize: 14,
        fill: axisLabelColor,
        align: "right",
      }),
    });
    label.anchor.set(1, 0.5);
    label.x = chartLeft - 8;
    label.y = yFor(v);
    container.addChild(label);
  }

  // X 轴刻度标签（年份，均匀取约6个）
  const xTickCount = 6;
  for (let i = 0; i <= xTickCount; i++) {
    const year = Math.round(minYear + (i / xTickCount) * yearSpan);
    const label = new PIXI.Text({
      text: `${year}`,
      style: createTextStyle({
        fontSize: 14,
        fill: axisLabelColor,
        align: "center",
      }),
    });
    label.anchor.set(0.5, 0);
    label.x = xFor(year);
    label.y = innerBottom + 6;
    container.addChild(label);
  }

  // 折线 + 面积填充
  const line = new PIXI.Graphics();
  line.moveTo(xFor(points[0].year), yFor(points[0].value));
  for (let i = 1; i < points.length; i++) {
    line.lineTo(xFor(points[i].year), yFor(points[i].value));
  }
  line.stroke({ width: 3, color, alpha: 1 });

  const area = new PIXI.Graphics();
  area.moveTo(xFor(points[0].year), innerBottom);
  for (let i = 0; i < points.length; i++) {
    area.lineTo(xFor(points[i].year), yFor(points[i].value));
  }
  area.lineTo(xFor(points[points.length - 1].year), innerBottom);
  area.closePath().fill({ color, alpha: 0.28 });

  container.addChild(area);
  container.addChild(line);

  // 数据点（圆点 + value标注 + 悬停事件）
  let prevX = -1e9;
  points.forEach((p) => {
    const px = xFor(p.year);
    const py = yFor(p.value);

    const dot = new PIXI.Graphics();
    dot
      .circle(px, py, 5)
      .fill({ color, alpha: 1 })
      .stroke({ width: 2, color: 0xffffff, alpha: 0.95 });
    container.addChild(dot);

    // value 数值标注（避免与相邻点重叠）
    if (px - prevX > 30) {
      const valText = new PIXI.Text({
        text: `${p.value}`,
        style: createTextStyle({
          fontSize: 13,
          fill: 0xffffff,
          fontWeight: "bold",
          align: "center",
        }),
      });
      valText.anchor.set(0.5, 0.5);
      valText.x = px;
      valText.y = py - 14;
      container.addChild(valText);
      prevX = px;
    }

    // 悬停显示事件
    dot.eventMode = "static";
    dot.cursor = "pointer";
    dot.on("pointerover", (e) => {
      showChartTooltip(p, e.screen.x, e.screen.y);
    });
    dot.on("pointerout", () => hideChartTooltip());
  });
};
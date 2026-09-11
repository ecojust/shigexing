/**
 * 人生曲线绘制模块
 * 使用 poets.js 中诗人自带的 life 数据（人生起落点）绘制折线。
 * 单行布局：所有带 life 数据的诗人曲线叠加在同一个区域，用颜色区分。
 */

import * as PIXI from "pixi.js";
import { timelineConfig } from "./config.js";
import { getYearPosition } from "./utils.js";

// 单行叠加时用于区分不同诗人的颜色池
const POET_COLOR_PALETTE = [
  0x4fc3f7, 0xff8a65, 0x81c784, 0xffd54f, 0xba68c8, 0xf06292,
  0x4db6ac, 0x9575cd, 0xe57373, 0x64b5f6, 0xffb74d, 0xaed581,
  0x7986cb, 0xf48fb1, 0x4dd0e1, 0xff8f00, 0x7e57c2, 0x26c6da,
  0xffca28, 0xef5350, 0x66bb6a, 0x5c6bc0, 0x29b6f6, 0xab47bc,
];

/**
 * 将诗人的本地 life 数据转换为曲线数据
 * 格式: [{ time: 年份, value: 起落值, event: 事件说明 }]
 * @param {Object} poet - 诗人数据
 * @returns {Object|null} 曲线数据
 */
const normalizeLocalLife = (poet) => {
  if (!Array.isArray(poet.life) || poet.life.length < 2) return null;

  const points = poet.life
    .filter(
      (p) =>
        p &&
        typeof p.time === "number" &&
        typeof p.value === "number"
    )
    .map((p) => ({ year: p.time, count: p.value, event: p.event }))
    .sort((a, b) => a.year - b.year);

  if (points.length < 2) return null;

  let maxCount = 0;
  points.forEach((p) => {
    if (p.count > maxCount) maxCount = p.count;
  });

  return { points, maxCount: Math.max(maxCount, 1), source: "local" };
};

/**
 * 为指定索引的诗人生成区分颜色
 * @param {number} index - 诗人索引
 * @returns {number} 颜色值
 */
const getPoetLifeColor = (index) => {
  return POET_COLOR_PALETTE[index % POET_COLOR_PALETTE.length];
};

/**
 * 绘制人生曲线（带面积填充）
 * 单行布局：所有曲线共用同一纵向区域，横向按年份映射
 * @param {PIXI.Container} container - 诗人容器
 * @param {Object} poet - 诗人数据
 * @param {number} index - 诗人索引（用于取色）
 * @param {Object} curve - 曲线数据
 */
const drawCurveForPoet = (container, poet, index, curve) => {
  if (!curve || curve.points.length < 2) return;

  // 单行区域：从时间轴下方一直到画面底部
  const top = timelineConfig.margin.top + 3;
  const bottom = timelineConfig.height - timelineConfig.margin.bottom - 3;
  const height = Math.max(bottom - top, 1);

  const pts = curve.points.filter(
    (p) => p.year >= poet.birth && p.year <= poet.death
  );
  if (pts.length < 2) return;

  const first = pts[0];
  const last = pts[pts.length - 1];
  const color = getPoetLifeColor(index);

  const yFor = (count) => bottom - (count / curve.maxCount) * height;

  const graphics = new PIXI.Graphics();

  // 面积填充（人生曲线下方）
  graphics.moveTo(getYearPosition(first.year), bottom);
  pts.forEach((p) => graphics.lineTo(getYearPosition(p.year), yFor(p.count)));
  graphics
    .lineTo(getYearPosition(last.year), bottom)
    .closePath()
    .fill({ color, alpha: 0.12 });

  // 折线
  pts.forEach((p, i) => {
    const x = getYearPosition(p.year);
    const y = yFor(p.count);
    if (i === 0) graphics.moveTo(x, y);
    else graphics.lineTo(x, y);
  });
  graphics.stroke({ width: 2, color, alpha: 0.95 });

  container.addChild(graphics);

  // 绘制转折点圆点，悬停显示诗人名与事件
  pts.forEach((p) => {
    const dot = new PIXI.Graphics();
    dot
      .circle(getYearPosition(p.year), yFor(p.count), 4)
      .fill({ color, alpha: 1 })
      .stroke({ width: 1.5, color: 0xffffff, alpha: 0.9 });
    container.addChild(dot);

    dot.eventMode = "static";
    dot.cursor = "pointer";
    dot.on("pointerover", (e) => {
      showLifeTooltip(poet, p, e.screen.x, e.screen.y);
    });
    dot.on("pointerout", () => hideLifeTooltip());
  });
};

/**
 * 显示人生节点提示信息
 * @param {Object} poet - 诗人数据
 * @param {Object} point - 数据点
 * @param {number} x - 鼠标X坐标
 * @param {number} y - 鼠标Y坐标
 */
const showLifeTooltip = (poet, point, x, y) => {
  hideLifeTooltip();

  const tooltip = document.createElement("div");
  tooltip.id = "life-tooltip";
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
    max-width: 240px;
    white-space: nowrap;
  `;

  tooltip.innerHTML = `<div style="color:#ffd700;font-weight:bold;margin-bottom:2px">${poet.name} · ${point.year}年</div>${point.event || ""}`;
  document.body.appendChild(tooltip);

  // 调整位置确保不超出屏幕边界
  const rect = tooltip.getBoundingClientRect();
  if (rect.right > window.innerWidth) {
    tooltip.style.left = `${x - rect.width - 12}px`;
  }
  if (rect.bottom > window.innerHeight) {
    tooltip.style.top = `${y - rect.height - 12}px`;
  }
};

/**
 * 隐藏人生节点提示信息
 */
const hideLifeTooltip = () => {
  const tooltip = document.getElementById("life-tooltip");
  if (tooltip) tooltip.remove();
};

/**
 * 绘制所有带 life 数据诗人的人生折线（单行叠加）
 * @param {PIXI.Container} container - 诗人容器
 * @param {Array} poets - 诗人数据数组
 */
export const drawLifeCurves = (container, poets) => {
  const sortedPoets = [...poets].sort((a, b) => a.birth - b.birth);

  sortedPoets.forEach((poet, index) => {
    const curve = normalizeLocalLife(poet);
    if (curve) drawCurveForPoet(container, poet, index, curve);
  });
};
/**
 * 帝皇绘制模块
 * 负责绘制帝皇时间块和交互
 */

import * as PIXI from "pixi.js";
import { timelineConfig } from "./config.js";
import { getYearPosition } from "./utils.js";

/**
 * 绘制帝皇时间块
 * @param {PIXI.Container} container - 帝皇容器
 * @param {Array} emperors - 帝皇数据数组
 * @param {boolean} visible - 是否显示帝皇
 * @param {Function} onEmperorHover - 帝皇悬停回调
 * @param {Function} onEmperorOut - 帝皇移出回调
 */
export const drawEmperors = (
  container,
  emperors,
  visible = true,
  onEmperorHover,
  onEmperorOut
) => {
  // 清空容器
  container.removeChildren();

  if (!visible) return;

  emperors.forEach((emperor, index) => {
    const startY = getYearPosition(emperor.start);
    const endY = getYearPosition(emperor.end);
    const height = Math.max(endY - startY, 1);

    // 帝皇时间块的水平位置
    const x = timelineConfig.margin.left + 180;
    const width = 120;

    // 帝皇时间块
    const emperorBar = new PIXI.Graphics();

    // 根据朝代选择颜色，但稍微深一些
    const baseColor = emperor.color;
    const darkerColor = ((baseColor >> 1) & 0x7f7f7f) + (baseColor & 0x808080);

    emperorBar
      .rect(x, startY, width, height)
      .fill({ color: baseColor, alpha: 0.3 })
      .stroke({ width: 1, color: darkerColor, alpha: 0.8 });

    container.addChild(emperorBar);

    // 添加交互
    emperorBar.eventMode = "static";
    emperorBar.cursor = "pointer";
    emperorBar.emperorData = emperor;

    // 悬停效果
    emperorBar.on("pointerover", (e) => {
      emperorBar.alpha = 1.2;
      if (onEmperorHover) {
        onEmperorHover(emperor, emperorBar, e.screen.x, e.screen.y);
      }
    });

    emperorBar.on("pointerout", () => {
      emperorBar.alpha = 1;
      if (onEmperorOut) {
        onEmperorOut();
      }
    });
  });
};

/**
 * 显示帝皇提示信息
 * @param {Object} emperor - 帝皇数据
 * @param {Object} target - 目标图形对象
 * @param {number} x - 鼠标X坐标
 * @param {number} y - 鼠标Y坐标
 */
export const showEmperorTooltip = (emperor, target, x, y) => {
  // 先移除已存在的提示框
  hideEmperorTooltip();

  // 创建HTML tooltip元素
  const tooltip = document.createElement("div");
  tooltip.id = "emperor-tooltip";
  tooltip.style.cssText = `
    position: fixed;
    left: ${x}px;
    top: ${y}px;
    background: rgba(26, 26, 26, 0.95);
    border: 1px solid rgba(68, 68, 68, 0.8);
    border-radius: 6px;
    padding: 10px;
    color: #e0e0e0;
    font-family: 'Microsoft YaHei', Arial, sans-serif;
    font-size: 11px;
    line-height: 1.4;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    z-index: 1000;
    pointer-events: none;
    max-width: 200px;
    white-space: nowrap;
  `;

  // 构建tooltip内容
  const lines = [
    emperor.name,
    `本名：${emperor.fullName}`,
    emperor.dynasty,
    `${emperor.start}-${emperor.end}(${emperor.end - emperor.start})年`,
  ];

  // 如果有描述且不太长，添加描述
  if (emperor.description && emperor.description.length < 50) {
    lines.push(emperor.description);
  }

  // 创建内容HTML
  const content = lines
    .map((line, index) => {
      const isTitle = index === 0;
      return `<div style="
      color: ${isTitle ? "#ffd700" : "#e0e0e0"};
      font-size: ${isTitle ? "13px" : "11px"};
      font-weight: ${isTitle ? "bold" : "normal"};
      margin-bottom: ${isTitle ? "4px" : "2px"};
    ">${line}</div>`;
    })
    .join("");

  tooltip.innerHTML = content;
  document.body.appendChild(tooltip);

  // 调整位置确保不超出屏幕边界
  const rect = tooltip.getBoundingClientRect();
  const screenWidth = window.innerWidth;
  const screenHeight = window.innerHeight;

  let adjustedX = x;
  let adjustedY = y;

  // 如果超出右边界，向左调整
  if (rect.right > screenWidth) {
    adjustedX = screenWidth - rect.width - 10;
  }

  // 如果超出下边界，向上调整
  if (rect.bottom > screenHeight) {
    adjustedY = screenHeight - rect.height - 10;
  }

  // 确保不超出左边界和上边界
  if (adjustedX < 10) {
    adjustedX = 10;
  }
  if (adjustedY < 10) {
    adjustedY = 10;
  }

  tooltip.style.left = `${adjustedX}px`;
  tooltip.style.top = `${adjustedY}px`;
};

/**
 * 隐藏帝皇提示信息
 */
export const hideEmperorTooltip = () => {
  const tooltip = document.getElementById("emperor-tooltip");
  if (tooltip) {
    tooltip.remove();
  }
};

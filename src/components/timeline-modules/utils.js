/**
 * 绘制工具模块
 * 提供通用的绘制工具函数
 */

import { timelineConfig, poetColorMap } from "./config.js";

/**
 * 计算年份在时间轴上的位置
 * @param {number} year - 年份
 * @returns {number} Y坐标位置
 */
export const getYearPosition = (year) => {
  const totalYears = timelineConfig.maxYear - timelineConfig.minYear;
  const yearOffset = year - timelineConfig.minYear;
  return (yearOffset / totalYears) * timelineConfig.height;
};

/**
 * 根据诗人类别获取颜色
 * @param {string} category - 诗人类别
 * @returns {number} 颜色值
 */
export const getPoetColor = (category) => {
  return poetColorMap[category] || 0xf39c12;
};

/**
 * 创建文本样式配置
 * @param {Object} options - 样式选项
 * @returns {Object} PIXI文本样式
 */
export const createTextStyle = (options = {}) => {
  const defaults = {
    fontFamily: "Microsoft YaHei, Arial",
    fontSize: 24,
    fill: 0x333333,
    fontWeight: "normal",
    align: "left",
  };

  return { ...defaults, ...options };
};

/**
 * 限制数值在指定范围内
 * @param {number} value - 输入值
 * @param {number} min - 最小值
 * @param {number} max - 最大值
 * @returns {number} 限制后的值
 */
export const clamp = (value, min, max) => {
  return Math.max(min, Math.min(max, value));
};

/**
 * 缓动函数 - 三次方缓出
 * @param {number} t - 时间进度 (0-1)
 * @returns {number} 缓动后的进度
 */
export const easeOutCubic = (t) => {
  return 1 - Math.pow(1 - t, 3);
};

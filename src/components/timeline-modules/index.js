/**
 * 时间轴模块入口文件
 * 导出所有模块的公共接口
 */

// 配置模块
export {
  timelineConfig,
  dynasties,
  poetColorMap,
  updateTimelineConfig,
} from "./config.js";

// 工具函数
export {
  getYearPosition,
  getPoetColor,
  createTextStyle,
  clamp,
  easeOutCubic,
} from "./utils.js";

// 数据处理
export {
  getAllEmperors,
  sortPoetsByBirth,
  filterPoets,
  findPoetByName,
} from "./data-processor.js";

// 渲染模块
export { drawTimeline } from "./timeline-renderer.js";
export { drawDynasties } from "./dynasty-renderer.js";
export {
  drawEmperors,
  showEmperorTooltip,
  hideEmperorTooltip,
} from "./emperor-renderer.js";
export { drawPoets, getPoetPosition } from "./poet-renderer.js";

// 交互控制
export {
  setupInteractions,
  centerView,
  resetView,
  zoomIn,
  zoomOut,
  animateToPoet,
} from "./interaction-controller.js";

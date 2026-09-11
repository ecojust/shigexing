/**
 * 交互控制模块
 * 管理用户交互功能，包括拖拽、缩放、动画等
 */

import { clamp, easeOutCubic } from "./utils.js";
import { getPoetPosition } from "./poet-renderer.js";

/**
 * 设置基本交互功能
 * @param {PIXI.Application} app - PIXI应用实例
 * @param {PIXI.Container} container - 主容器
 * @param {Object} zoomState - 缩放状态对象
 * @param {HTMLElement} pixiContainer - DOM容器元素
 */
export const setupInteractions = (app, container, zoomState, pixiContainer) => {
  // 启用交互
  app.stage.eventMode = "static";
  app.stage.hitArea = app.screen;

  // 添加拖拽功能
  setupDragInteraction(app, container);

  // 添加滚轮缩放
  setupZoomInteraction(container, zoomState, pixiContainer);
};

/**
 * 设置拖拽交互
 * @param {PIXI.Application} app - PIXI应用实例
 * @param {PIXI.Container} container - 主容器
 */
const setupDragInteraction = (app, container) => {
  let isDragging = false;
  let dragStart = { x: 0, y: 0 };

  app.stage.on("pointerdown", (event) => {
    isDragging = true;
    dragStart.x = event.global.x - container.x;
    dragStart.y = event.global.y - container.y;
  });

  app.stage.on("pointermove", (event) => {
    if (isDragging) {
      container.x = event.global.x - dragStart.x;
      container.y = event.global.y - dragStart.y;
    }
  });

  app.stage.on("pointerup", () => {
    isDragging = false;
  });

  app.stage.on("pointerupoutside", () => {
    isDragging = false;
  });
};

/**
 * 设置缩放交互
 * @param {PIXI.Container} container - 主容器
 * @param {Object} zoomState - 缩放状态对象
 * @param {HTMLElement} pixiContainer - DOM容器元素
 */
const setupZoomInteraction = (container, zoomState, pixiContainer) => {
  pixiContainer.addEventListener("wheel", (event) => {
    event.preventDefault();
    const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = clamp(zoomState.current * zoomFactor, 0.5, 3);

    // 计算缩放中心点
    const rect = pixiContainer.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    // 应用缩放
    const oldZoom = zoomState.current;
    zoomState.current = newZoom;

    // 调整位置以保持鼠标位置不变
    const zoomRatio = newZoom / oldZoom;
    container.x = mouseX - (mouseX - container.x) * zoomRatio;
    container.y = mouseY - (mouseY - container.y) * zoomRatio;
    container.scale.set(newZoom);
  });
};

/**
 * 居中视图
 * @param {PIXI.Container} container - 主容器
 * @param {Object} timelineConfig - 时间轴配置
 */
export const centerView = (container, timelineConfig) => {
  if (!container) return;

  // 内容区域 = 去除 margin 后的部分
  const contentWidth = timelineConfig.width - timelineConfig.margin.left - timelineConfig.margin.right;
  const contentHeight = timelineConfig.height - timelineConfig.margin.top - timelineConfig.margin.bottom;

  // 时间轴内容中心点（横轴-时间，纵轴-诗人，均为正坐标）
  const timelineCenter = {
    x: timelineConfig.margin.left + contentWidth / 2,
    y: timelineConfig.margin.top + contentHeight / 2,
  };

  // 计算屏幕中心点
  const screenCenter = {
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
  };

  // 考虑当前缩放比例，计算需要的偏移量
  const scale = container.scale.x;
  container.x = screenCenter.x - timelineCenter.x * scale;
  container.y = screenCenter.y - timelineCenter.y * scale;
};

/**
 * 重置视图到默认状态
 * @param {PIXI.Container} container - 主容器
 * @param {Object} zoomState - 缩放状态对象
 * @param {Object} timelineConfig - 时间轴配置
 */
export const resetView = (container, zoomState, timelineConfig) => {
  if (container) {
    container.scale.set(0.5);
    zoomState.current = 0.5;
    centerView(container, timelineConfig);
  }
};

/**
 * 适配屏幕：让整个时间轴内容完整显示在视口中
 * @param {PIXI.Container} container - 主容器
 * @param {Object} zoomState - 缩放状态对象
 * @param {Object} timelineConfig - 时间轴配置
 */
export const fitTimelineToScreen = (container, zoomState, timelineConfig) => {
  if (!container) return;

  // 内容实际尺寸
  const contentWidth = timelineConfig.width - timelineConfig.margin.left - timelineConfig.margin.right;
  const contentHeight = timelineConfig.height - timelineConfig.margin.top - timelineConfig.margin.bottom;

  // 视口尺寸（容器DOM）
  const viewportWidth = window.innerWidth - 20;
  const viewportHeight = window.innerHeight - 20;

  // 计算合适的缩放比例，确保完整显示
  let scale = Math.min(viewportWidth / contentWidth, viewportHeight / contentHeight);
  // 限制缩放范围（保证文字可读性）
  scale = clamp(scale, 0.5, 1);

  zoomState.current = scale;
  container.scale.set(scale);
  centerView(container, timelineConfig);
};

/**
 * 聚焦到指定诗人行，将其置于屏幕中央并放大到可读级别
 * @param {PIXI.Container} container - 主容器
 * @param {Object} zoomState - 缩放状态对象
 * @param {Object} poet - 诗人数据
 * @param {Array} allPoets - 所有诗人数据
 */
export const focusOnPoet = (container, zoomState, poet, allPoets) => {
  if (!container || !poet) return;

  const { x, y } = getPoetPosition(poet, allPoets);
  const scale = 1;

  zoomState.current = scale;
  container.scale.set(scale);
  container.x = window.innerWidth / 2 - x * scale;
  container.y = window.innerHeight / 2 - y * scale;
};

/**
 * 放大视图
 * @param {PIXI.Container} container - 主容器
 * @param {Object} zoomState - 缩放状态对象
 */
export const zoomIn = (container, zoomState) => {
  if (container && zoomState.current < 3) {
    zoomState.current *= 1.2;
    container.scale.set(zoomState.current);
  }
};

/**
 * 缩小视图
 * @param {PIXI.Container} container - 主容器
 * @param {Object} zoomState - 缩放状态对象
 */
export const zoomOut = (container, zoomState) => {
  if (container && zoomState.current > 0.5) {
    zoomState.current /= 1.2;
    container.scale.set(zoomState.current);
  }
};

/**
 * 动画移动到指定诗人位置
 * @param {PIXI.Container} container - 主容器
 * @param {Object} poet - 诗人数据
 * @param {Array} allPoets - 所有诗人数据
 * @param {number} duration - 动画持续时间（毫秒）
 */
export const animateToPoet = (container, poet, allPoets, duration = 1000) => {
  const poetPos = getPoetPosition(poet, allPoets);
  const targetX = -poetPos.x + 400;
  const targetY = -poetPos.y + 300;

  // 简单的缓动动画
  const startX = container.x;
  const startY = container.y;
  const startTime = Date.now();

  const animate = () => {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easeProgress = easeOutCubic(progress);

    container.x = startX + (targetX - startX) * easeProgress;
    container.y = startY + (targetY - startY) * easeProgress;

    if (progress < 1) {
      requestAnimationFrame(animate);
    }
  };

  animate();
};

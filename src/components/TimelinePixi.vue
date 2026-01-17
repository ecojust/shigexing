<template>
  <div class="timeline-container">
    <h2 class="timeline-title">唐宋文学时间线 (618-1279)</h2>

    <!-- 控制面板 -->
    <div class="control-panel">
      <div class="search-box">
        <input
          v-model="searchQuery"
          @input="handleSearch"
          placeholder="搜索诗人..."
          class="search-input"
        />
      </div>
      <button @click="resetView" class="control-btn">重置视图</button>
      <button @click="toggleDynasty" class="control-btn">
        {{ showDynasty ? "隐藏朝代" : "显示朝代" }}
      </button>
      <div class="zoom-controls">
        <button @click="zoomIn" class="control-btn">放大</button>
        <button @click="zoomOut" class="control-btn">缩小</button>
      </div>
    </div>

    <!-- PixiJS 画布容器 -->
    <div ref="pixiContainer" class="pixi-container"></div>

    <!-- 图例 -->
    <div class="legend">
      <div class="legend-item poet">
        <div class="legend-color"></div>
        <span>诗人生活时间</span>
      </div>
      <div v-if="showDynasty" class="legend-item dynasty">
        <div class="legend-color"></div>
        <span>朝代分界</span>
      </div>
      <div v-if="showDynasty" class="legend-item emperor">
        <div class="legend-color"></div>
        <span>帝皇在位时间</span>
      </div>
    </div>

    <!-- 诗人信息面板 -->
    <div v-if="selectedPoet" class="poet-info-panel">
      <div class="poet-info-header">
        <h3>{{ selectedPoet.name }}</h3>
        <button @click="closePoetInfo" class="close-btn">×</button>
      </div>
      <div class="poet-info-content">
        <p><strong>朝代：</strong>{{ selectedPoet.dynasty }}</p>
        <p>
          <strong>生卒：</strong>{{ selectedPoet.birth }}-{{
            selectedPoet.death
          }}年 ({{ selectedPoet.death - selectedPoet.birth }}岁)
        </p>
        <p><strong>流派：</strong>{{ selectedPoet.category }}</p>
        <p><strong>风格：</strong>{{ selectedPoet.style }}</p>
        <p><strong>描述：</strong>{{ selectedPoet.description }}</p>
        <div v-if="selectedPoet.famousWorks" class="famous-works">
          <strong>代表作品：</strong>
          <ul>
            <li v-for="work in selectedPoet.famousWorks" :key="work">
              {{ work }}
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from "vue";
import * as PIXI from "pixi.js";
import poets from "../timeline/poets.js";

import tangTimeline from "../timeline/tang.js";
import northSongTimeline from "../timeline/northsong.js";
import southSongTimeline from "../timeline/southsong.js";
import fiveDynastiesTimeline from "../timeline/fivedynasties.js";

const pixiContainer = ref(null);
let app = null;
let container = null;
let timelineContainer = null;
let dynastyContainer = null;
let emperorContainer = null;
let poetContainer = null;

const showDynasty = ref(true);
const selectedPoet = ref(null);
const currentZoom = ref(0.1);
const searchQuery = ref("");

// 时间轴配置
const timelineConfig = {
  minYear: 600,
  maxYear: 1300,
  width: (window.innerWidth - 200) * 2, // 动态宽度
  height: (window.innerHeight - 100) * 2, // 增加高度，让时间刻度更大
  margin: { top: 50, right: 100, bottom: 50, left: 100 },
  poetBarWidth: 80,
  poetBarSpacing: 60,
};

// 朝代数据
const dynasties = [
  { name: "唐朝", start: 618, end: 907, color: 0xff6b9d },
  { name: "五代十国", start: 907, end: 960, color: 0x6c5ce7 },
  { name: "北宋", start: 960, end: 1127, color: 0x0fb9b1 },
  { name: "南宋", start: 1127, end: 1279, color: 0x3867d6 },
];

// 合并所有朝代的帝皇数据
const getAllEmperors = () => {
  const allEmperors = [];

  // 唐朝皇帝
  tangTimeline.forEach((emperor) => {
    allEmperors.push({
      name: emperor.title,
      fullName: emperor.name,
      dynasty: "唐朝",
      start: emperor.from,
      end: emperor.to,
      description: emperor.description,
      color: 0xff6b9d,
    });
  });

  // 五代十国
  fiveDynastiesTimeline.forEach((emperor) => {
    allEmperors.push({
      name: emperor.title,
      fullName: emperor.name,
      dynasty: "五代十国",
      start: emperor.from,
      end: emperor.to,
      description: emperor.description,
      color: 0x6c5ce7,
    });
  });

  // 北宋皇帝
  northSongTimeline.forEach((emperor) => {
    allEmperors.push({
      name: emperor.title,
      fullName: emperor.name,
      dynasty: "北宋",
      start: emperor.from,
      end: emperor.to,
      description: emperor.description,
      color: 0x0fb9b1,
    });
  });

  // 南宋皇帝
  southSongTimeline.forEach((emperor) => {
    allEmperors.push({
      name: emperor.title,
      fullName: emperor.name,
      dynasty: "南宋",
      start: emperor.from,
      end: emperor.to,
      description: emperor.description,
      color: 0x3867d6,
    });
  });

  return allEmperors;
};

const emperors = getAllEmperors();

// 计算年份在时间轴上的位置
const getYearPosition = (year) => {
  const totalYears = timelineConfig.maxYear - timelineConfig.minYear;
  const yearOffset = year - timelineConfig.minYear;
  return (
    (yearOffset / totalYears) * timelineConfig.height
    // timelineConfig.margin.top
  );
};

// 初始化 PixiJS 应用
const initPixiApp = async () => {
  try {
    // 创建 PixiJS 应用 - 使用新的 API
    app = new PIXI.Application();

    // 初始化应用
    await app.init({
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundColor: 0xf8f9fa,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    });

    // 添加到 DOM
    pixiContainer.value.appendChild(app.canvas);

    // 创建主容器
    container = new PIXI.Container();
    app.stage.addChild(container);

    // 设置默认缩放
    container.scale.set(0.5);
    currentZoom.value = 0.5;

    // 创建时间轴容器
    timelineContainer = new PIXI.Container();
    dynastyContainer = new PIXI.Container();
    emperorContainer = new PIXI.Container();
    poetContainer = new PIXI.Container();

    container.addChild(dynastyContainer);
    container.addChild(emperorContainer);
    container.addChild(timelineContainer);
    container.addChild(poetContainer);

    // 添加交互功能
    setupInteractions();

    // 绘制时间轴
    drawTimeline();
    drawDynasties();
    drawEmperors();
    drawPoets();

    // 初始化时居中显示
    centerView();
  } catch (error) {
    console.error("PixiJS 初始化失败:", error);
    // 如果 PixiJS 初始化失败，使用 Canvas 2D 作为后备
  }
};

// 设置交互功能
const setupInteractions = () => {
  // 启用交互
  app.stage.eventMode = "static";
  app.stage.hitArea = app.screen;

  // 添加拖拽功能
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

  // 添加滚轮缩放
  pixiContainer.value.addEventListener("wheel", (event) => {
    event.preventDefault();
    const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.5, Math.min(3, currentZoom.value * zoomFactor));

    // 计算缩放中心点
    const rect = pixiContainer.value.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    // 应用缩放
    const oldZoom = currentZoom.value;
    currentZoom.value = newZoom;

    // 调整位置以保持鼠标位置不变
    const zoomRatio = newZoom / oldZoom;
    container.x = mouseX - (mouseX - container.x) * zoomRatio;
    container.y = mouseY - (mouseY - container.y) * zoomRatio;
    container.scale.set(newZoom);
  });
};

// 绘制主时间轴
const drawTimeline = () => {
  const graphics = new PIXI.Graphics();

  // 主时间轴线 - 使用新的 API
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

    // 年份标签 - 使用新的 Text API
    const yearText = new PIXI.Text({
      text: year.toString(),
      style: {
        fontFamily: "Arial",
        fontSize: 24,
        fill: 0x333333,
        align: "right",
      },
    });
    yearText.anchor.set(1, 0.5);
    yearText.x = timelineConfig.margin.left - 15;
    yearText.y = y;
    timelineContainer.addChild(yearText);
  }

  timelineContainer.addChild(graphics);
};

// 绘制朝代背景
const drawDynasties = () => {
  if (!showDynasty.value) return;

  dynasties.forEach((dynasty) => {
    const startY = getYearPosition(dynasty.start);
    const endY = getYearPosition(dynasty.end);
    const height = endY - startY;

    // 朝代背景矩形 - 使用新的 API，扩大宽度为帝皇留出空间
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

    dynastyContainer.addChild(rect);

    // 朝代标签 - 使用新的 Text API
    const dynastyText = new PIXI.Text({
      text: dynasty.name,
      style: {
        fontFamily: "Microsoft YaHei, Arial",
        fontSize: 32,
        fill: dynasty.color,
        fontWeight: "bold",
      },
      // Origin points for transformations (0-1 range)
      lineAnchor: 0.5, // Center of each line
      wordAnchor: { x: 0, y: 0.5 }, // Left-center of each word
      charAnchor: { x: 0.5, y: 1 }, // Bottom-center of each character
      autoSplit: true, // Auto-update segments on text/style changes
      wordWrap: true,
    });
    // dynastyText.anchor.set(0, 0.5);
    dynastyText.x = timelineConfig.margin.left + 30;
    dynastyText.y = startY + 20;
    dynastyContainer.addChild(dynastyText);
  });
};

// 绘制帝皇时间块
const drawEmperors = () => {
  if (!showDynasty.value) return;

  emperors.forEach((emperor, index) => {
    const startY = getYearPosition(emperor.start);
    const endY = getYearPosition(emperor.end);
    const height = Math.max(endY - startY, 1); // 增加最小高度到16px，确保能容纳文字

    // 帝皇时间块的水平位置 - 在朝代背景内部
    const x = timelineConfig.margin.left + 180;
    const width = 120;

    // 帝皇时间块 - 使用新的 API
    const emperorBar = new PIXI.Graphics();

    // 根据朝代选择颜色，但稍微深一些
    const baseColor = emperor.color;
    const darkerColor = ((baseColor >> 1) & 0x7f7f7f) + (baseColor & 0x808080);

    emperorBar
      .rect(x, startY, width, height)
      .fill({ color: baseColor, alpha: 0.3 })
      .stroke({ width: 1, color: darkerColor, alpha: 0.8 });

    emperorContainer.addChild(emperorBar);

    // 帝皇姓名标签 - 调整显示条件
    // if (height > 14) {
    //   // 降低显示阈值
    //   const nameText = new PIXI.Text({
    //     text: emperor.name,
    //     style: {
    //       fontFamily: "Microsoft YaHei, Arial",
    //       fontSize: Math.min(11, Math.max(8, height / 1.5)), // 调整字体大小计算
    //       fill: darkerColor,
    //       fontWeight: "600",
    //       align: "center",
    //     },
    //   });
    //   nameText.anchor.set(0, 0.5);
    //   nameText.x = x + 5;
    //   nameText.y = startY + height / 2;

    //   // 如果文字太长，截断显示
    //   if (nameText.width > width - 10) {
    //     nameText.text = emperor.name.substring(0, 4) + "...";
    //   }

    //   emperorContainer.addChild(nameText);
    // }

    // 添加交互
    emperorBar.eventMode = "static";
    emperorBar.cursor = "pointer";

    // 存储帝皇数据到图形对象
    emperorBar.emperorData = emperor;

    // 悬停效果
    emperorBar.on("pointerover", (e) => {
      console.log(e);
      emperorBar.alpha = 1.2;
      // 显示帝皇信息提示
      showEmperorTooltip(emperor, emperorBar, e.screen.x, e.screen.y);
    });

    emperorBar.on("pointerout", () => {
      emperorBar.alpha = 1;
      hideEmperorTooltip();
    });
  });
};

// 显示帝皇提示信息
const showEmperorTooltip = (emperor, target, x, y) => {
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

// 隐藏帝皇提示信息
const hideEmperorTooltip = () => {
  const tooltip = document.getElementById("emperor-tooltip");
  if (tooltip) {
    tooltip.remove();
  }
};

// 绘制诗人时间条 - 类似图片中的垂直条形
const drawPoets = () => {
  const sortedPoets = [...poets].sort((a, b) => a.birth - b.birth);

  sortedPoets.forEach((poet, index) => {
    const startY = getYearPosition(poet.birth);
    const endY = getYearPosition(poet.death);
    const height = Math.max(endY - startY, 15); // 最小高度15px

    // 计算诗人条的水平位置（多列布局）- 调整位置避免与帝皇块重叠
    const column = index % 12; // 12列布局，更紧凑
    const x =
      timelineConfig.margin.left +
      280 + // 增加左边距，为帝皇块留出空间
      column * (timelineConfig.poetBarWidth + 12 * 3);

    // 诗人生活时间条 - 类似图片中的橙色边框矩形
    const poetBar = new PIXI.Graphics();

    // 根据诗人类别选择颜色
    const poetColor = getPoetColor(poet.category);

    // 绘制外边框（类似图片中的橙色边框）- 使用新的 API
    poetBar
      .rect(x, startY, timelineConfig.poetBarWidth, height)
      .fill({ color: poetColor, alpha: 0.15 })
      .stroke({ width: 2, color: poetColor });

    // 绘制内部实心部分（代表诗人的创作高峰期）
    if (poet.peakPeriod) {
      const peakStartY = getYearPosition(poet.peakPeriod.start);
      const peakEndY = getYearPosition(poet.peakPeriod.end);
      const peakHeight = Math.max(peakEndY - peakStartY, 8);

      poetBar
        .rect(x + 3, peakStartY, timelineConfig.poetBarWidth - 6, peakHeight)
        .fill({ color: poetColor, alpha: 0.8 });
    }

    // 诗人姓名标签 - 放在时间条的顶部外侧
    const nameText = new PIXI.Text({
      text: poet.name,
      style: {
        fontFamily: "Microsoft YaHei, Arial",
        fontSize: 27,
        fill: poetColor,
        fontWeight: "bold",
        align: "center",
      },
    });
    nameText.anchor.set(0.5, 1);
    nameText.x = x + timelineConfig.poetBarWidth / 2;
    nameText.y = startY - 3;

    poetContainer.addChild(poetBar);
    poetContainer.addChild(nameText);

    // 添加交互
    poetBar.eventMode = "static";
    poetBar.cursor = "pointer";

    // 存储诗人数据到图形对象
    poetBar.poetData = poet;

    poetBar.on("pointerdown", () => {
      selectedPoet.value = poet;
    });

    // 悬停效果
    poetBar.on("pointerover", () => {
      poetBar.alpha = 1.2;
      nameText.style.fill = 0x000000;
      //   nameText.style.fontSize = 11;
    });

    poetBar.on("pointerout", () => {
      poetBar.alpha = 1;
      nameText.style.fill = poetColor;
      //   nameText.style.fontSize = 9;
    });
  });
};

const getPoetColor = (category) => {
  const colorMap = {
    初唐四杰: 0xff9999,
    诗歌革新派: 0xff6666,
    浪漫主义: 0xff3333,
    现实主义: 0xcc3333,
    山水田园派: 0x66cc66,
    边塞诗派: 0x996633,
    古文运动: 0x6699cc,
    新乐府运动: 0x3366cc,
    咏史怀古: 0x9966cc,
    象征派: 0x663399,
    咏史抒怀: 0x996699,
    花间派: 0xcc6699,
    婉约派: 0xff99cc,
    豪放派: 0xff6600,
    政治诗派: 0x666666,
    江西诗派: 0x669999,
    爱国诗派: 0xcc0000,
    诚斋体: 0x99cc99,
    田园诗派: 0x66cc99,
  };
  return colorMap[category] || 0xf39c12;
};

// 居中视图
const centerView = () => {
  if (!container) return;

  // 计算时间轴内容的中心点
  const timelineCenter = {
    x:
      timelineConfig.margin.left +
      (timelineConfig.width -
        timelineConfig.margin.left -
        timelineConfig.margin.right) /
        2,
    y: timelineConfig.height / 2,
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

// 控制方法
const resetView = () => {
  if (container) {
    container.scale.set(0.5);
    currentZoom.value = 0.5;
    centerView();
  }
};

const toggleDynasty = () => {
  showDynasty.value = !showDynasty.value;
  if (dynastyContainer) {
    dynastyContainer.visible = showDynasty.value;
  }
  if (emperorContainer) {
    emperorContainer.visible = showDynasty.value;
  }
};

const zoomIn = () => {
  if (container && currentZoom.value < 3) {
    currentZoom.value *= 1.2;
    container.scale.set(currentZoom.value);
  }
};

const zoomOut = () => {
  if (container && currentZoom.value > 0.5) {
    currentZoom.value /= 1.2;
    container.scale.set(currentZoom.value);
  }
};

const closePoetInfo = () => {
  selectedPoet.value = null;
};

// 搜索功能
const handleSearch = () => {
  if (!searchQuery.value.trim()) return;

  const poet = poets.find(
    (p) =>
      p.name.includes(searchQuery.value) ||
      p.dynasty.includes(searchQuery.value) ||
      p.category.includes(searchQuery.value)
  );

  if (poet) {
    selectedPoet.value = poet;
    animateToPoet(poet);
  }
};

// 添加搜索功能
const searchPoet = (name) => {
  const poet = poets.find((p) => p.name.includes(name));
  if (poet) {
    selectedPoet.value = poet;
    // 将视图移动到诗人位置
    const poetIndex = poets.findIndex((p) => p.name === poet.name);
    const column = poetIndex % 12;
    const x =
      timelineConfig.margin.left +
      280 + // 调整位置避免与帝皇块重叠
      column * (timelineConfig.poetBarWidth + 12);
    const y = getYearPosition(poet.birth);

    container.x = -x + 400;
    container.y = -y + 300;
  }
};

// 添加动画效果
const animateToPoet = (poet) => {
  const poetIndex = poets.findIndex((p) => p.name === poet.name);
  const column = poetIndex % 12;
  const targetX =
    -(
      timelineConfig.margin.left +
      280 + // 调整位置避免与帝皇块重叠
      column * (timelineConfig.poetBarWidth + 12)
    ) + 400;
  const targetY = -getYearPosition(poet.birth) + 300;

  // 简单的缓动动画
  const startX = container.x;
  const startY = container.y;
  const duration = 1000; // 1秒
  const startTime = Date.now();

  const animate = () => {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);

    // 使用缓动函数
    const easeProgress = 1 - Math.pow(1 - progress, 3);

    container.x = startX + (targetX - startX) * easeProgress;
    container.y = startY + (targetY - startY) * easeProgress;

    if (progress < 1) {
      requestAnimationFrame(animate);
    }
  };

  animate();
};

// 窗口大小变化处理
const handleResize = () => {
  if (app) {
    app.renderer.resize(window.innerWidth, window.innerHeight);

    // 更新时间轴配置
    timelineConfig.width = window.innerWidth - 200;
    timelineConfig.height = (window.innerHeight - 100) * 2; // 保持2倍高度

    // 重新绘制所有元素
    if (timelineContainer) timelineContainer.removeChildren();
    if (dynastyContainer) dynastyContainer.removeChildren();
    if (emperorContainer) emperorContainer.removeChildren();
    if (poetContainer) poetContainer.removeChildren();

    drawTimeline();
    drawDynasties();
    drawEmperors();
    drawPoets();

    // 窗口大小变化后重新居中
    centerView();
  }
};

// 生命周期
onMounted(async () => {
  await nextTick();
  initPixiApp();

  // 添加窗口大小变化监听
  window.addEventListener("resize", handleResize);
});

onUnmounted(() => {
  // 移除窗口大小变化监听
  window.removeEventListener("resize", handleResize);

  if (app) {
    app.destroy(true, true);
  }
});
</script>

<style lang="less" scoped>
.timeline-container {
  width: 100%;
  height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
  box-sizing: border-box;
  position: relative;
  overflow: hidden;
}

.timeline-title {
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  color: white;
  margin: 0;
  font-size: 28px;
  font-weight: 700;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
  letter-spacing: 2px;
  z-index: 20;
}

.control-panel {
  position: fixed;
  top: 80px;
  right: 20px;
  z-index: 30;
  display: flex;
  flex-direction: column;
  gap: 10px;

  .search-box {
    .search-input {
      width: 100%;
      padding: 8px 12px;
      border: none;
      border-radius: 20px;
      background: rgba(255, 255, 255, 0.9);
      color: #2c3e50;
      font-size: 12px;
      font-weight: 600;
      backdrop-filter: blur(10px);
      transition: all 0.3s ease;

      &::placeholder {
        color: #7f8c8d;
      }

      &:focus {
        outline: none;
        background: white;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
      }
    }
  }

  .control-btn {
    background: rgba(255, 255, 255, 0.9);
    border: none;
    padding: 8px 16px;
    border-radius: 20px;
    cursor: pointer;
    font-weight: 600;
    font-size: 12px;
    color: #2c3e50;
    transition: all 0.3s ease;
    backdrop-filter: blur(10px);

    &:hover {
      background: white;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    }
  }

  .zoom-controls {
    display: flex;
    gap: 5px;
  }
}

.pixi-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  overflow: hidden;
  z-index: 1;

  canvas {
    width: 100% !important;
    height: 100% !important;
  }
}

.legend {
  position: fixed;
  bottom: 20px;
  left: 20px;
  background: rgba(255, 255, 255, 0.9);
  padding: 15px;
  border-radius: 12px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 30;

  .legend-item {
    display: flex;
    align-items: center;
    margin-bottom: 8px;
    font-size: 12px;
    font-weight: 600;
    color: #2c3e50;

    &:last-child {
      margin-bottom: 0;
    }

    .legend-color {
      width: 16px;
      height: 16px;
      border-radius: 4px;
      margin-right: 8px;
      border: 1px solid rgba(0, 0, 0, 0.1);
    }

    &.poet .legend-color {
      background: #f39c12;
    }

    &.dynasty .legend-color {
      background: linear-gradient(45deg, #ff6b9d, #6c5ce7, #0fb9b1, #3867d6);
    }

    &.emperor .legend-color {
      background: linear-gradient(
        45deg,
        #ff6b9d 0%,
        #ff6b9d 25%,
        #6c5ce7 25%,
        #6c5ce7 50%,
        #0fb9b1 50%,
        #0fb9b1 75%,
        #3867d6 75%
      );
      opacity: 0.6;
    }
  }
}

.poet-info-panel {
  position: fixed;
  top: 50%;
  right: 20px;
  transform: translateY(-50%);
  width: 300px;
  max-height: 70vh;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 32px rgba(31, 38, 135, 0.37);
  overflow: hidden;
  z-index: 40;

  .poet-info-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 15px 20px;
    background: rgba(102, 126, 234, 0.1);
    border-bottom: 1px solid rgba(255, 255, 255, 0.2);

    h3 {
      margin: 0;
      color: #2c3e50;
      font-size: 18px;
      font-weight: 700;
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 24px;
      color: #666;
      cursor: pointer;
      padding: 0;
      width: 30px;
      height: 30px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      transition: all 0.3s ease;

      &:hover {
        background: rgba(255, 0, 0, 0.1);
        color: #e74c3c;
      }
    }
  }

  .poet-info-content {
    padding: 20px;
    max-height: calc(70vh - 80px);
    overflow-y: auto;

    p {
      margin: 0 0 10px 0;
      color: #2c3e50;
      font-size: 14px;
      line-height: 1.5;

      strong {
        color: #3498db;
      }
    }

    .famous-works {
      margin-top: 15px;

      ul {
        margin: 5px 0 0 0;
        padding-left: 20px;

        li {
          color: #2c3e50;
          font-size: 13px;
          margin-bottom: 3px;
        }
      }
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .timeline-container {
    padding: 10px;
  }

  .timeline-title {
    font-size: 20px;
    margin-bottom: 15px;
  }

  .control-panel {
    top: 60px;
    right: 10px;

    .control-btn {
      padding: 6px 12px;
      font-size: 11px;
    }
  }

  .pixi-container {
    height: calc(100vh - 120px);
  }

  .poet-info-panel {
    width: 250px;
    right: 10px;
  }
}
</style>

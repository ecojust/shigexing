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

// 导入模块化的时间轴组件
import {
  timelineConfig,
  updateTimelineConfig,
  getAllEmperors,
  findPoetByName,
  drawTimeline,
  drawDynasties,
  drawEmperors,
  drawPoets,
  showEmperorTooltip,
  hideEmperorTooltip,
  setupInteractions,
  centerView,
  resetView as resetViewModule,
  zoomIn as zoomInModule,
  zoomOut as zoomOutModule,
  animateToPoet,
} from "./timeline-modules/index.js";

const pixiContainer = ref(null);
let app = null;
let container = null;
let timelineContainer = null;
let dynastyContainer = null;
let emperorContainer = null;
let poetContainer = null;

const showDynasty = ref(true);
const selectedPoet = ref(null);
const zoomState = ref({ current: 0.1 });
const searchQuery = ref("");

// 获取帝皇数据
const emperors = getAllEmperors();

// 初始化 PixiJS 应用
const initPixiApp = async () => {
  try {
    // 创建 PixiJS 应用
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
    zoomState.value.current = 0.5;

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
    setupInteractions(app, container, zoomState.value, pixiContainer.value);

    // 绘制时间轴
    drawAllComponents();

    // 初始化时居中显示
    centerView(container, timelineConfig);
  } catch (error) {
    console.error("PixiJS 初始化失败:", error);
  }
};

// 绘制所有组件
const drawAllComponents = () => {
  drawTimeline(timelineContainer);
  drawDynasties(dynastyContainer, showDynasty.value);
  drawEmperors(
    emperorContainer,
    emperors,
    showDynasty.value,
    showEmperorTooltip,
    hideEmperorTooltip
  );
  drawPoets(poetContainer, poets, (poet) => {
    selectedPoet.value = poet;
  });
};

// 控制方法
const resetView = () => {
  resetViewModule(container, zoomState.value, timelineConfig);
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
  zoomInModule(container, zoomState.value);
};

const zoomOut = () => {
  zoomOutModule(container, zoomState.value);
};

const closePoetInfo = () => {
  selectedPoet.value = null;
};

// 搜索功能
const handleSearch = () => {
  if (!searchQuery.value.trim()) return;

  const poet = findPoetByName(poets, searchQuery.value);
  if (poet) {
    selectedPoet.value = poet;
    animateToPoet(container, poet, poets);
  }
};

// 窗口大小变化处理
const handleResize = () => {
  if (app) {
    app.renderer.resize(window.innerWidth, window.innerHeight);

    // 更新时间轴配置
    updateTimelineConfig();

    // 重新绘制所有元素
    drawAllComponents();

    // 窗口大小变化后重新居中
    centerView(container, timelineConfig);
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

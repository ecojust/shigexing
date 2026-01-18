<template>
  <div class="timeline-container">
    <h2 class="timeline-title">唐宋文学时间线 (618-1279)</h2>

    <!-- 控制面板 -->
    <div class="control-panel">
      <!-- <div class="search-box">
        <input
          v-model="searchQuery"
          @input="handleSearch"
          placeholder="搜索诗人..."
          class="search-input"
        />
      </div> -->
      <button @click="resetView" class="control-btn">重置视图</button>
      <button @click="toggleDynasty" class="control-btn">
        {{ showDynasty ? "隐藏朝代" : "显示朝代" }}
      </button>
      <!-- <div class="zoom-controls">
        <button @click="zoomIn" class="control-btn">放大</button>
        <button @click="zoomOut" class="control-btn">缩小</button>
      </div> -->
    </div>

    <!-- PixiJS 画布容器 -->
    <div ref="pixiContainer" class="pixi-container"></div>

    <!-- 图例 -->
    <!-- <div class="legend">
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
    </div> -->

    <!-- 诗人信息面板 -->
    <div v-if="selectedPoet" class="poet-info-panel">
      <div class="poet-info-header">
        <h3>{{ selectedPoet.name }}</h3>
        <button @click="closePoetInfo" class="close-btn">×</button>
      </div>
      <div class="poet-info-content">
        <!-- <p><strong>朝代：</strong>{{ selectedPoet.dynasty }}</p> -->
        <p>
          <strong>生卒：</strong>{{ selectedPoet.birth }}-{{
            selectedPoet.death
          }}年 ({{ selectedPoet.death - selectedPoet.birth }}岁)
        </p>
        <!-- <p><strong>流派：</strong>{{ selectedPoet.category }}</p>
        <p><strong>风格：</strong>{{ selectedPoet.style }}</p> -->
        <p><strong>描述：</strong>{{ selectedPoet.bio }}</p>
        <!-- <div v-if="selectedPoet.famousWorks" class="famous-works">
          <strong>代表作品：</strong>
          <ul>
            <li v-for="work in selectedPoet.famousWorks" :key="work">
              {{ work }}
            </li>
          </ul>
        </div> -->
      </div>
    </div>

    <!-- ElementPlus Dialog 显示诗人历史数据 -->
    <el-dialog
      v-model="dialogVisible"
      :title="`${currentPoetName} - 历史轨迹`"
      width="80%"
      :before-close="handleDialogClose"
      class="poet-history-dialog"
    >
      <div v-if="markersData.length > 0" class="markers-container">
        <el-timeline>
          <el-timeline-item
            v-for="(marker, index) in markersData"
            :key="index"
            :timestamp="marker.Year ? `${marker.Year}年` : '未知年份'"
            placement="top"
            :type="getTimelineItemType(marker)"
            size="large"
          >
            <el-card class="marker-card">
              <template #header>
                <div class="card-header">
                  <span class="marker-title">{{
                    marker.Title || "无标题"
                  }}</span>
                  <el-tag
                    v-if="marker.Type"
                    :type="getTagType(marker.Type)"
                    size="small"
                  >
                    {{ marker.Type }}
                  </el-tag>
                </div>
              </template>
              <div class="marker-content">
                <p v-if="marker.Detail" class="marker-detail">
                  {{ marker.Detail }}
                </p>
                <div v-if="marker.Location" class="marker-location">
                  <el-icon><Location /></el-icon>
                  <span>{{ marker.Location }}</span>
                </div>
                <div v-if="marker.Age" class="marker-age">
                  <el-icon><User /></el-icon>
                  <span>{{ marker.Age }}岁</span>
                </div>
              </div>
            </el-card>
          </el-timeline-item>
        </el-timeline>
      </div>
      <div v-else class="no-data">
        <el-empty description="暂无历史数据" />
      </div>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">关闭</el-button>
          <el-button type="primary" @click="exportData">导出数据</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from "vue";
import * as PIXI from "pixi.js";
import poets from "../timeline/poets.js";
import { ElMessage } from "element-plus";
import { Location, User } from "@element-plus/icons-vue";

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

// Dialog相关状态
const dialogVisible = ref(false);
const markersData = ref([]);
const currentPoetName = ref("");

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
      backgroundAlpha: 0,
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
  drawPoets(
    poetContainer,
    poets,
    (poet) => {
      selectedPoet.value = poet;
    },
    handleMarkersReceived
  );
};

// 处理markers数据接收
// 清理HTML标签的函数
const cleanHtmlContent = (htmlString) => {
  if (!htmlString) return "";

  // 创建一个临时div元素来解析HTML
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = htmlString;

  // 移除所有a标签但保留文本内容
  const links = tempDiv.querySelectorAll("a");
  links.forEach((link) => {
    const textNode = document.createTextNode(
      link.textContent || link.innerText
    );
    link.parentNode.replaceChild(textNode, link);
  });

  // 移除所有script标签
  const scripts = tempDiv.querySelectorAll("script");
  scripts.forEach((script) => script.remove());

  // 移除其他不需要的标签，只保留文本内容
  return tempDiv.textContent || tempDiv.innerText || "";
};

const handleMarkersReceived = (markers, poetName) => {
  // 清理markers数据中的HTML内容
  const cleanedMarkers = (markers || []).map((marker) => ({
    ...marker,
    Detail: cleanHtmlContent(marker.Detail),
    Title: cleanHtmlContent(marker.Title),
    Location: cleanHtmlContent(marker.Location),
  }));

  markersData.value = cleanedMarkers;
  currentPoetName.value = poetName;
  dialogVisible.value = true;

  if (cleanedMarkers && cleanedMarkers.length > 0) {
    ElMessage.success(
      `成功获取 ${poetName} 的 ${cleanedMarkers.length} 条历史记录`
    );
  } else {
    ElMessage.warning(`未找到 ${poetName} 的历史记录`);
  }
};

// Dialog相关方法
const handleDialogClose = (done) => {
  ElMessage.info("关闭历史轨迹对话框");
  done();
};

const getTimelineItemType = (marker) => {
  // 根据marker的类型或内容返回不同的timeline item类型
  if (marker.Type) {
    switch (marker.Type.toLowerCase()) {
      case "birth":
      case "出生":
        return "success";
      case "death":
      case "去世":
        return "danger";
      case "work":
      case "作品":
        return "primary";
      default:
        return "info";
    }
  }
  return "info";
};

const getTagType = (type) => {
  // 根据类型返回不同的tag样式
  switch (type.toLowerCase()) {
    case "birth":
    case "出生":
      return "success";
    case "death":
    case "去世":
      return "danger";
    case "work":
    case "作品":
      return "primary";
    case "travel":
    case "游历":
      return "warning";
    default:
      return "";
  }
};

const exportData = () => {
  // 导出数据功能
  const dataStr = JSON.stringify(markersData.value, null, 2);
  const dataBlob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${currentPoetName.value}_历史数据.json`;
  link.click();
  URL.revokeObjectURL(url);
  ElMessage.success("数据导出成功");
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
  background: linear-gradient(
    135deg,
    #1e3c72 0%,
    #2a5298 25%,
    #667eea 75%,
    #764ba2 100%
  );
  background-attachment: fixed;
  padding: 20px;
  box-sizing: border-box;
  position: relative;
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(
        circle at 20% 80%,
        rgba(120, 119, 198, 0.3) 0%,
        transparent 50%
      ),
      radial-gradient(
        circle at 80% 20%,
        rgba(255, 119, 198, 0.15) 0%,
        transparent 50%
      ),
      radial-gradient(
        circle at 40% 40%,
        rgba(120, 219, 226, 0.1) 0%,
        transparent 50%
      );
    pointer-events: none;
    z-index: 0;
  }
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
  text-shadow: 0 4px 8px rgba(0, 0, 0, 0.4), 0 2px 4px rgba(0, 0, 0, 0.2);
  letter-spacing: 2px;
  z-index: 20;
  backdrop-filter: blur(5px);
  padding: 10px 20px;
  border-radius: 25px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
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
      padding: 10px 16px;
      border: none;
      border-radius: 25px;
      background: rgba(255, 255, 255, 0.85);
      color: #2c3e50;
      font-size: 12px;
      font-weight: 600;
      backdrop-filter: blur(20px);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 4px 16px rgba(31, 38, 135, 0.15),
        inset 0 1px 0 rgba(255, 255, 255, 0.6);

      &::placeholder {
        color: #7f8c8d;
      }

      &:focus {
        outline: none;
        background: rgba(255, 255, 255, 0.95);
        transform: scale(1.02);
        box-shadow: 0 8px 25px rgba(31, 38, 135, 0.25),
          inset 0 1px 0 rgba(255, 255, 255, 0.8);
      }
    }
  }

  .control-btn {
    background: rgba(255, 255, 255, 0.85);
    border: none;
    padding: 10px 18px;
    border-radius: 25px;
    cursor: pointer;
    font-weight: 600;
    font-size: 12px;
    color: #2c3e50;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    backdrop-filter: blur(20px);
    box-shadow: 0 4px 16px rgba(31, 38, 135, 0.15),
      inset 0 1px 0 rgba(255, 255, 255, 0.6);

    &:hover {
      background: rgba(255, 255, 255, 0.95);
      transform: translateY(-3px) scale(1.02);
      box-shadow: 0 8px 25px rgba(31, 38, 135, 0.25),
        inset 0 1px 0 rgba(255, 255, 255, 0.8);
    }

    &:active {
      transform: translateY(-1px) scale(0.98);
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
  background: transparent;
  overflow: hidden;
  z-index: 1;
  border-radius: 25px;
  margin: 15px;
  width: calc(100vw - 30px);
  height: calc(100vh - 30px);

  canvas {
    width: 100% !important;
    height: 100% !important;
    border-radius: 25px;
  }
}

.legend {
  position: fixed;
  bottom: 20px;
  left: 20px;
  background: rgba(255, 255, 255, 0.85);
  padding: 20px;
  border-radius: 16px;
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 32px rgba(31, 38, 135, 0.25),
    inset 0 1px 0 rgba(255, 255, 255, 0.4);
  z-index: 30;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    transform: translateY(-2px);
    background: rgba(255, 255, 255, 0.95);
    box-shadow: 0 12px 40px rgba(31, 38, 135, 0.3),
      inset 0 1px 0 rgba(255, 255, 255, 0.5);
  }

  .legend-item {
    display: flex;
    align-items: center;
    margin-bottom: 10px;
    font-size: 12px;
    font-weight: 600;
    color: #2c3e50;

    &:last-child {
      margin-bottom: 0;
    }

    .legend-color {
      width: 18px;
      height: 18px;
      border-radius: 6px;
      margin-right: 10px;
      border: 1px solid rgba(0, 0, 0, 0.1);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    &.poet .legend-color {
      background: linear-gradient(45deg, #f39c12, #e67e22);
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
      opacity: 0.7;
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

// ElementPlus Dialog 样式
:deep(.poet-history-dialog) {
  .el-dialog__header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 20px;

    .el-dialog__title {
      color: white;
      font-weight: 700;
      font-size: 18px;
    }

    .el-dialog__headerbtn {
      .el-dialog__close {
        color: white;
        font-size: 20px;

        &:hover {
          color: #f1c40f;
        }
      }
    }
  }

  .el-dialog__body {
    padding: 20px;
    max-height: 60vh;
    overflow-y: auto;
  }

  .markers-container {
    .el-timeline {
      padding-left: 0;

      .el-timeline-item {
        .el-timeline-item__timestamp {
          font-weight: 600;
          color: #3498db;
          font-size: 14px;
        }

        .marker-card {
          margin-bottom: 15px;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

          .el-card__header {
            background: rgba(102, 126, 234, 0.05);
            border-bottom: 1px solid rgba(102, 126, 234, 0.1);

            .card-header {
              display: flex;
              justify-content: space-between;
              align-items: center;

              .marker-title {
                font-weight: 600;
                color: #2c3e50;
                font-size: 16px;
              }
            }
          }

          .marker-content {
            .marker-detail {
              color: #34495e;
              line-height: 1.6;
              margin-bottom: 10px;
            }

            .marker-location,
            .marker-age {
              display: flex;
              align-items: center;
              gap: 5px;
              color: #7f8c8d;
              font-size: 14px;
              margin-bottom: 5px;

              .el-icon {
                font-size: 16px;
              }
            }
          }
        }
      }
    }
  }

  .no-data {
    text-align: center;
    padding: 40px 0;
  }

  .dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
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

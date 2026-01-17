<template>
  <div class="timeline-container">
    <h2 class="timeline-title">中国古代诗人时间线 (618-1279)</h2>

    <!-- 控制面板 -->
    <div class="control-panel">
      <button @click="resetView" class="control-btn">重置视图</button>
      <button @click="toggleDynasty" class="control-btn">
        {{ showDynasty ? "隐藏朝代" : "显示朝代" }}
      </button>
      <div class="zoom-controls">
        <button @click="zoomIn" class="control-btn">放大</button>
        <button @click="zoomOut" class="control-btn">缩小</button>
      </div>
    </div>

    <!-- Canvas 画布容器 -->
    <div ref="canvasContainer" class="canvas-container">
      <canvas
        ref="canvas"
        @click="handleCanvasClick"
        @wheel="handleWheel"
        @mousedown="handleMouseDown"
        @mousemove="handleMouseMove"
        @mouseup="handleMouseUp"
        @mouseleave="handleMouseUp"
      ></canvas>
    </div>

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
import poets from "../timeline/poets.js";

const canvasContainer = ref(null);
const canvas = ref(null);
let ctx = null;

const showDynasty = ref(true);
const selectedPoet = ref(null);
const currentZoom = ref(1);
const offsetX = ref(0);
const offsetY = ref(0);

// 鼠标交互状态
const isDragging = ref(false);
const lastMouseX = ref(0);
const lastMouseY = ref(0);

// 时间轴配置
const timelineConfig = {
  minYear: 600,
  maxYear: 1300,
  width: 1200,
  height: 800,
  margin: { top: 50, right: 100, bottom: 50, left: 100 },
  poetBarWidth: 35,
  poetBarSpacing: 45,
};

// 朝代数据
const dynasties = [
  { name: "唐朝", start: 618, end: 907, color: "#ff6b9d" },
  { name: "五代十国", start: 907, end: 960, color: "#6c5ce7" },
  { name: "北宋", start: 960, end: 1127, color: "#0fb9b1" },
  { name: "南宋", start: 1127, end: 1279, color: "#3867d6" },
];

// 计算年份在时间轴上的位置
const getYearPosition = (year) => {
  const totalYears = timelineConfig.maxYear - timelineConfig.minYear;
  const yearOffset = year - timelineConfig.minYear;
  return (
    (yearOffset / totalYears) * timelineConfig.height +
    timelineConfig.margin.top
  );
};

// 初始化 Canvas
const initCanvas = () => {
  const canvasEl = canvas.value;
  const container = canvasContainer.value;

  // 设置 canvas 尺寸
  canvasEl.width =
    timelineConfig.width +
    timelineConfig.margin.left +
    timelineConfig.margin.right;
  canvasEl.height =
    timelineConfig.height +
    timelineConfig.margin.top +
    timelineConfig.margin.bottom;

  // 设置 CSS 尺寸以适应容器
  const containerRect = container.getBoundingClientRect();
  const scale = Math.min(
    containerRect.width / canvasEl.width,
    containerRect.height / canvasEl.height
  );
  canvasEl.style.width = canvasEl.width * scale + "px";
  canvasEl.style.height = canvasEl.height * scale + "px";

  ctx = canvasEl.getContext("2d");

  // 绘制时间轴
  drawAll();
};

// 绘制所有内容
const drawAll = () => {
  if (!ctx) return;

  // 清空画布
  ctx.clearRect(0, 0, canvas.value.width, canvas.value.height);

  // 应用变换
  ctx.save();
  ctx.scale(currentZoom.value, currentZoom.value);
  ctx.translate(offsetX.value, offsetY.value);

  // 绘制背景
  ctx.fillStyle = "#f8f9fa";
  ctx.fillRect(0, 0, canvas.value.width, canvas.value.height);

  // 绘制朝代背景
  if (showDynasty.value) {
    drawDynasties();
  }

  // 绘制时间轴
  drawTimeline();

  // 绘制诗人
  drawPoets();

  ctx.restore();
};

// 绘制主时间轴
const drawTimeline = () => {
  // 主时间轴线
  ctx.strokeStyle = "#333333";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(timelineConfig.margin.left, timelineConfig.margin.top);
  ctx.lineTo(
    timelineConfig.margin.left,
    timelineConfig.height + timelineConfig.margin.top
  );
  ctx.stroke();

  // 绘制年份刻度
  const yearStep = 50;
  ctx.font = "12px Arial";
  ctx.fillStyle = "#333333";
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";

  for (
    let year = Math.ceil(timelineConfig.minYear / yearStep) * yearStep;
    year <= timelineConfig.maxYear;
    year += yearStep
  ) {
    const y = getYearPosition(year);

    // 刻度线
    ctx.strokeStyle = "#666666";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(timelineConfig.margin.left - 10, y);
    ctx.lineTo(timelineConfig.margin.left + 10, y);
    ctx.stroke();

    // 年份标签
    ctx.fillText(year.toString(), timelineConfig.margin.left - 15, y);
  }
};

// 绘制朝代背景
const drawDynasties = () => {
  dynasties.forEach((dynasty) => {
    const startY = getYearPosition(dynasty.start);
    const endY = getYearPosition(dynasty.end);
    const height = endY - startY;

    // 朝代背景
    ctx.fillStyle = dynasty.color + "20"; // 添加透明度
    ctx.fillRect(
      timelineConfig.margin.left + 20,
      startY,
      timelineConfig.width - 40,
      height
    );

    // 朝代边框
    ctx.strokeStyle = dynasty.color;
    ctx.lineWidth = 2;
    ctx.strokeRect(
      timelineConfig.margin.left + 20,
      startY,
      timelineConfig.width - 40,
      height
    );

    // 朝代标签
    ctx.font = "bold 16px Microsoft YaHei, Arial";
    ctx.fillStyle = dynasty.color;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(dynasty.name, timelineConfig.margin.left + 30, startY + 20);
  });
};

// 绘制诗人时间条
const drawPoets = () => {
  const sortedPoets = [...poets].sort((a, b) => a.birth - b.birth);

  sortedPoets.forEach((poet, index) => {
    const startY = getYearPosition(poet.birth);
    const endY = getYearPosition(poet.death);
    const height = Math.max(endY - startY, 15);

    // 计算诗人条的水平位置（多列布局）
    const column = index % 12; // 12列布局
    const x =
      timelineConfig.margin.left + 150 + column * timelineConfig.poetBarSpacing;

    const poetColor = getPoetColor(poet.category);

    // 绘制外边框（类似图片中的橙色边框）
    ctx.strokeStyle = poetColor;
    ctx.lineWidth = 2;
    ctx.fillStyle = poetColor + "30"; // 半透明填充
    ctx.fillRect(x, startY, timelineConfig.poetBarWidth, height);
    ctx.strokeRect(x, startY, timelineConfig.poetBarWidth, height);

    // 绘制内部实心部分（代表诗人的创作高峰期）
    if (poet.peakPeriod) {
      const peakStartY = getYearPosition(poet.peakPeriod.start);
      const peakEndY = getYearPosition(poet.peakPeriod.end);
      const peakHeight = Math.max(peakEndY - peakStartY, 8);

      ctx.fillStyle = poetColor + "CC"; // 更不透明的填充
      ctx.fillRect(
        x + 3,
        peakStartY,
        timelineConfig.poetBarWidth - 6,
        peakHeight
      );
    }

    // 诗人姓名标签
    ctx.font = "bold 9px Microsoft YaHei, Arial";
    ctx.fillStyle = poetColor;
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.fillText(poet.name, x + timelineConfig.poetBarWidth / 2, startY - 3);
  });
};

// 根据诗人类别获取颜色
const getPoetColor = (category) => {
  const colorMap = {
    初唐四杰: "#ff9999",
    诗歌革新派: "#ff6666",
    浪漫主义: "#ff3333",
    现实主义: "#cc3333",
    山水田园派: "#66cc66",
    边塞诗派: "#996633",
    古文运动: "#6699cc",
    新乐府运动: "#3366cc",
    咏史怀古: "#9966cc",
    象征派: "#663399",
    咏史抒怀: "#996699",
    花间派: "#cc6699",
    婉约派: "#ff99cc",
    豪放派: "#ff6600",
    政治诗派: "#666666",
    江西诗派: "#669999",
    爱国诗派: "#cc0000",
    诚斋体: "#99cc99",
    田园诗派: "#66cc99",
  };
  return colorMap[category] || "#f39c12";
};

// 事件处理
const handleCanvasClick = (event) => {
  const rect = canvas.value.getBoundingClientRect();
  const scaleX = canvas.value.width / rect.width;
  const scaleY = canvas.value.height / rect.height;
  const x = (event.clientX - rect.left) * scaleX;
  const y = (event.clientY - rect.top) * scaleY;

  // 应用变换的逆变换
  const transformedX = x / currentZoom.value - offsetX.value;
  const transformedY = y / currentZoom.value - offsetY.value;

  // 检查是否点击了诗人条
  const sortedPoets = [...poets].sort((a, b) => a.birth - b.birth);

  sortedPoets.forEach((poet, index) => {
    const startY = getYearPosition(poet.birth);
    const endY = getYearPosition(poet.death);
    const height = Math.max(endY - startY, 15);

    const column = index % 12;
    const poetX =
      timelineConfig.margin.left + 150 + column * timelineConfig.poetBarSpacing;

    if (
      transformedX >= poetX &&
      transformedX <= poetX + timelineConfig.poetBarWidth &&
      transformedY >= startY &&
      transformedY <= startY + height
    ) {
      selectedPoet.value = poet;
    }
  });
};

const handleWheel = (event) => {
  event.preventDefault();
  const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1;
  const newZoom = Math.max(0.5, Math.min(3, currentZoom.value * zoomFactor));
  currentZoom.value = newZoom;
  drawAll();
};

const handleMouseDown = (event) => {
  isDragging.value = true;
  lastMouseX.value = event.clientX;
  lastMouseY.value = event.clientY;
};

const handleMouseMove = (event) => {
  if (isDragging.value) {
    const deltaX = event.clientX - lastMouseX.value;
    const deltaY = event.clientY - lastMouseY.value;

    offsetX.value += deltaX / currentZoom.value;
    offsetY.value += deltaY / currentZoom.value;

    lastMouseX.value = event.clientX;
    lastMouseY.value = event.clientY;

    drawAll();
  }
};

const handleMouseUp = () => {
  isDragging.value = false;
};

// 控制方法
const resetView = () => {
  currentZoom.value = 1;
  offsetX.value = 0;
  offsetY.value = 0;
  drawAll();
};

const toggleDynasty = () => {
  showDynasty.value = !showDynasty.value;
  drawAll();
};

const zoomIn = () => {
  if (currentZoom.value < 3) {
    currentZoom.value *= 1.2;
    drawAll();
  }
};

const zoomOut = () => {
  if (currentZoom.value > 0.5) {
    currentZoom.value /= 1.2;
    drawAll();
  }
};

const closePoetInfo = () => {
  selectedPoet.value = null;
};

// 生命周期
onMounted(async () => {
  await nextTick();
  initCanvas();

  // 监听窗口大小变化
  window.addEventListener("resize", initCanvas);
});

onUnmounted(() => {
  window.removeEventListener("resize", initCanvas);
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
  text-align: center;
  color: white;
  margin-bottom: 20px;
  font-size: 28px;
  font-weight: 700;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
  letter-spacing: 2px;
}

.control-panel {
  position: absolute;
  top: 80px;
  right: 20px;
  z-index: 10;
  display: flex;
  flex-direction: column;
  gap: 10px;

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

.canvas-container {
  width: 100%;
  height: calc(100vh - 160px);
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 32px rgba(31, 38, 135, 0.37);
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;

  canvas {
    border-radius: 12px;
    cursor: grab;

    &:active {
      cursor: grabbing;
    }
  }
}

.legend {
  position: absolute;
  bottom: 20px;
  left: 20px;
  background: rgba(255, 255, 255, 0.9);
  padding: 15px;
  border-radius: 12px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);

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
  }
}

.poet-info-panel {
  position: absolute;
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
  z-index: 20;

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

  .canvas-container {
    height: calc(100vh - 120px);
  }

  .poet-info-panel {
    width: 250px;
    right: 10px;
  }
}
</style>

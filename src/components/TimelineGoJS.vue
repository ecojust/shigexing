<template>
  <div class="timeline-container">
    <h2 class="timeline-title">中国古代王朝时间线 (618-1279)</h2>

    <!-- 控制面板 -->
    <div class="control-panel">
      <button @click="resetView" class="control-btn">重置视图</button>
      <button @click="toggleLayout" class="control-btn">
        {{ isVerticalLayout ? "水平布局" : "垂直布局" }}
      </button>
      <button @click="togglePoets" class="control-btn">
        {{ showPoets ? "隐藏诗人" : "显示诗人" }}
      </button>
      <div class="zoom-controls">
        <button @click="zoomIn" class="control-btn">放大</button>
        <button @click="zoomOut" class="control-btn">缩小</button>
      </div>
    </div>

    <!-- GoJS 图表容器 -->
    <div ref="diagramDiv" class="diagram-container"></div>

    <!-- 图例 -->
    <div class="legend">
      <div class="legend-item tang">
        <div class="legend-color"></div>
        <span>唐朝</span>
      </div>
      <div class="legend-item five-dynasties">
        <div class="legend-color"></div>
        <span>五代十国</span>
      </div>
      <div class="legend-item song">
        <div class="legend-color"></div>
        <span>北宋</span>
      </div>
      <div class="legend-item south-song">
        <div class="legend-color"></div>
        <span>南宋</span>
      </div>
      <div v-if="showPoets" class="legend-item poets">
        <div class="legend-color"></div>
        <span>诗人</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import * as go from "gojs";

// 导入数据
import tangTimeline from "../timeline/tang.js";
import northSongTimeline from "../timeline/northsong.js";
import southSongTimeline from "../timeline/southsong.js";
import fiveDynastiesTimeline from "../timeline/fivedynasties.js";
import poets from "../timeline/poets.js";

const diagramDiv = ref(null);
let diagram = null;
const isVerticalLayout = ref(true);
const showPoets = ref(true); // 控制是否显示诗人

// 准备数据
const prepareData = () => {
  const nodeDataArray = [];
  const linkDataArray = [];

  // 定义朝代类型和颜色
  const dynastyTypes = {
    tang: { color: "#ff6b9d", category: "唐朝", lane: 0 },
    "five-dynasties": { color: "#6c5ce7", category: "五代十国", lane: 1 },
    song: { color: "#0fb9b1", category: "北宋", lane: 0 },
    "south-song": { color: "#3867d6", category: "南宋", lane: 0 },
  };

  // 处理各朝代数据
  const processTimeline = (timeline, type) => {
    timeline.forEach((dynasty, index) => {
      const nodeId = `${type}_${index}`;
      nodeDataArray.push({
        key: nodeId,
        title: dynasty.title,
        name: dynasty.name,
        from: dynasty.from,
        to: dynasty.to,
        duration: dynasty.to - dynasty.from,
        description: dynasty.description,
        type: type,
        category: dynastyTypes[type].category,
        color: dynastyTypes[type].color,
        lane: dynastyTypes[type].lane,
        nodeType: "emperor",
        // 计算节点大小（基于在位时间）
        size: Math.max(60, Math.min(150, (dynasty.to - dynasty.from) * 3 + 60)),
      });

      // 创建时间顺序的连接
      if (index > 0) {
        linkDataArray.push({
          from: `${type}_${index - 1}`,
          to: nodeId,
          category: "succession",
        });
      }
    });
  };

  // 处理诗人数据
  const processPoets = () => {
    if (!showPoets.value) return;

    poets.forEach((poet, index) => {
      const nodeId = `poet_${index}`;
      nodeDataArray.push({
        key: nodeId,
        title: poet.name,
        name: poet.dynasty,
        from: poet.birth,
        to: poet.death,
        duration: poet.death - poet.birth,
        description: poet.description,
        famousWorks: poet.famousWorks,
        style: poet.style,
        category: poet.category,
        type: "poet",
        nodeType: "poet",
        color: "#f39c12", // 诗人使用橙色
        lane: 2, // 诗人使用第3泳道
        size: Math.max(50, Math.min(120, (poet.death - poet.birth) * 2 + 50)),
      });
    });
  };

  // 处理所有朝代
  processTimeline(tangTimeline, "tang");
  processTimeline(fiveDynastiesTimeline, "five-dynasties");
  processTimeline(northSongTimeline, "song");
  processTimeline(southSongTimeline, "south-song");

  // 处理诗人
  processPoets();

  return { nodeDataArray, linkDataArray };
};

// 自定义时间轴布局
const customTimelineLayout = () => {
  if (!diagram) return;

  const nodes = [];
  diagram.nodes.each((node) => nodes.push(node));

  const minYear = 618;
  const maxYear = 1279;
  const totalYears = maxYear - minYear;

  // 按时间排序
  nodes.sort((a, b) => a.data.from - b.data.from);

  // 布局节点
  nodes.forEach((node) => {
    const data = node.data;
    const yearProgress = (data.from - minYear) / totalYears;

    let x, y;
    if (isVerticalLayout.value) {
      // 垂直时间轴布局
      y = yearProgress * 800 + 100;
      x = data.lane * 250 + 200;
    } else {
      // 水平时间轴布局
      x = yearProgress * 1000 + 100;
      y = data.lane * 200 + 150;
    }

    node.location = new go.Point(x, y);
  });
};

// 初始化图表
const initDiagram = () => {
  const $ = go.GraphObject.make;

  diagram = $(go.Diagram, diagramDiv.value, {
    "undoManager.isEnabled": true,
    initialContentAlignment: go.Spot.Center,
    "toolManager.hoverDelay": 100,
    allowZoom: true,
    allowHorizontalScroll: true,
    allowVerticalScroll: true,
    layout: $(go.Layout, { isOngoing: false }),
  });

  // 定义节点模板
  diagram.nodeTemplate = $(
    go.Node,
    "Auto",
    {
      selectionAdorned: true,
      resizable: false,
      isShadowed: true,
      shadowOffset: new go.Point(2, 2),
      shadowColor: "rgba(0, 0, 0, 0.3)",
    },

    // 节点形状
    $(
      go.Shape,
      "RoundedRectangle",
      {
        fill: "white",
        stroke: "gray",
        strokeWidth: 2,
        parameter1: 8,
      },
      new go.Binding("fill", "color", (color) =>
        $(go.Brush, "Linear", {
          0: color,
          0.4: "white",
          0.6: "white",
          1: color,
        })
      ),
      new go.Binding("stroke", "color"),
      new go.Binding("width", "size", (size) => Math.max(140, size)),
      new go.Binding("height", "size", (size) => Math.max(90, size * 0.7))
    ),

    // 节点文本
    $(
      go.Panel,
      "Vertical",
      { margin: 10, alignment: go.Spot.Center },

      // 标题
      $(
        go.TextBlock,
        {
          font: "bold 15px sans-serif",
          stroke: "white",
          textAlign: "center",
          maxLines: 1,
          overflow: go.TextBlock.OverflowEllipsis,
        },
        new go.Binding("text", "title")
      ),

      // 姓名
      $(
        go.TextBlock,
        {
          font: "13px sans-serif",
          stroke: "white",
          textAlign: "center",
          maxLines: 1,
          overflow: go.TextBlock.OverflowEllipsis,
          margin: new go.Margin(2, 0, 0, 0),
        },
        new go.Binding("text", "name")
      ),

      // 年份
      $(
        go.TextBlock,
        {
          font: "11px sans-serif",
          stroke: "rgba(255, 255, 255, 0.9)",
          textAlign: "center",
          margin: new go.Margin(4, 0, 0, 0),
        },
        new go.Binding("text", "", (data) => `${data.from}-${data.to}`)
      ),

      // 在位时间
      $(
        go.TextBlock,
        {
          font: "10px sans-serif",
          stroke: "rgba(255, 255, 255, 0.8)",
          textAlign: "center",
          margin: new go.Margin(2, 0, 0, 0),
        },
        new go.Binding("text", "duration", (duration) => `${duration}年`)
      )
    ),

    // 工具提示
    {
      toolTip: $(
        go.Adornment,
        "Auto",
        $(go.Shape, {
          fill: "rgba(0, 0, 0, 0.9)",
          stroke: "white",
          strokeWidth: 1,
        }),
        $(
          go.Panel,
          "Vertical",
          { margin: 12 },
          $(
            go.TextBlock,
            {
              font: "bold 16px sans-serif",
              stroke: "white",
              textAlign: "center",
            },
            new go.Binding("text", "", (data) =>
              data.nodeType === "poet"
                ? `${data.title}`
                : `${data.title} ${data.name}`
            )
          ),
          $(
            go.TextBlock,
            {
              font: "13px sans-serif",
              stroke: "lightblue",
              textAlign: "center",
              margin: new go.Margin(6, 0, 0, 0),
            },
            new go.Binding("text", "", (data) =>
              data.nodeType === "poet"
                ? `生卒: ${data.from}-${data.to} (${data.duration}年) | ${data.name}`
                : `在位: ${data.from}-${data.to} (${data.duration}年)`
            )
          ),
          $(
            go.TextBlock,
            {
              font: "12px sans-serif",
              stroke: "lightgray",
              textAlign: "left",
              maxSize: new go.Size(350, NaN),
              wrap: go.TextBlock.WrapFit,
              margin: new go.Margin(6, 0, 0, 0),
            },
            new go.Binding("text", "description")
          ),
          // 诗人专用：代表作品
          $(
            go.TextBlock,
            {
              font: "11px sans-serif",
              stroke: "lightgreen",
              textAlign: "left",
              maxSize: new go.Size(350, NaN),
              wrap: go.TextBlock.WrapFit,
              margin: new go.Margin(4, 0, 0, 0),
              visible: false,
            },
            new go.Binding("text", "famousWorks", (works) =>
              works ? `代表作: ${works.join("、")}` : ""
            ),
            new go.Binding("visible", "nodeType", (type) => type === "poet")
          ),
          // 诗人专用：诗歌风格
          $(
            go.TextBlock,
            {
              font: "11px sans-serif",
              stroke: "lightyellow",
              textAlign: "left",
              maxSize: new go.Size(350, NaN),
              wrap: go.TextBlock.WrapFit,
              margin: new go.Margin(2, 0, 0, 0),
              visible: false,
            },
            new go.Binding("text", "style", (style) =>
              style ? `风格: ${style}` : ""
            ),
            new go.Binding("visible", "nodeType", (type) => type === "poet")
          )
        )
      ),
    }
  );

  // 定义连接线模板
  diagram.linkTemplate = $(
    go.Link,
    {
      routing: go.Link.AvoidsNodes,
      curve: go.Link.JumpOver,
      corner: 8,
      toShortLength: 4,
    },

    $(
      go.Shape,
      { strokeWidth: 2, stroke: "#3498db" },
      new go.Binding("stroke", "category", (cat) =>
        cat === "dynasty-change" ? "#e74c3c" : "#3498db"
      ),
      new go.Binding("strokeWidth", "category", (cat) =>
        cat === "dynasty-change" ? 4 : 2
      )
    ),

    $(
      go.Shape,
      { toArrow: "Standard", strokeWidth: 0, fill: "#3498db", scale: 1.2 },
      new go.Binding("fill", "category", (cat) =>
        cat === "dynasty-change" ? "#e74c3c" : "#3498db"
      )
    )
  );

  // 设置数据
  const { nodeDataArray, linkDataArray } = prepareData();
  diagram.model = new go.GraphLinksModel(nodeDataArray, linkDataArray);

  // 应用自定义布局
  setTimeout(() => {
    customTimelineLayout();
    diagram.zoomToFit();
  }, 100);
};

// 控制方法
const resetView = () => {
  if (diagram) {
    diagram.zoomToFit();
  }
};

const toggleLayout = () => {
  if (diagram) {
    isVerticalLayout.value = !isVerticalLayout.value;
    customTimelineLayout();
  }
};

const togglePoets = () => {
  showPoets.value = !showPoets.value;
  // 重新初始化图表以更新数据
  if (diagram) {
    const { nodeDataArray, linkDataArray } = prepareData();
    diagram.model = new go.GraphLinksModel(nodeDataArray, linkDataArray);
    setTimeout(() => {
      customTimelineLayout();
      diagram.zoomToFit();
    }, 100);
  }
};

const zoomIn = () => {
  if (diagram) {
    diagram.commandHandler.increaseZoom();
  }
};

const zoomOut = () => {
  if (diagram) {
    diagram.commandHandler.decreaseZoom();
  }
};

// 生命周期
onMounted(() => {
  initDiagram();
});

onUnmounted(() => {
  if (diagram) {
    diagram.div = null;
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

.diagram-container {
  width: 100%;
  height: calc(100vh - 160px);
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 32px rgba(31, 38, 135, 0.37);
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

    &.tang .legend-color {
      background: #ff6b9d;
    }

    &.five-dynasties .legend-color {
      background: #6c5ce7;
    }

    &.song .legend-color {
      background: #0fb9b1;
    }

    &.south-song .legend-color {
      background: #3867d6;
    }

    &.poets .legend-color {
      background: #f39c12;
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

  .diagram-container {
    height: calc(100vh - 120px);
  }

  .legend {
    bottom: 10px;
    left: 10px;
    padding: 10px;

    .legend-item {
      font-size: 11px;
      margin-bottom: 6px;

      .legend-color {
        width: 12px;
        height: 12px;
        margin-right: 6px;
      }
    }
  }
}
</style>

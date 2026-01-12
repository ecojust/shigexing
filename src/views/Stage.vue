<template>
  <div class="stage">
    <div ref="stageContainer" class="stage-container"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import * as PIXI from "pixi.js";
import tangBg from "@/assets/maps/tang.jpg";

const stageContainer = ref();
let app = null;

onMounted(async () => {
  if (!stageContainer.value) return;

  // 创建PIXI应用
  app = new PIXI.Application();

  // 初始化应用
  await app.init({
    width: 1024,
    height: 768,
    backgroundColor: 0x1099bb,
    antialias: true,
  });

  // 将canvas添加到容器
  stageContainer.value.appendChild(app.canvas);

  // 加载背景图片
  const texture = await PIXI.Assets.load(tangBg);
  const background = new PIXI.Sprite(texture);

  // 调整背景图片大小以适应舞台
  background.width = app.screen.width;
  background.height = app.screen.height;

  // 添加背景到舞台
  app.stage.addChild(background);

  // 可以在这里添加更多舞台元素
  // 例如添加一个简单的文字
  const style = new PIXI.TextStyle({
    fontFamily: "Arial",
    fontSize: 36,
    fill: 0xffffff,
    stroke: 0x000000,
    strokeThickness: 4,
    dropShadow: true,
    dropShadowColor: 0x000000,
    dropShadowBlur: 4,
    dropShadowAngle: Math.PI / 6,
    dropShadowDistance: 6,
  });

  const text = new PIXI.Text("舞台", style);
  text.x = app.screen.width / 2 - text.width / 2;
  text.y = 50;
  app.stage.addChild(text);
});

onUnmounted(() => {
  if (app) {
    app.destroy(true);
    app = null;
  }
});
</script>

<style lang="less">
.stage {
  width: 100%;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f0f0f0;

  .stage-container {
    border: 1px solid #3333335e;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  }
}
</style>

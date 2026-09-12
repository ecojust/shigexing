<template>
  <div class="timeline-container">
    <h2 class="timeline-title">
      <span class="title-star">✦</span>
      <span class="title-main">唐宋诗人时间线</span>
      <span class="title-sub">跟着诗人一起旅行吧～</span>
      <span class="title-star">✦</span>
    </h2>

    <div class="reset-view-container">
      <button @click="resetView" class="reset-view-btn">
        <span class="reset-icon">⟲</span>
        重置视图
      </button>
    </div>

    <div ref="svgWrap" class="svg-container">
      <svg
        :viewBox="`0 0 ${svgW} ${svgH}`"
        preserveAspectRatio="xMidYMid meet"
        class="timeline-svg"
      >
        <g>
          <!-- 朝代背景 -->
          <g class="dynasty-layer">
            <template v-for="d in dynasties" :key="d.name">
              <rect
                :x="yearX(d.start)"
                :y="margin.top - 10"
                :width="yearX(d.end) - yearX(d.start)"
                :height="(contentH + 20) / 5"
                :fill="d.color"
                fill-opacity="0.18"
                :stroke="d.color"
                stroke-opacity="0.9"
                stroke-width="2"
                rx="10"
              />
              <text
                :x="yearX(d.start) + 8"
                :y="margin.top - 16"
                :fill="d.color"
                font-size="16"
                font-weight="bold"
                opacity="0.8"
              >{{ d.name }}</text>
            </template>
          </g>

          <!-- 帝皇背景 -->
          <g class="emperor-layer">
            <g v-for="em in emperors" :key="em.name">
              <rect
                :x="yearX(em.start)"
                :y="margin.top - 8"
                :width="Math.max(yearX(em.end) - yearX(em.start), 1)"
                :height="(contentH + 16) / 5"
                :fill="em.color"
                fill-opacity="0.3"
                :stroke="em.color"
                stroke-opacity="0.55"
                stroke-width="1.5"
                rx="8"
                class="emperor-rect"
                @pointerenter="(e) => showEmperorTip(em, e)"
                @pointerleave="hideTip"
              />
            </g>
          </g>

          <!-- 年份刻度 & 网格 -->
          <g class="axis-layer">
            <!-- 主轴线 -->
            <line
              :x1="margin.left"
              :y1="margin.top - 30"
              :x2="margin.left + innerW"
              :y2="margin.top - 30"
              stroke="#b8a7d9" stroke-width="3"
              stroke-linecap="round"
            />
            <!-- 每年刻度，每10年显示年份 -->
            <template v-for="y in yearTicks" :key="'t'+y">
              <line
                :x1="yearX(y)" :y1="margin.top - 38"
                :x2="yearX(y)" :y2="margin.top - 22"
                :stroke="y % 100 === 0 ? '#9b87c8' : '#c3b6e0'"
                :stroke-width="y % 100 === 0 ? 1.5 : 0.6"
                :opacity="y % 100 === 0 ? 1 : 0.5"
                stroke-linecap="round"
              />
              <line
                :x1="yearX(y)" :y1="margin.top"
                :x2="yearX(y)" :y2="margin.top + contentH"
                stroke="#dccfe8" :stroke-width="1"
                :opacity="y % 100 === 0 ? 0.4 : 0.15"
              />
              <text
                v-if="y % 10 === 0"
                :x="yearX(y)"
                :y="margin.top - 44"
                text-anchor="middle"
                fill="#8f7fb5" font-size="13" font-weight="600"
              >{{ y }}</text>
            </template>
          </g>

          <!-- 人生曲线 -->
          <g class="curve-layer">
            <g v-for="(c, i) in curveData" :key="c.poet.name">
              <!-- 柔光底色 -->
              <path :d="c.linePath" fill="none" :stroke="curveColor(i)" stroke-width="7" stroke-opacity="0.18"
                stroke-linecap="round" stroke-linejoin="round" />
              <!-- 面积填充 -->
              <path :d="c.areaPath" :fill="curveColor(i)" fill-opacity="0.1" />
              <!-- 折线主体 -->
              <path :d="c.linePath" fill="none" :stroke="curveColor(i)" stroke-width="2.6" stroke-opacity="0.95"
                stroke-linecap="round" stroke-linejoin="round" />
            </g>
          </g>

          <!-- 圆点最顶层：保证都能点击 -->
          <g class="dot-layer">
            <g v-for="(c, i) in curveData" :key="`dots-${c.poet.name}`">
              <!-- 出生起点：圆脑袋笑脸小人 + 名字 -->
              <g class="birth-marker" v-if="c.pts.length">
                <g class="curve-dot"
                  @pointerenter="(e) => showCurveTip(c.poet, c.pts[0], e)"
                  @pointerleave="hideTip">
                  <!-- 脑袋 -->
                  <circle
                    :cx="yearX(c.pts[0].year)"
                    :cy="c.yFor(c.pts[0].count)"
                    r="20"
                    :fill="curveColor(i)"
                    stroke="#fff"
                    stroke-width="3"
                  />
                  <!-- 头顶高光 -->
                  <circle
                    :cx="yearX(c.pts[0].year) - 6"
                    :cy="c.yFor(c.pts[0].count) - 9"
                    r="4"
                    fill="rgba(255,255,255,.6)"
                    pointer-events="none"
                  />
                  <!-- 两只眼睛 -->
                  <circle
                    :cx="yearX(c.pts[0].year) - 6"
                    :cy="c.yFor(c.pts[0].count) - 2"
                    r="3"
                    fill="#5b4a7a"
                    pointer-events="none"
                  />
                  <circle
                    :cx="yearX(c.pts[0].year) + 6"
                    :cy="c.yFor(c.pts[0].count) - 2"
                    r="3"
                    fill="#5b4a7a"
                    pointer-events="none"
                  />
                  <!-- 嘴巴：微笑 -->
                  <path
                    :d="`M${yearX(c.pts[0].year) - 6},${c.yFor(c.pts[0].count) + 5} Q${yearX(c.pts[0].year)},${c.yFor(c.pts[0].count) + 11} ${yearX(c.pts[0].year) + 6},${c.yFor(c.pts[0].count) + 5}`"
                    fill="none" stroke="#5b4a7a" stroke-width="2.2" stroke-linecap="round"
                    pointer-events="none" opacity="0.75"
                  />
                </g>
                <text
                  :x="yearX(c.pts[0].year)"
                  :y="c.yFor(c.pts[0].count) + 32"
                  text-anchor="middle"
                  fill="#5b4a7a"
                  font-size="13"
                  font-weight="700"
                  pointer-events="none"
                >{{ c.poet.name }}</text>
              </g>
              <!-- 出生点之后的事件：圆脑袋笑脸小人 -->
              <g v-for="pt in c.pts.slice(1)" :key="pt.year" class="curve-dot"
                @pointerenter="(e) => showCurveTip(c.poet, pt, e)"
                @pointerleave="hideTip">
                <!-- 脑袋 -->
                <circle
                  :cx="yearX(pt.year)" :cy="c.yFor(pt.count)"
                  r="7" :fill="curveColor(i)" stroke="#fff" stroke-width="2"
                />
                <!-- 高光 -->
                <circle
                  :cx="yearX(pt.year) - 2"
                  :cy="c.yFor(pt.count) - 3"
                  r="1.6"
                  fill="rgba(255,255,255,.65)"
                  pointer-events="none"
                />
                <!-- 眼睛 -->
                <circle
                  :cx="yearX(pt.year) - 2.5"
                  :cy="c.yFor(pt.count) - 0.5"
                  r="1.1"
                  fill="#5b4a7a"
                  pointer-events="none"
                />
                <circle
                  :cx="yearX(pt.year) + 2.5"
                  :cy="c.yFor(pt.count) - 0.5"
                  r="1.1"
                  fill="#5b4a7a"
                  pointer-events="none"
                />
                <!-- 微笑 -->
                <path
                  :d="`M${yearX(pt.year) - 2.5},${c.yFor(pt.count) + 2} Q${yearX(pt.year)},${c.yFor(pt.count) + 4.2} ${yearX(pt.year) + 2.5},${c.yFor(pt.count) + 2}`"
                  fill="none" stroke="#5b4a7a" stroke-width="1.4" stroke-linecap="round"
                  pointer-events="none" opacity="0.75"
                />
              </g>
            </g>
          </g>
        </g>
      </svg>
    </div>

    <!-- 共用 tooltip -->
    <div v-if="tip.visible" class="tip-box" :style="{ left: tip.x + 'px', top: tip.y + 'px' }">
      <div class="tip-title">{{ tip.title }}</div>
      <div class="tip-body">{{ tip.body }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import poets from "../timeline/poets.js";
import { poetTracks } from "../timeline/tracks.js";
import { getAllEmperors } from "./timeline-modules/data-processor.js";

const dynasties = [
  { name: "唐朝", start: 618, end: 907, color: "#ff9eb5" },
  { name: "五代十国", start: 907, end: 960, color: "#b9a7f0" },
  { name: "北宋", start: 960, end: 1127, color: "#ffd98a" },
  { name: "南宋", start: 1127, end: 1279, color: "#8fd3f2" },
];

const emperors = getAllEmperors().map((e) => ({ ...e, color: hex6(e.color) }));

function hex6(n) {
  return "#" + (n | 0x1000000).toString(16).slice(1);
}

const minYear = 600;
const maxYear = 1300;
const yearSpan = maxYear - minYear;
// 整体画布比例：宽7200 : 高600
const margin = { top: 90, right: 30, bottom: 40, left: 110 };
const innerW = 7060;
const contentH = 470;
const svgW = margin.left + innerW + margin.right; // 7200
const svgH = margin.top + contentH + margin.bottom; // 600

const yearX = (y) => margin.left + ((y - minYear) / yearSpan) * innerW;

const yearTicks = computed(() => {
  const arr = [];
  for (let y = minYear; y <= maxYear; y++) arr.push(y);
  return arr;
});

// ---------- curves ----------
const POLET_PALETTE = [
  "#ff6f9c","#ffa45c","#8ac6d1","#f7b32b","#c78be8","#7fb069",
  "#5b8def","#f383a0","#3bc2c2","#caa8f5","#ffac57","#84d26b",
  "#6a9ef5","#ff7ba9","#36cfb0","#f9a55c","#b083e8","#61c3d8",
  "#ffc44d","#ef6f91","#77c473","#8fa6f0","#43c6c6","#e896c8",
];
const curveColor = (i) => POLET_PALETTE[i % POLET_PALETTE.length];

const curveData = computed(() => {
  // 用 datacsv 真实轨迹覆盖四位诗人的数据，其余诗人沿用 poets.js 手工数据
  const sorted = [...poets]
    .map((poet) => {
      const tr = poetTracks[poet.name];
      if (tr && Array.isArray(tr.life) && tr.life.length >= 1) {
        return {
          ...poet,
          birth: tr.birth,
          death: tr.death,
          life: tr.life,
          _real: tr,
        };
      }
      return poet;
    })
    .filter((p) => Array.isArray(p.life) && p.life.length >= 1)
    .sort((a, b) => a.birth - b.birth);

  const bandTop = margin.top + 3;
  const bandBottom = margin.top + contentH - 3;
  const bandH = bandBottom - bandTop;

  return sorted.map((poet) => {
    const pts = poet.life
      .filter((p) => typeof p.time === "number" && typeof p.value === "number" && p.time >= poet.birth && p.time <= poet.death)
      .map((p) => ({ year: p.time, count: p.value, event: p.event, place: p.place || "" }))
      .sort((a, b) => a.year - b.year);

    let maxC = 1;
    pts.forEach((p) => { if (p.count > maxC) maxC = p.count; });

    const yFor = (c) => bandBottom - (c / maxC) * bandH;

    const linePath = pts.map((p, i) => `${i === 0 ? "M" : "L"}${yearX(p.year).toFixed(1)},${yFor(p.count).toFixed(1)}`).join(" ");
    const areaPath = linePath
      + ` L${yearX(pts[pts.length - 1].year).toFixed(1)},${bandBottom}`
      + ` L${yearX(pts[0].year).toFixed(1)},${bandBottom} Z`;

    return { poet, pts, yFor, linePath, areaPath, maxC };
  });
});

// ---------- 布局：高度撑满屏幕，宽度超宽，横向滚动 ----------
const svgWrap = ref(null);

// 重置视图：滚回最左侧
const resetView = () => {
  if (svgWrap.value) svgWrap.value.scrollLeft = 0;
};

// ---------- tooltip ----------
const tip = ref({ visible: false, x: 0, y: 0, title: "", body: "" });

const positionTip = (e) => {
  let x = e.clientX + 14, y = e.clientY + 14;
  if (x + 260 > window.innerWidth) x = e.clientX - 260;
  if (y + 80 > window.innerHeight) y = e.clientY - 80;
  return { x, y };
};

const showCurveTip = (poet, pt, e) => {
  const pos = positionTip(e);
  tip.value = {
    visible: true, x: pos.x, y: pos.y,
    title: `${poet.name} · ${pt.year}年`,
    body: [pt.place ? `📍 ${pt.place}` : "", pt.event || ""].filter(Boolean).join("\n"),
  };
};
const showEmperorTip = (em, e) => {
  const pos = positionTip(e);
  tip.value = { visible: true, x: pos.x, y: pos.y, title: em.name, body: `${em.fullName}\n${em.start}–${em.end} (${em.end - em.start}年)` };
};
const hideTip = () => { tip.value.visible = false; };
</script>

<style lang="less" scoped>
.timeline-container {
  width: 100vw;
  height: 100vh;
  position: relative;
  overflow: hidden;
  font-family: "Yuanti SC", "YouYuan", "Apple SD Gothic Neo", "PingFang SC", "Microsoft YaHei", sans-serif;
  background:
    radial-gradient(circle at 12% 18%, rgba(255, 214, 165, .55) 0%, transparent 34%),
    radial-gradient(circle at 88% 22%, rgba(255, 176, 203, .5) 0%, transparent 36%),
    radial-gradient(circle at 78% 85%, rgba(179, 199, 255, .5) 0%, transparent 40%),
    radial-gradient(circle at 20% 90%, rgba(255, 241, 168, .45) 0%, transparent 38%),
    linear-gradient(160deg, #fff7ec 0%, #ffeef5 42%, #fdeeff 78%, #fff9e7 100%);
  &::before {
    content: "";
    position: absolute; inset: 0;
    background:
      radial-gradient(circle at 30% 70%, rgba(255,255,255,.4) 0%, transparent 50%),
      radial-gradient(circle at 70% 30%, rgba(255,255,255,.35) 0%, transparent 45%);
    pointer-events: none; z-index: 0;
  }
}

.timeline-title {
  position: absolute; top: 14px; left: 50%; transform: translateX(-50%);
  color: #6b4fa3; margin: 0; z-index: 20;
  display: flex; align-items: center; gap: 10px;
  padding: 10px 22px; border-radius: 999px;
  background: rgba(255,255,255,.75);
  border: 2px solid rgba(255, 182, 214, .8);
  box-shadow: 0 6px 18px rgba(203, 168, 235, .35);
  backdrop-filter: blur(6px);
  .title-star { color: #ffb3d1; font-size: 20px; animation: twinkle 2.4s ease-in-out infinite; }
  .title-main { font-size: 24px; font-weight: 800; letter-spacing: 2px; }
  .title-sub { font-size: 14px; color: #a389d6; font-weight: 600; }
}

@keyframes twinkle {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.25) rotate(12deg); opacity: .7; }
}

.svg-container {
  position: absolute; inset: 0; z-index: 1;
  overflow-x: auto;
  overflow-y: hidden;
  cursor: grab;
  &:active { cursor: grabbing; }
}

.timeline-svg {
  display: block;
  height: 100%;
  width: auto;
  aspect-ratio: 7200 / 600;
  font-family: "Yuanti SC", "YouYuan", "PingFang SC", "Microsoft YaHei", sans-serif;
}

.curve-dot { cursor: pointer; }
.emperor-rect { cursor: pointer; }

.reset-view-container {
  position: absolute; bottom: 26px; left: 50%; transform: translateX(-50%);
  z-index: 30;
}
.reset-view-btn {
  background: linear-gradient(135deg, #ffd3a5 0%, #fd9bd6 100%);
  border: none;
  padding: 12px 26px; border-radius: 999px; cursor: pointer;
  font-weight: 800; font-size: 14px; color: #fff;
  font-family: inherit;
  display: flex; align-items: center; gap: 8px;
  box-shadow: 0 6px 18px rgba(245, 118, 178, .4);
  transition: all .25s;
  .reset-icon { font-size: 16px; transition: transform .3s; }
  &:hover { transform: translateY(-3px) scale(1.04); box-shadow: 0 10px 26px rgba(245, 118, 178, .5); }
  &:hover .reset-icon { transform: rotate(180deg); }
}

.tip-box {
  position: fixed; pointer-events: none; z-index: 100;
  background: rgba(255,255,255,.96); border: 2px solid #ffc9e0;
  border-radius: 16px; padding: 10px 14px;
  color: #5c4a86; font-family: inherit;
  font-size: 13px; line-height: 1.6; white-space: pre-line;
  box-shadow: 0 8px 24px rgba(203, 168, 235, .4); max-width: 280px;
  .tip-title { color: #ff7fb0; font-weight: 800; margin-bottom: 3px; font-size: 14px; }
}
</style>

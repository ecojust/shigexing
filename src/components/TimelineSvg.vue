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
        回到最上面
      </button>
    </div>

    <div ref="svgWrap" class="svg-container">
      <!-- 固定年龄轴 -->
      <div class="age-axis-wrap">
        <svg :width="svgW" :height="AXIS_H" :viewBox="`0 0 ${svgW} ${AXIS_H}`">
          <template v-for="a in ageTicks" :key="'top' + a">
            <text
              v-if="a % 10 === 0"
              :x="ageX(a)"
              :y="AXIS_H / 2"
              dominant-baseline="central"
              text-anchor="middle"
              fill="#8f7fb5"
              font-size="13"
              font-weight="700"
            >
              {{ a }}岁
            </text>
            <line
              v-if="a % 10 === 0"
              :x1="ageX(a)"
              :y1="AXIS_H"
              :x2="ageX(a)"
              :y2="AXIS_H + 4"
              stroke="#8f7fb5"
              stroke-width="1"
            />
          </template>
        </svg>
      </div>

      <svg
        :viewBox="`0 0 ${svgW} ${svgH}`"
        :width="svgW"
        :height="svgH"
        class="timeline-svg"
      >
        <g v-for="(sec, si) in sections" :key="sec.name">
          <!-- 朝代分隔带（独立高条，不与诗人行重叠） -->
          <rect
            :x="10"
            :y="sec.headerTop"
            :width="svgW - 20"
            :height="HEADER_H"
            rx="12"
            :fill="sec.color"
            :opacity="sec.color === '#6cc4ee' ? 0.6 : 0.35"
            stroke="rgba(255,255,255,0.6)"
            stroke-width="1.5"
          />
          <text
            :x="26"
            :y="sec.headerTop + HEADER_H / 2"
            dominant-baseline="central"
            :fill="sec.color"
            font-size="17"
            font-weight="800"
            letter-spacing="2"
          >
            {{ sec.name }} {{ sec.start }}–{{ sec.end }}
          </text>

          <!-- 诗人行 -->
          <g v-for="row in sec.rows" :key="row.poet.name">
            <!-- 行背景 -->
            <rect
              :x="0"
              :y="row.rowTop"
              :width="svgW"
              :height="ROW_H"
              :fill="
                row.rowTop % (ROW_H * 2) === 0
                  ? 'rgba(255,255,255,.35)'
                  : 'rgba(255,255,255,.15)'
              "
            />

            <!-- 行内年龄刻度线 -->
            <g>
              <template v-for="a in ageTicks" :key="'t' + a">
                <line
                  :x1="ageX(a)"
                  :y1="row.rowTop"
                  :x2="ageX(a)"
                  :y2="row.rowTop + ROW_H"
                  stroke="#c9b8e0"
                  :stroke-width="a % 10 === 0 ? 1 : 0.5"
                  :opacity="a % 10 === 0 ? 0.5 : 0.18"
                />
              </template>
            </g>

            <!-- 时期帝王块（每行左侧） -->
            <g transform="translate(8, 0)">
              <rect
                :x="0"
                :y="row.rowTop + 8"
                :width="KING_W - 18"
                :height="ROW_H - 20"
                rx="12"
                :fill="row.era.color"
                opacity="0.2"
                stroke="none"
              />
              <text
                :x="12"
                :y="row.rowTop + 27"
                :fill="row.era.color"
                font-size="11"
                font-weight="700"
                opacity="0.85"
              >
                {{ row.era.dyn }}
              </text>
              <text
                :x="12"
                :y="row.rowTop + 45"
                :fill="row.era.color"
                font-size="15"
                font-weight="800"
              >
                {{ row.era.name }}
              </text>
              <text
                :x="12"
                :y="row.rowTop + 62"
                :fill="row.era.color"
                font-size="10"
                opacity="0.75"
              >
                {{ row.era.start }}–{{ row.era.end }}
              </text>
            </g>

            <!-- 诗人名 + 生卒（一行，头像上方） -->
            <text
              :x="CURVE_X + 4"
              :y="row.rowTop + 30"
              :fill="curveColor(row.colorIdx)"
              font-size="18"
              font-weight="800"
            >
              {{ row.poet.name }}
              <tspan dx="6" font-size="12" font-weight="600" fill="#a89ad0">
                （{{ row.poet.birth }}—{{ row.poet.death }}）
              </tspan>
            </text>

            <!-- 曲线：面积 + 折线 -->
            <path
              v-if="row.linePath"
              :d="row.areaPath"
              :fill="curveColor(row.colorIdx)"
              fill-opacity="0.12"
            />
            <path
              v-if="row.linePath"
              :d="row.linePath"
              fill="none"
              :stroke="curveColor(row.colorIdx)"
              stroke-width="2.6"
              stroke-opacity="0.95"
              stroke-linecap="round"
              stroke-linejoin="round"
            />

            <!-- 出生头像圆（0岁） -->
            <g v-if="row.pts.length" class="birth-marker">
              <g
                class="curve-dot"
                @pointerenter="(e) => showCurveTip(row.poet, row.pts[0], e)"
                @pointerleave="hideTip"
              >
                <circle
                  :cx="ageX(row.pts[0].year - row.poet.birth)"
                  :cy="row.cyFor"
                  r="17"
                  :fill="curveColor(row.colorIdx)"
                  stroke="#fff"
                  stroke-width="3"
                />
                <circle
                  :cx="ageX(row.pts[0].year - row.poet.birth) - 5"
                  :cy="row.cyFor - 8"
                  r="3.5"
                  fill="rgba(255,255,255,.6)"
                  pointer-events="none"
                />
                <circle
                  :cx="ageX(row.pts[0].year - row.poet.birth) - 4"
                  :cy="row.cyFor - 1"
                  r="2.6"
                  fill="#5b4a7a"
                  pointer-events="none"
                />
                <circle
                  :cx="ageX(row.pts[0].year - row.poet.birth) + 4"
                  :cy="row.cyFor - 1"
                  r="2.6"
                  fill="#5b4a7a"
                  pointer-events="none"
                />
                <path
                  :d="`M${ageX(row.pts[0].year - row.poet.birth) - 4},${row.cyFor + 4} Q${ageX(row.pts[0].year - row.poet.birth)},${row.cyFor + 9} ${ageX(row.pts[0].year - row.poet.birth) + 4},${row.cyFor + 4}`"
                  fill="none"
                  stroke="#5b4a7a"
                  stroke-width="1.8"
                  stroke-linecap="round"
                  pointer-events="none"
                  opacity="0.75"
                />
              </g>
            </g>

            <!-- 事件小人点 -->
            <g
              v-for="pt in row.pts.slice(1)"
              :key="pt.year"
              class="curve-dot"
              @pointerenter="(e) => showCurveTip(row.poet, pt, e)"
              @pointerleave="hideTip"
            >
              <circle
                :cx="ageX(pt.year - row.poet.birth)"
                :cy="row.yFor(pt.count)"
                r="6"
                :fill="curveColor(row.colorIdx)"
                stroke="#fff"
                stroke-width="1.8"
              />
              <circle
                :cx="ageX(pt.year - row.poet.birth) - 2"
                :cy="row.yFor(pt.count) - 2"
                r="1.4"
                fill="rgba(255,255,255,.65)"
                pointer-events="none"
              />
              <circle
                :cx="ageX(pt.year - row.poet.birth) - 2"
                :cy="row.yFor(pt.count)"
                r="1"
                fill="#5b4a7a"
                pointer-events="none"
              />
              <circle
                :cx="ageX(pt.year - row.poet.birth) + 2"
                :cy="row.yFor(pt.count)"
                r="1"
                fill="#5b4a7a"
                pointer-events="none"
              />
              <path
                :d="`M${ageX(pt.year - row.poet.birth) - 2},${row.yFor(pt.count) + 1.8} Q${ageX(pt.year - row.poet.birth)},${row.yFor(pt.count) + 3.6} ${ageX(pt.year - row.poet.birth) + 2},${row.yFor(pt.count) + 1.8}`"
                fill="none"
                stroke="#5b4a7a"
                stroke-width="1.2"
                stroke-linecap="round"
                pointer-events="none"
                opacity="0.7"
              />
            </g>
          </g>
        </g>
      </svg>
    </div>

    <!-- 共用 tooltip -->
    <div
      v-if="tip.visible"
      class="tip-box"
      :style="{ left: tip.x + 'px', top: tip.y + 'px' }"
    >
      <div class="tip-title">{{ tip.title }}</div>
      <div class="tip-body">{{ tip.body }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { poetTracks } from "../timeline/tracks.js";
import { getAllEmperors } from "./timeline-modules/data-processor.js";

const ROW_H = 80;
const HEADER_H = 34;
const SECTION_GAP = 6;
const AXIS_H = 30;
const KING_W = 170;
const CURVE_X = 218;
const RIGHT_PAD = 30;
const viewW = ref(typeof window !== "undefined" ? window.innerWidth : 1200);

const dynasties = [
  { name: "唐朝", start: 618, end: 907, color: "#ff8fac" },
  { name: "五代十国", start: 907, end: 960, color: "#b9a7f0" },
  { name: "北宋", start: 960, end: 1127, color: "#ffbe5c" },
  { name: "南宋", start: 1127, end: 1279, color: "#6cc4ee" },
];

const POLET_PALETTE = [
  "#ff6f9c",
  "#ffa45c",
  "#8ac6d1",
  "#f7b32b",
  "#c78be8",
  "#7fb069",
  "#5b8def",
  "#f383a0",
  "#3bc2c2",
  "#caa8f5",
  "#ffac57",
  "#84d26b",
  "#6a9ef5",
  "#ff7ba9",
  "#36cfb0",
  "#f9a55c",
  "#b083e8",
  "#61c3d8",
  "#ffc44d",
  "#ef6f91",
  "#77c473",
  "#8fa6f0",
  "#43c6c6",
  "#e896c8",
];
const curveColor = (i) => POLET_PALETTE[i % POLET_PALETTE.length];

const emperors = getAllEmperors().map((e) => ({ ...e, color: hex6(e.color) }));
function hex6(n) {
  return "#" + (n | 0x1000000).toString(16).slice(1);
}

// 每个帝皇分配专属糖果色（同一王朝内顺序错开，相邻帝王颜色不同）
const kingColorByYear = (() => {
  const byYear = [];
  dynasties.forEach((d) => {
    const list = emperors
      .filter((e) => e.start >= d.start && e.end <= d.end)
      .sort((a, b) => a.start - b.start);
    let step = 0;
    list.forEach((e) => {
      const color = POLET_PALETTE[(step * 2 + 3) % POLET_PALETTE.length];
      byYear.push({ start: e.start, end: e.end, color, name: e.name });
      step++;
    });
  });
  return byYear;
})();
function kingColorOf(year) {
  const k = kingColorByYear.find((e) => year >= e.start && year <= e.end);
  return k ? k.color : "#b083e8";
}

// ---------- 数据 ----------
const allPoets = computed(() =>
  Object.values(poetTracks)
    .filter((tr) => Array.isArray(tr.life) && tr.life.length >= 1)
    .filter(
      (tr) => typeof tr.birth === "number" && typeof tr.death === "number",
    )
    .map((tr) => {
      return {
        name: tr.name,
        birth: tr.birth,
        death: tr.death,
        life: tr.life,
      };
    }),
);
function dynastyOf(year) {
  return (
    dynasties.find((d) => year >= d.start && year <= d.end) || dynasties[0]
  );
}
function emperorOf(year) {
  return emperors.find((e) => year >= e.start && year <= e.end) || null;
}

// 横轴按最大享年铺满可用宽度（扣掉左侧君王栏）
const maxAge = computed(() => {
  let m = 0;
  allPoets.value.forEach((p) => {
    const a = p.death - p.birth;
    if (a > m) m = a;
  });
  return m;
});
const svgW = computed(() => viewW.value);
const ageSpanW = computed(() => svgW.value - CURVE_X - RIGHT_PAD);

const ageX = (age) => CURVE_X + (age / maxAge.value) * ageSpanW.value;

const ageTicks = computed(() => {
  const arr = [];
  for (let a = 0; a <= maxAge.value; a++) arr.push(a);
  return arr;
});

// ---------- 分朝代、分行 ----------
const sections = computed(() => {
  const secMap = new Map();
  dynasties.forEach((d) => secMap.set(d.name, { ...d, rows: [] }));

  let colorIdx = 0;
  [...allPoets.value].forEach((poet) => {
    const d = dynastyOf(poet.birth);
    secMap.get(d.name).rows.push({ poet, colorIdx: colorIdx++ });
  });
  dynasties.forEach((d) => {
    secMap.get(d.name).rows.sort((a, b) => a.poet.birth - b.poet.birth);
  });

  let y = 0;
  const secs = [];
  for (const d of dynasties) {
    const sec = secMap.get(d.name);
    if (!sec.rows.length) continue;
    y += SECTION_GAP;
    sec.headerTop = y;
    y += HEADER_H + SECTION_GAP;
    sec.rows.forEach((row) => {
      const p = row.poet;
      const pts = p.life
        .filter(
          (q) =>
            typeof q.time === "number" &&
            typeof q.value === "number" &&
            q.time >= p.birth &&
            q.time <= p.death,
        )
        .map((q) => ({
          year: q.time,
          count: q.value,
          event: q.event,
          place: q.place || "",
        }))
        .sort((a, b) => a.year - b.year);
      const top = y;
      const bottom = y + ROW_H;
      const pad = 14;
      let maxC = 1;
      pts.forEach((q) => {
        if (q.count > maxC) maxC = q.count;
      });
      const yFor = (c) => bottom - pad - (c / maxC) * (ROW_H - pad * 2);
      const cyFor = (top + bottom) / 2 + 8;
      const linePath = pts.length
        ? pts
            .map(
              (q, i) =>
                `${i === 0 ? "M" : "L"}${ageX(q.year - p.birth).toFixed(1)},${yFor(q.count).toFixed(1)}`,
            )
            .join(" ")
        : "";
      const areaPath =
        linePath +
        ` L${ageX(pts[pts.length - 1].year - p.birth).toFixed(1)},${bottom - pad}` +
        ` L${ageX(pts[0].year - p.birth).toFixed(1)},${bottom - pad} Z`;
      row.rowTop = top;
      row.pts = pts;
      row.yFor = yFor;
      row.cyFor = cyFor;
      row.linePath = linePath;
      row.areaPath = linePath ? areaPath : "";
      const em = emperorOf(p.birth);
      row.era = em
        ? {
            dyn: d.name,
            color: kingColorOf(p.birth),
            name: em.name,
            start: em.start,
            end: em.end,
          }
        : {
            dyn: d.name,
            color: d.color,
            name: "",
            start: sec.start,
            end: sec.end,
          };
      y += ROW_H;
    });
    secs.push(sec);
  }
  return secs;
});

const svgH = computed(() => {
  let h = 0;
  sections.value.forEach((s) => {
    h += SECTION_GAP + HEADER_H + SECTION_GAP + s.rows.length * ROW_H;
  });
  return h;
});

// ---------- 布局：整体滚动 ----------
const svgWrap = ref(null);
const resetView = () => {
  if (svgWrap.value) {
    svgWrap.value.scrollLeft = 0;
    svgWrap.value.scrollTop = 0;
  }
};

const updateViewW = () => {
  if (svgWrap.value) viewW.value = svgWrap.value.clientWidth;
};

onMounted(() => {
  updateViewW();
  window.addEventListener("resize", () => updateViewW());
  onUnmounted(() => window.removeEventListener("resize", updateViewW));
});

// ---------- tooltip ----------
const tip = ref({ visible: false, x: 0, y: 0, title: "", body: "" });
const positionTip = (e) => {
  let x = e.clientX + 14,
    y = e.clientY + 14;
  if (x + 260 > window.innerWidth) x = e.clientX - 260;
  if (y + 80 > window.innerHeight) y = e.clientY - 80;
  return { x, y };
};
const showCurveTip = (poet, pt, e) => {
  const pos = positionTip(e);
  tip.value = {
    visible: true,
    x: pos.x,
    y: pos.y,
    title: `${poet.name} · ${pt.year - poet.birth}岁 (${pt.year}年)`,
    body: [pt.place ? `📍 ${pt.place}` : "", pt.event || ""]
      .filter(Boolean)
      .join("\n"),
  };
};
const hideTip = () => {
  tip.value.visible = false;
};
</script>

<style lang="less" scoped>
.timeline-container {
  width: 100vw;
  height: 100vh;
  position: relative;
  overflow: hidden;
  font-family:
    "Yuanti SC", "YouYuan", "Apple SD Gothic Neo", "PingFang SC",
    "Microsoft YaHei", sans-serif;
  background:
    radial-gradient(
      circle at 12% 18%,
      rgba(255, 214, 165, 0.55) 0%,
      transparent 34%
    ),
    radial-gradient(
      circle at 88% 22%,
      rgba(255, 176, 203, 0.5) 0%,
      transparent 36%
    ),
    radial-gradient(
      circle at 78% 85%,
      rgba(179, 199, 255, 0.5) 0%,
      transparent 40%
    ),
    radial-gradient(
      circle at 20% 90%,
      rgba(255, 241, 168, 0.45) 0%,
      transparent 38%
    ),
    linear-gradient(160deg, #fff7ec 0%, #ffeef5 42%, #fdeeff 78%, #fff9e7 100%);
  &::before {
    content: "";
    position: absolute;
    inset: 0;
    background:
      radial-gradient(
        circle at 30% 70%,
        rgba(255, 255, 255, 0.4) 0%,
        transparent 50%
      ),
      radial-gradient(
        circle at 70% 30%,
        rgba(255, 255, 255, 0.35) 0%,
        transparent 45%
      );
    pointer-events: none;
    z-index: 0;
  }
}

.timeline-title {
  position: absolute;
  top: 14px;
  left: 50%;
  transform: translateX(-50%);
  color: #6b4fa3;
  margin: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 22px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.75);
  border: 2px solid rgba(255, 182, 214, 0.8);
  box-shadow: 0 6px 18px rgba(203, 168, 235, 0.35);
  backdrop-filter: blur(6px);
  .title-star {
    color: #ffb3d1;
    font-size: 20px;
    animation: twinkle 2.4s ease-in-out infinite;
  }
  .title-main {
    font-size: 24px;
    font-weight: 800;
    letter-spacing: 2px;
  }
  .title-sub {
    font-size: 14px;
    color: #a389d6;
    font-weight: 600;
  }
}

@keyframes twinkle {
  0%,
  100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.25) rotate(12deg);
    opacity: 0.7;
  }
}

.svg-container {
  position: absolute;
  top: 88px;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1;
  overflow-x: hidden;
  overflow-y: auto;
  cursor: default;
}

.age-axis-wrap {
  position: sticky;
  top: 0;
  z-index: 10;
  height: 30px;
  background: linear-gradient(
    180deg,
    #fff7ec 0%,
    rgba(255, 247, 236, 0.94) 78%,
    rgba(255, 247, 236, 0) 100%
  );
  border-bottom: 2px solid rgba(255, 182, 214, 0.5);
}

.timeline-svg {
  display: block;
  font-family:
    "Yuanti SC", "YouYuan", "PingFang SC", "Microsoft YaHei", sans-serif;
}

.curve-dot {
  cursor: pointer;
}

.reset-view-container {
  position: absolute;
  bottom: 26px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 30;
}
.reset-view-btn {
  background: linear-gradient(135deg, #ffd3a5 0%, #fd9bd6 100%);
  border: none;
  padding: 12px 26px;
  border-radius: 999px;
  cursor: pointer;
  font-weight: 800;
  font-size: 14px;
  color: #fff;
  font-family: inherit;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 6px 18px rgba(245, 118, 178, 0.4);
  transition: all 0.25s;
  .reset-icon {
    font-size: 16px;
    transition: transform 0.3s;
  }
  &:hover {
    transform: translateY(-3px) scale(1.04);
    box-shadow: 0 10px 26px rgba(245, 118, 178, 0.5);
  }
  &:hover .reset-icon {
    transform: rotate(180deg);
  }
}

.tip-box {
  position: fixed;
  pointer-events: none;
  z-index: 100;
  background: rgba(255, 255, 255, 0.96);
  border: 2px solid #ffc9e0;
  border-radius: 16px;
  padding: 10px 14px;
  color: #5c4a86;
  font-family: inherit;
  font-size: 13px;
  line-height: 1.6;
  white-space: pre-line;
  box-shadow: 0 8px 24px rgba(203, 168, 235, 0.4);
  max-width: 280px;
  .tip-title {
    color: #ff7fb0;
    font-weight: 800;
    margin-bottom: 3px;
    font-size: 14px;
  }
}
</style>

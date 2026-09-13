<template>
  <div class="timeline-container">
    <h2 class="timeline-title">
      <span class="title-star">✦</span>
      <span class="title-main">唐宋诗人时间线</span>
      <span class="title-sub">跟着诗人一起旅行吧～</span>
      <span class="title-star">✦</span>
    </h2>

    <div class="reset-view-container">
      <button
        @click="resetView"
        class="reset-view-btn"
        aria-label="回到最上面"
      >
        <span class="reset-icon">
          <svg
            class="rocket-svg"
            viewBox="0 0 24 24"
            width="30"
            height="30"
            aria-hidden="true"
          >
            <path
              d="M12 2c2.8 2.8 4.2 6.6 4.2 10.6v3H7.8v-3C7.8 8.6 9.2 4.8 12 2Z"
              fill="#ffffff"
            />
            <path d="M7.8 15.6 4.4 19v2.6l3.4-3.4v-2.6Z" fill="#ffffff" />
            <path d="M16.2 15.6 19.6 19v2.6l-3.4-3.4v-2.6Z" fill="#ffffff" />
            <path d="M10 18.4 12 23l2-4.6h-4Z" fill="#ffd7a1" />
            <circle cx="12" cy="9.8" r="1.9" fill="#f577b2" />
          </svg>
        </span>
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
          <g
            :transform="`translate(${svgW - 20 - 96}, ${sec.headerTop + (HEADER_H - 22) / 2})`"
          >
            <rect
              width="96"
              height="22"
              rx="11"
              fill="rgba(255,255,255,0.72)"
              stroke="rgba(255,255,255,0.9)"
              stroke-width="1"
            />
            <text
              x="48"
              y="11"
              dominant-baseline="central"
              text-anchor="middle"
              :fill="sec.color"
              font-size="12"
              font-weight="700"
            >
              收录 {{ sec.rows.length }} 位
            </text>
          </g>

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
              :class="{ famous: pt.highlight }"
              @pointerenter="(e) => showCurveTip(row.poet, pt, e)"
              @pointerleave="hideTip"
              @click="onNodeClick(pt)"
            >
              <!-- 名句高亮环 -->
              <circle
                v-if="pt.highlight"
                :cx="ageX(pt.year - row.poet.birth)"
                :cy="row.yFor(pt.count)"
                r="11"
                fill="#f5a623"
                fill-opacity="0.18"
                stroke="#f5a623"
                stroke-width="1.6"
                stroke-dasharray="3 2.5"
                pointer-events="none"
              />
              <circle
                :cx="ageX(pt.year - row.poet.birth)"
                :cy="row.yFor(pt.count)"
                :r="pt.highlight ? 7.5 : 6"
                :fill="pt.highlight ? '#f5a623' : curveColor(row.colorIdx)"
                :stroke="pt.highlight ? '#fff8e6' : '#fff'"
                :stroke-width="pt.highlight ? 2.6 : 1.8"
              />
              <text
                v-if="pt.highlight"
                :x="ageX(pt.year - row.poet.birth)"
                :y="row.yFor(pt.count) - 13"
                text-anchor="middle"
                font-size="11"
                font-weight="800"
                fill="#e08a00"
                pointer-events="none"
              >
                ★
              </text>
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

            <!-- 该诗人的操作面板 -->
            <foreignObject
              :x="svgW - 182"
              :y="row.rowTop + (ROW_H - 34) / 2"
              width="164"
              height="34"
              class="row-actions-fo"
            >
              <div class="row-actions">
                <button
                  class="row-action-btn"
                  :class="{ 'is-disabled': !hasVideo(row.poet) }"
                  :disabled="!hasVideo(row.poet)"
                  @click.stop="openVideo(row.poet)"
                >
                  🎬 视频
                </button>
                <button class="row-action-btn" @click.stop="openGraph(row.poet)">
                  🕸 图谱
                </button>
              </div>
            </foreignObject>
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
      <div class="tip-title">
        <span v-if="tip.highlight" class="tip-badge">名句</span>{{ tip.title }}
      </div>
      <div class="tip-body">{{ tip.body }}</div>
    </div>

    <PoetGraph v-if="graphOpen" :focus="graphFocus" @close="graphOpen = false" />

    <div v-if="poemPage" class="poem3d-overlay" @click.self="activePoem = null">
      <div class="poem3d-frame">
        <iframe class="poem3d-iframe" :src="poemPage.file" title="诗词 3D 解析" />
      </div>
    </div>

    <div v-if="videoPoet" class="video-overlay" @click.self="closeVideo">
      <div class="video-frame">
        <div class="video-head">
          <div class="video-head-main">
            <span class="video-title">
              <svg
                class="video-title-icon"
                viewBox="0 0 24 24"
                width="18"
                height="18"
                aria-hidden="true"
              >
                <rect
                  x="2"
                  y="6"
                  width="13"
                  height="12"
                  rx="2.5"
                  fill="currentColor"
                />
                <path
                  d="M16 10.2 21.4 7.4c.4-.2.9.1.9.5v8.2c0 .4-.5.7-.9.5L16 13.8z"
                  fill="currentColor"
                />
              </svg>
              {{ videoPoet.name }}
            </span>
            <span v-if="videoPoet.owner" class="video-owner">
              来自b站up主 {{ videoPoet.owner }}
            </span>
          </div>
          <div class="video-head-actions">
            <a
              v-if="videoPoet.url"
              class="video-src"
              :href="videoPoet.url"
              target="_blank"
              rel="noopener"
            >
              原视频
            </a>
            <button class="video-close" @click="closeVideo">✕</button>
          </div>
        </div>
        <div v-if="videoPoet.loading" class="video-status">正在获取视频…</div>
        <video
          v-else-if="videoPoet.src"
          class="video-player"
          :src="videoPoet.src"
          controls
          autoplay
          playsinline
          referrerpolicy="no-referrer"
          @error="onVideoError"
        ></video>
        <div v-else class="video-status">
          视频加载失败，<a
            v-if="videoPoet.url"
            :href="videoPoet.url"
            target="_blank"
            rel="noopener"
            >去 B 站观看</a
          >
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, defineAsyncComponent } from "vue";
import { ElMessage } from "element-plus";
import { poetTracks } from "../timeline/tracks.js";
import { getPoetVideo } from "../timeline/videos.js";
import { TauriFetch } from "../types/tauri-fetch";
import { getAllEmperors } from "./timeline-modules/data-processor.js";

const PoetGraph = defineAsyncComponent(() => import("./PoetGraph.vue"));

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
          highlight: q.highlight === true,
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

// ---------- 诗人操作 / 关系图谱 ----------
const graphOpen = ref(false);
const graphFocus = ref("");
const openGraph = (poet) => {
  graphFocus.value = poet ? poet.name : "";
  graphOpen.value = true;
};
const videoPoet = ref(null);
const hasVideo = (poet) => !!getPoetVideo(poet?.name);

// 经 Tauri 后端请求 B 站 playurl，获取可直连播放的视频地址（有时效，播放时实时获取）
const resolveVideoUrl = async (video) => {
  const api =
    `https://api.bilibili.com/x/player/playurl?bvid=${video.bvid}` +
    `&cid=${video.cid}&qn=80&fnval=1&platform=html5&high_quality=1`;
  const res = await TauriFetch.json(api, {
    headers: {
      Referer: "https://www.bilibili.com",
      "User-Agent": navigator.userAgent,
    },
  });
  return (
    res?.data?.durl?.[0]?.url || res?.data?.dash?.video?.[0]?.baseUrl || ""
  );
};

const openVideo = async (poet) => {
  if (!poet) return;
  const video = getPoetVideo(poet.name);
  if (!video) {
    ElMessage.info(`暂未收录「${poet.name}」的视频`);
    return;
  }
  videoPoet.value = {
    name: poet.name,
    ...video,
    src: "",
    loading: true,
    error: false,
  };
  const token = video.bvid;
  const isCurrent = () =>
    videoPoet.value && videoPoet.value.bvid === token;
  try {
    const src = await resolveVideoUrl(video);
    if (!isCurrent()) return;
    videoPoet.value = { ...videoPoet.value, src, loading: false, error: !src };
  } catch (e) {
    if (!isCurrent()) return;
    videoPoet.value = { ...videoPoet.value, loading: false, error: true };
  }
};
const onVideoError = () => {
  if (videoPoet.value)
    videoPoet.value = { ...videoPoet.value, src: "", error: true };
};
const closeVideo = () => {
  videoPoet.value = null;
};
const onKeydown = (e) => {
  if (e.key === "Escape" && videoPoet.value) closeVideo();
};
onMounted(() => window.addEventListener("keydown", onKeydown));
onUnmounted(() => window.removeEventListener("keydown", onKeydown));

// ---------- 名句 3D 解析 ----------
// 名诗详情页 public/3d/poem.html，每首配置见 public/3d/poems/（按需加载）
const activePoem = ref(null);
const poemPage = computed(() => activePoem.value);
const onNodeClick = (pt) => {
  if (!pt.highlight) return;
  hideTip();
  const works = [...(pt.event || "").matchAll(/《([^》]+)》/g)].map((m) => m[1]);
  if (!works.length) return;
  activePoem.value = {
    file: "/3d/poem.html?p=" + encodeURIComponent(works.join(",")),
  };
};
const onPoemMessage = (e) => {
  if (e.data && e.data.type === "poem-close") activePoem.value = null;
};
onMounted(() => window.addEventListener("message", onPoemMessage));
onUnmounted(() => window.removeEventListener("message", onPoemMessage));

// ---------- tooltip ----------
const tip = ref({ visible: false, x: 0, y: 0, highlight: false, title: "", body: "" });
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
    highlight: pt.highlight === true,
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

.row-actions-fo {
  overflow: visible;
}
.row-actions {
  display: flex;
  gap: 6px;
  height: 34px;
  align-items: center;
  justify-content: flex-end;
}
.row-action-btn {
  border: none;
  cursor: pointer;
  padding: 5px 12px;
  border-radius: 999px;
  font-family: inherit;
  font-size: 12px;
  font-weight: 700;
  color: #fff;
  background: linear-gradient(135deg, #ffd3a5 0%, #fd9bd6 100%);
  box-shadow: 0 3px 10px rgba(245, 118, 178, 0.35);
  white-space: nowrap;
  transition: transform 0.15s, box-shadow 0.15s;
  &:hover {
    transform: translateY(-1px) scale(1.05);
    box-shadow: 0 6px 14px rgba(245, 118, 178, 0.5);
  }
  &:disabled,
  &.is-disabled {
    cursor: not-allowed;
    color: #f1ecf7;
    background: #cfc6dd;
    box-shadow: none;
    opacity: 0.7;
    &:hover {
      transform: none;
      box-shadow: none;
    }
  }
}

.poem3d-overlay {
  position: fixed;
  inset: 0;
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(24, 12, 48, 0.55);
  backdrop-filter: blur(6px);
}
.poem3d-frame {
  position: relative;
  width: min(1000px, 92vw);
  height: min(680px, 88vh);
  border-radius: 22px;
  overflow: hidden;
  background: #0b1020;
  box-shadow: 0 24px 60px rgba(60, 20, 110, 0.5);
}
.poem3d-iframe {
  display: block;
  width: 100%;
  height: 100%;
  border: 0;
}

.video-overlay {
  position: fixed;
  inset: 0;
  z-index: 210;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(24, 12, 48, 0.55);
  backdrop-filter: blur(6px);
}
.video-frame {
  position: relative;
  width: min(960px, 92vw);
  border-radius: 22px;
  overflow: hidden;
  background: #0b1020;
  box-shadow: 0 24px 60px rgba(60, 20, 110, 0.5);
}
.video-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 16px;
  color: #000;
  background: linear-gradient(135deg, #ffd3a5 0%, #fd9bd6 100%);
  font-weight: 800;
  letter-spacing: 1px;
}
.video-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 16px;
  color: #000;
}
.video-title-icon {
  flex: none;
  display: block;
}
.video-head-main {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.video-owner {
  font-size: 12px;
  font-weight: 600;
  color: #2b2438;
}
.video-head-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}
.video-src {
  color: #000;
  font-size: 12px;
  font-weight: 700;
  text-decoration: none;
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.08);
  transition: background 0.15s;
  &:hover {
    background: rgba(0, 0, 0, 0.16);
  }
}
.video-close {
  border: none;
  cursor: pointer;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  color: #000;
  font-size: 14px;
  line-height: 1;
  background: rgba(0, 0, 0, 0.08);
  transition: background 0.15s, transform 0.15s;
  &:hover {
    background: rgba(0, 0, 0, 0.16);
    transform: scale(1.08);
  }
}
.video-player {
  display: block;
  width: 100%;
  max-height: 78vh;
  background: #000;
}
.video-status {
  padding: 60px 20px;
  text-align: center;
  color: #cbb8e6;
  font-size: 14px;
  a {
    color: #fd9bd6;
    font-weight: 700;
  }
}

.reset-view-container {
  position: absolute;
  bottom: 28px;
  right: 28px;
  z-index: 30;
}
.reset-view-btn {
  width: 58px;
  height: 58px;
  background: linear-gradient(135deg, #ffd3a5 0%, #fd9bd6 100%);
  border: none;
  border-radius: 50%;
  cursor: pointer;
  color: #fff;
  font-family: inherit;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 6px 18px rgba(245, 118, 178, 0.4);
  transition: all 0.25s;
  .reset-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.3s;
  }
  .rocket-svg {
    display: block;
  }
  &:hover {
    transform: translateY(-3px) scale(1.06);
    box-shadow: 0 10px 26px rgba(245, 118, 178, 0.5);
  }
  &:hover .reset-icon {
    transform: translateY(-3px);
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
  .tip-badge {
    display: inline-block;
    margin-right: 6px;
    padding: 0 6px;
    border-radius: 8px;
    background: #f5a623;
    color: #fff;
    font-size: 11px;
    font-weight: 800;
    vertical-align: middle;
  }
}
</style>

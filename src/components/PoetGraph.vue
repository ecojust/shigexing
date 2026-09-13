<template>
  <div class="pg-overlay" @click.self="close">
    <div class="pg-panel">
      <div class="pg-head">
        <span class="pg-title">诗人关系图谱</span>
        <span v-if="currentFocus" class="pg-focus">
          聚焦：{{ currentFocus }}
          <button class="pg-reset" @click="setFocus('')">全部</button>
        </span>
        <button class="pg-close" @click="close" aria-label="关闭">✕</button>
      </div>
      <div ref="wrapEl" class="pg-body">
        <svg ref="svgEl" class="pg-svg"></svg>
        <div v-if="error" class="pg-error">{{ error }}</div>
      </div>
      <div class="pg-hint">
        连线表示两人曾在行迹中被提及（唱和、赠答、交游等）· 布局按关系自动收敛并固定 · 滚轮缩放、拖拽平移 · 点击诗人可切换聚焦
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import { poetTracks } from "../timeline/tracks.js";

const props = defineProps({ focus: { type: String, default: "" } });
const emit = defineEmits(["close"]);

const svgEl = ref(null);
const wrapEl = ref(null);
const error = ref("");
const currentFocus = ref(props.focus || "");

let cleanup = () => {};
let applyHighlight = () => {};
let focusView = () => {};

function close() {
  emit("close");
}
function setFocus(name) {
  currentFocus.value = name;
  applyHighlight(name);
  focusView(name);
}

function dynastyColor(year) {
  if (year < 907) return "#ff8fac";
  if (year < 960) return "#b9a7f0";
  if (year < 1127) return "#ffbe5c";
  return "#6cc4ee";
}

function relationCategory(text, name) {
  const i = text.indexOf(name);
  const w = i < 0 ? text : text.slice(Math.max(0, i - 18), i + name.length + 18);
  if (/赠|寄|答|酬|唱和|次韵|和诗|见寄/.test(w)) return "赠答唱和";
  if (/送|饯|别/.test(w)) return "送别";
  if (/荐|举|擢|知遇|器重|延誉/.test(w)) return "举荐知遇";
  if (/同年|同榜|同科|同登/.test(w)) return "同年";
  if (/师|受业|从学|门下|弟子/.test(w)) return "师承";
  if (/兄|弟|侄|叔|族|姻/.test(w)) return "亲族";
  if (/劾|贬|构陷|政见|争/.test(w)) return "政争";
  return "交游";
}

function relationText(event, name) {
  const parts = String(event)
    .split(/[。；;！？\n]/)
    .map((s) => s.trim())
    .filter(Boolean);
  const withName = parts.filter((p) => p.includes(name));
  if (!withName.length) return String(event);
  const REL =
    /赠|寄|答|酬|唱和|送|饯|别|荐|举|游|会|访|师|从学|受业|交|友|宴|饮|赋诗|题诗|同|往|见|拜|谒|过访|招|邀|侍|唱|贺|祭|悼|知遇|器重/;
  const isCite = (s) =>
    /^[《”"’]/.test(s) ||
    (/《[^》]+》/.test(s) && !REL.test(s.replace(/《[^》]*》/g, "")));
  const hit =
    withName.find((p) => REL.test(p) && !isCite(p)) ||
    withName.find((p) => !isCite(p)) ||
    withName[0];
  if (isCite(hit)) return relationCategory(event, name);
  return hit;
}

function buildGraph() {
  const poets = Object.values(poetTracks);
  const names = poets.map((p) => p.name);
  const nodes = poets.map((p) => ({
    id: p.name,
    birth: p.birth,
    death: p.death,
    degree: 0,
  }));
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const seen = new Map();
  for (const p of poets) {
    const events = (p.life || []).map((e) => e.event || "");
    const text = events.join("。");
    for (const q of names) {
      if (q === p.name) continue;
      const hit = events.find((ev) => ev.includes(q));
      if (!hit) continue;
      const k = [p.name, q].sort().join("|");
      if (!seen.has(k)) {
        seen.set(k, {
          source: p.name,
          target: q,
          weight: 0,
          label: relationText(hit, q),
          sample: hit,
        });
      }
      let c = 0,
        i = 0;
      while ((i = text.indexOf(q, i)) !== -1) {
        c++;
        i += q.length;
      }
      seen.get(k).weight += c;
    }
  }
  const links = [...seen.values()];
  for (const l of links) {
    byId.get(l.source).degree++;
    byId.get(l.target).degree++;
  }
  return { nodes, links };
}

onMounted(async () => {
  try {
    const d3 = await import("d3");
    const { nodes, links } = buildGraph();
    if (!nodes.length) {
      error.value = "未获取到诗人数据";
      return;
    }

    const svg = d3.select(svgEl.value);
    const width = (wrapEl.value && wrapEl.value.clientWidth) || 1000;
    const height = (wrapEl.value && wrapEl.value.clientHeight) || 640;
    svg.attr("viewBox", [0, 0, width, height]);

    const radius = (d) => 6 + Math.min(d.degree, 8) * 1.4;
    const cx = width / 2;
    const cy = height / 2;

    // 先做一次力导向收敛，再固定位置：保留空间聚集关系，但不持续抖动
    nodes.sort((a, b) => a.birth - b.birth || a.id.localeCompare(b.id));
    const r0 = Math.min(width, height) * 0.32;
    nodes.forEach((d, i) => {
      const a = (i / nodes.length) * Math.PI * 2;
      d.x = cx + Math.cos(a) * r0;
      d.y = cy + Math.sin(a) * r0;
    });
    const sim = d3
      .forceSimulation(nodes)
      .randomSource(d3.randomLcg(0.42))
      .force(
        "link",
        d3
          .forceLink(links)
          .id((d) => d.id)
          .distance((d) => 40 + 130 / Math.sqrt(d.weight || 1))
          .strength(0.5)
      )
      .force("charge", d3.forceManyBody().strength(-260))
      .force("center", d3.forceCenter(cx, cy))
      .force("collide", d3.forceCollide().radius((d) => radius(d) + 8))
      .stop();
    for (let i = 0; i < 320; i++) sim.tick();

    const root = svg.append("g");
    const zoom = d3
      .zoom()
      .scaleExtent([0.4, 4])
      .on("zoom", (ev) => root.attr("transform", ev.transform));
    svg.call(zoom);

    const linkSel = root
      .append("g")
      .attr("stroke-linecap", "round")
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("x1", (d) => d.source.x)
      .attr("y1", (d) => d.source.y)
      .attr("x2", (d) => d.target.x)
      .attr("y2", (d) => d.target.y)
      .attr("stroke", "#cfc4e6")
      .attr("stroke-opacity", 0.5)
      .attr("stroke-width", (d) => 1 + Math.log2(d.weight || 1));

    // 连线关系标注
    const edgeLabelSel = root
      .append("g")
      .selectAll("text")
      .data(links)
      .join("text")
      .attr("x", (d) => (d.source.x + d.target.x) / 2)
      .attr("y", (d) => (d.source.y + d.target.y) / 2)
      .attr("text-anchor", "middle")
      .attr("font-size", 8)
      .attr("font-weight", 700)
      .attr("fill", "#c0397a")
      .attr("paint-order", "stroke")
      .attr("stroke", "#fff")
      .attr("stroke-width", 2.5)
      .attr("stroke-linejoin", "round")
      .attr("pointer-events", "none")
      .text((d) => d.label);
    edgeLabelSel.append("title").text((d) => d.sample || "");

    // 聚焦光环
    const haloG = root
      .append("g")
      .selectAll("g")
      .data(nodes)
      .join("g")
      .attr("transform", (d) => `translate(${d.x},${d.y})`)
      .attr("display", (d) => (d.id === currentFocus.value ? null : "none"))
      .attr("pointer-events", "none");
    haloG
      .append("circle")
      .attr("r", (d) => radius(d) + 7)
      .attr("fill", "none")
      .attr("stroke", "#ff6f9c")
      .attr("stroke-width", 2.5);
    haloG
      .append("circle")
      .attr("r", (d) => radius(d) + 7)
      .attr("fill", "none")
      .attr("stroke", "#ff6f9c")
      .attr("stroke-width", 1.5)
      .attr("opacity", 0.7)
      .append("animate")
      .attr("attributeName", "r")
      .attr("values", (d) => `${radius(d) + 7};${radius(d) + 18};${radius(d) + 7}`)
      .attr("dur", "1.8s")
      .attr("repeatCount", "indefinite");

    const nodeSel = root
      .append("g")
      .selectAll("circle")
      .data(nodes)
      .join("circle")
      .attr("cx", (d) => d.x)
      .attr("cy", (d) => d.y)
      .attr("r", radius)
      .attr("fill", (d) => dynastyColor(d.birth))
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5)
      .style("cursor", "pointer")
      .on("click", (ev, d) => {
        ev.stopPropagation();
        setFocus(d.id === currentFocus.value ? "" : d.id);
      });

    const labelSel = root
      .append("g")
      .selectAll("text")
      .data(nodes)
      .join("text")
      .text((d) => d.id)
      .attr("x", (d) => d.x)
      .attr("y", (d) => d.y + radius(d) + 12)
      .attr("font-size", 11)
      .attr("font-weight", 700)
      .attr("fill", "#5c4a86")
      .attr("text-anchor", "middle")
      .attr("pointer-events", "none");

    // 主节点（当前聚焦）支持手动拖动
    function refreshNode(d) {
      nodeSel.filter((n) => n.id === d.id).attr("cx", d.x).attr("cy", d.y);
      labelSel
        .filter((n) => n.id === d.id)
        .attr("x", d.x)
        .attr("y", d.y + radius(d) + 12);
      haloG
        .filter((n) => n.id === d.id)
        .attr("transform", `translate(${d.x},${d.y})`);
      linkSel
        .filter((l) => l.source.id === d.id || l.target.id === d.id)
        .attr("x1", (l) => l.source.x)
        .attr("y1", (l) => l.source.y)
        .attr("x2", (l) => l.target.x)
        .attr("y2", (l) => l.target.y);
      edgeLabelSel
        .filter((l) => l.source.id === d.id || l.target.id === d.id)
        .attr("x", (l) => (l.source.x + l.target.x) / 2)
        .attr("y", (l) => (l.source.y + l.target.y) / 2);
    }

    nodeSel.call(
      d3
        .drag()
        .filter((ev, d) => d.id === currentFocus.value)
        .on("start", (ev) => {
          if (ev.sourceEvent) ev.sourceEvent.stopPropagation();
        })
        .on("drag", (ev, d) => {
          d.x = ev.x;
          d.y = ev.y;
          refreshNode(d);
        })
    );

    applyHighlight = (focusId) => {
      const neighbors = new Set();
      if (focusId) {
        neighbors.add(focusId);
        links.forEach((l) => {
          if (l.source.id === focusId) neighbors.add(l.target.id);
          if (l.target.id === focusId) neighbors.add(l.source.id);
        });
      }
      const dim = (d) => (focusId ? (neighbors.has(d.id) ? 1 : 0.12) : 1);
      haloG.attr("display", (d) => (d.id === focusId ? null : "none"));
      nodeSel
        .attr("opacity", dim)
        .attr("stroke", (d) => (d.id === focusId ? "#ff6f9c" : "#fff"))
        .attr("stroke-width", (d) => (d.id === focusId ? 3.5 : 1.5));
      labelSel.attr("opacity", dim);
      linkSel
        .attr("stroke", (l) =>
          focusId && (l.source.id === focusId || l.target.id === focusId)
            ? "#ff6f9c"
            : "#cfc4e6"
        )
        .attr("stroke-opacity", (l) => {
          if (!focusId) return 0.5;
          return l.source.id === focusId || l.target.id === focusId ? 0.95 : 0.06;
        })
        .attr("stroke-width", (l) => {
          const base = 1 + Math.log2(l.weight || 1);
          return focusId && (l.source.id === focusId || l.target.id === focusId)
            ? base + 1.6
            : base;
        });
      edgeLabelSel.attr("opacity", (l) => {
        if (!focusId) return 0;
        return l.source.id === focusId || l.target.id === focusId ? 1 : 0;
      });
    };

    focusView = (focusId) => {
      if (!focusId) {
        svg.transition().duration(600).call(zoom.transform, d3.zoomIdentity);
        return;
      }
      const f = nodes.find((n) => n.id === focusId);
      if (!f) {
        svg.transition().duration(600).call(zoom.transform, d3.zoomIdentity);
        return;
      }
      const k = 1.8;
      const tx = width / 2 - k * f.x;
      const ty = height / 2 - k * f.y;
      svg
        .transition()
        .duration(600)
        .call(zoom.transform, d3.zoomIdentity.translate(tx, ty).scale(k));
    };

    applyHighlight(currentFocus.value);
    focusView(currentFocus.value);

    cleanup = () => {
      svg.selectAll("*").remove();
    };
  } catch (e) {
    error.value = String((e && e.message) || e);
    console.error(e);
  }
});

onUnmounted(() => cleanup());
</script>

<style lang="less" scoped>
.pg-overlay {
  position: fixed;
  inset: 0;
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(24, 12, 48, 0.55);
  backdrop-filter: blur(6px);
}
.pg-panel {
  position: relative;
  width: min(1100px, 94vw);
  height: min(720px, 90vh);
  border-radius: 22px;
  overflow: hidden;
  background: linear-gradient(160deg, #fff9f2, #f6efff 60%, #eef6ff);
  box-shadow: 0 24px 60px rgba(60, 20, 110, 0.5);
  display: flex;
  flex-direction: column;
}
.pg-head {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 20px;
  border-bottom: 1px solid rgba(150, 120, 200, 0.16);
  .pg-title {
    font-size: 17px;
    font-weight: 800;
    color: #6a4fa8;
    letter-spacing: 1px;
  }
  .pg-focus {
    font-size: 13px;
    color: #ff7fb0;
    font-weight: 700;
    .pg-reset {
      margin-left: 8px;
      border: none;
      cursor: pointer;
      padding: 2px 10px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 700;
      color: #6a4fa8;
      background: rgba(150, 120, 200, 0.16);
    }
  }
}
.pg-close {
  margin-left: auto;
  width: 34px;
  height: 34px;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  color: #fff;
  font-size: 15px;
  background: rgba(120, 90, 180, 0.5);
  &:hover {
    background: rgba(120, 90, 180, 0.75);
  }
}
.pg-body {
  position: relative;
  flex: 1;
  min-height: 0;
}
.pg-svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
}
.pg-hint {
  padding: 8px 20px 12px;
  font-size: 12px;
  color: #9a8bbd;
}
.pg-error {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #d94f7a;
  font-size: 15px;
  font-weight: 700;
}
</style>

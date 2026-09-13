// 生成 src/timeline/videos.js：诗人名 -> B 站视频标识（bvid + cid）
// 播放时由前端经 Tauri 后端调用 playurl 接口获取真实直链，无需下载视频文件
// 用法：node tools/gen-video-map.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const MAP_FILE = path.join(ROOT, "src", "timeline", "videos.js");

const MID = "1388499326";
// 合集/列表：唐朝、宋朝
const SEASONS = [
  { id: "510816", label: "唐朝" },
  { id: "525291", label: "宋朝" },
];
// 合集之外的单独视频
const EXTRA = [
  { name: "颜真卿", bvid: "BV1Yw4m1a7CF" },
  { name: "杜审言", bvid: "BV13H4y1u735" },
  { name: "陆龟蒙", bvid: "BV1y2hXzSELh" },
  { name: "程颐", bvid: "BV1uEdcBxEyf" },
  { name: "沈括", bvid: "BV1D1T96oEez" },
];
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36";
const HEADERS = { "User-Agent": UA, Referer: "https://www.bilibili.com" };

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// "一口气看完白居易一生，..." -> "白居易"
const extractName = (title) => {
  const m = title.match(/^一口气看完(.+?)(?:的?一生|，|,)/);
  return m ? m[1].trim() : null;
};

async function getJson(url) {
  const res = await fetch(url, { headers: HEADERS });
  return res.json();
}

async function fetchSeason(seasonId) {
  const url =
    `https://api.bilibili.com/x/polymer/web-space/seasons_archives_list` +
    `?mid=${MID}&season_id=${seasonId}&sort_reverse=false&page_num=1&page_size=100`;
  const json = await getJson(url);
  if (json.code !== 0) throw new Error("B 站 API 错误: " + json.message);
  return json.data.archives;
}

async function fetchInfo(bvid) {
  const json = await getJson(
    `https://api.bilibili.com/x/web-interface/view?bvid=${bvid}`
  );
  if (json.code !== 0) throw new Error(`${bvid}: ${json.message}`);
  return {
    cid: json.data.cid,
    owner: (json.data.owner && json.data.owner.name) || "",
  };
}

async function main() {
  const byName = new Map();
  let total = 0;

  for (const season of SEASONS) {
    const archives = await fetchSeason(season.id);
    total += archives.length;
    console.log(`【${season.label}】合集 ${archives.length} 个视频`);

    for (let i = 0; i < archives.length; i++) {
      const a = archives[i];
      const name = extractName(a.title);
      if (!name) {
        console.warn(`  无法解析诗人名，跳过: ${a.title}`);
        continue;
      }
      if (byName.has(name)) {
        console.log(`  [${i + 1}/${archives.length}] ${name} 已存在，跳过`);
        continue;
      }
      try {
        const { cid, owner } = await fetchInfo(a.bvid);
        byName.set(name, { name, bvid: a.bvid, cid, owner });
        console.log(
          `  [${i + 1}/${archives.length}] ${name} ${a.bvid} cid=${cid} up=${owner}`
        );
      } catch (e) {
        console.error(`  [${i + 1}/${archives.length}] 获取信息失败 ${name}: ${e}`);
      }
      await sleep(400 + Math.random() * 300);
    }
  }

  for (const item of EXTRA) {
    if (byName.has(item.name)) continue;
    try {
      const { cid, owner } = await fetchInfo(item.bvid);
      byName.set(item.name, { name: item.name, bvid: item.bvid, cid, owner });
      console.log(`【单独】${item.name} ${item.bvid} cid=${cid} up=${owner}`);
    } catch (e) {
      console.error(`【单独】获取信息失败 ${item.name}: ${e}`);
    }
    await sleep(400 + Math.random() * 300);
  }

  const entries = [...byName.values()];
  console.log(`\n共 ${total} 个视频，去重后 ${entries.length} 位诗人`);
  const body = entries
    .map(
      ({ name, bvid, cid, owner }) =>
        `  ${JSON.stringify(name)}: { bvid: ${JSON.stringify(
          bvid
        )}, cid: ${cid}, owner: ${JSON.stringify(owner)}, url: ${JSON.stringify(
          `https://www.bilibili.com/video/${bvid}/`
        )} },`
    )
    .join("\n");

  const content = `// 由 tools/gen-video-map.mjs 生成：诗人名 -> B 站视频标识
// 播放时经 Tauri 后端调用 playurl 获取直链，无需本地视频文件
export const poetVideos = {
${body}
};

export const getPoetVideo = (name) => poetVideos[name] || null;
`;
  fs.writeFileSync(MAP_FILE, content);
  console.log(`已写入 ${path.relative(ROOT, MAP_FILE)}（${entries.length} 条）`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

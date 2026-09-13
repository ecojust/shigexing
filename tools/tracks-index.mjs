import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dir = path.resolve(__dirname, "../src/timeline/tracks");
const indexPath = path.join(dir, "index.js");

const all = fs
  .readdirSync(dir)
  .filter((f) => f.endsWith(".js") && f !== "index.js")
  .map((f) => f.slice(0, -3))
  .sort();

const args = process.argv.slice(2);
let selected;
if (args.length) {
  selected = args;
} else {
  const cur = fs.readFileSync(indexPath, "utf-8");
  selected = [];
  for (const line of cur.split("\n")) {
    const m =
      line.match(/^\s*import\s+([^\s,]+)\s+from\s+["']\.\/([^"']+)\.js["']/) ||
      line.match(
        /^\s*export\s*\{\s*default\s+as\s+([^\s}]+)\s*\}\s*from\s+["']\.\/([^"']+)\.js["']/
      );
    if (m) selected.push(m[2]);
  }
}

const unknown = selected.filter((n) => !all.includes(n));
if (unknown.length) {
  console.error("未知诗人：" + unknown.join("、"));
  process.exit(1);
}

const set = new Set(selected);
const body = all
  .map((n) =>
    set.has(n)
      ? `export { default as ${n} } from "./${n}.js";`
      : `// export { default as ${n} } from "./${n}.js";`
  )
  .join("\n");

const header = [
  "// 由 tools/tracks-index.mjs 生成：按需导出指定诗人",
  "// 取消注释某行即启用该诗人；或运行 `node tools/tracks-index.mjs <诗人名...>` 批量切换",
  `// 当前启用 ${set.size} / ${all.length} 位`,
  "",
].join("\n");

fs.writeFileSync(indexPath, header + body + "\n", "utf-8");
console.log(`已写入 index.js：启用 ${set.size} / ${all.length} 位`);

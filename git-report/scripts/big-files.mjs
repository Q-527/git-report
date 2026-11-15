#!/usr/bin/env node
// big-files.mjs — 列出被 git 跟踪的"大文件"与"不该被跟踪的生成目录文件"。
// 纯只读，仅 stat 工作树中的被跟踪文件，不改动任何东西。
import { execFileSync } from "node:child_process";
import { statSync } from "node:fs";
import { resolve } from "node:path";

const args = process.argv.slice(2);
const get = (n, d = "") => {
  const i = args.indexOf("--" + n);
  return i >= 0 ? args[i + 1] : d;
};
const repo = resolve(get("repo", "."));
const mb = parseFloat(get("mb", "1")) * 1e6;

let files = [];
try {
  const out = execFileSync("git", ["-C", repo, "ls-files", "-z"], { encoding: "utf8" });
  files = out.split("\0").filter(Boolean);
} catch (e) {
  console.error(JSON.stringify({ error: String(e.stderr || e.message) }));
  process.exit(0);
}

const excludedDirs = ["node_modules", "dist", "build", ".next", "out", "vendor", "target"];
const big = [];
let trackedExcluded = 0;
for (const f of files) {
  if (excludedDirs.some((d) => f === d || f.startsWith(d + "/"))) trackedExcluded++;
  let s;
  try {
    s = statSync(resolve(repo, f)).size;
  } catch {
    continue;
  }
  if (s > mb) big.push({ path: f, size: s });
}
big.sort((a, b) => b.size - a.size);
const human = (b) => (b >= 1048576 ? (b / 1048576).toFixed(1) + "MB" : (b / 1024).toFixed(0) + "KB");
console.log(
  JSON.stringify(
    {
      thresholdMB: mb / 1e6,
      bigFiles: big.map((x) => ({ path: x.path, size: human(x.size) })),
      trackedExcludedDirFiles: trackedExcluded,
      note: trackedExcluded > 0 ? "有生成目录文件被跟踪，建议加进 .gitignore" : "",
    },
    null,
    2
  )
);

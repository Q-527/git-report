#!/usr/bin/env node
// repo-stats.mjs — 收集某仓库在指定时间区间内的「丰富变更统计」。
// 数据源：git log --numstat（每条提交逐文件 新增/删除 行数）。
// 输出 JSON：{ commits, files, fileTypeBreakdown, byDay, totals, count, filesList, truncated }
// 仅供 git-report 插件内部调用。

import { execFileSync } from "node:child_process";
import { resolve, join, extname } from "node:path";
import { readFileSync } from "node:fs";

const args = process.argv.slice(2);
const get = (name, def = "") => {
  const i = args.indexOf("--" + name);
  return i >= 0 ? args[i + 1] : def;
};

const repo = resolve(get("repo", "."));
const since = get("since");
const until = get("until", "now");
const topFiles = parseInt(get("top", "15"), 10);
const topPerCommit = parseInt(get("top-commit", "12"), 10);
const maxCommits = parseInt(get("max-commits", "300"), 10);
const override = get("exclude", "");

// ---- 排除逻辑（与 changed-files.mjs 保持一致）----
const DEFAULT_EXCLUDES = [
  "node_modules", "dist", "build", ".next", "out", "vendor", "target",
  ".gradle", "*.min.js", "*.min.css", "package-lock.json", "yarn.lock",
  "pnpm-lock.yaml", "*.lock",
];
let cfgExcludes = [];
try {
  const raw = readFileSync(join(repo, ".git-report.json"), "utf8");
  const cfg = JSON.parse(raw);
  if (Array.isArray(cfg.excludePaths)) cfgExcludes = cfg.excludePaths;
} catch { /* 无配置文件则忽略 */ }

const excludes = override
  ? override.split(",").map((s) => s.trim()).filter(Boolean)
  : cfgExcludes.length
    ? cfgExcludes
    : DEFAULT_EXCLUDES;

function isExcluded(p) {
  if (!p) return true;
  const norm = p.replace(/\\/g, "/");
  const base = norm.split("/").pop();
  for (const e of excludes) {
    if (e.includes("*")) {
      const re = new RegExp(
        "^" +
          e.split("*").map((x) => x.replace(/[.+?^${}()|[\]\\]/g, "\\$&")).join(".*") +
          "$"
      );
      if (re.test(norm) || re.test(base)) return true;
    } else if (e.endsWith("/")) {
      if (norm.startsWith(e)) return true;
    } else if (e.includes("/")) {
      if (norm === e || norm.startsWith(e + "/")) return true;
    } else {
      const segs = norm.split("/");
      if (segs.includes(e) || base === e) return true;
    }
  }
  return false;
}

// ---- 文件类型归类 ----
const EXT_CAT = {
  ".js": "JavaScript", ".jsx": "JavaScript", ".ts": "TypeScript", ".tsx": "TypeScript",
  ".mjs": "JavaScript", ".cjs": "JavaScript", ".css": "CSS", ".scss": "CSS", ".less": "CSS",
  ".html": "HTML", ".vue": "Vue", ".json": "JSON", ".md": "Markdown", ".py": "Python",
  ".go": "Go", ".rs": "Rust", ".java": "Java", ".kt": "Kotlin", ".swift": "Swift",
  ".c": "C", ".cpp": "C++", ".h": "C/C++ Header", ".rb": "Ruby", ".php": "PHP",
  ".sh": "Shell", ".yml": "YAML", ".yaml": "YAML", ".toml": "TOML", ".sql": "SQL",
  ".png": "图片", ".jpg": "图片", ".jpeg": "图片", ".gif": "图片", ".svg": "SVG",
  ".ico": "图标", ".lock": "Lockfile", ".pdf": "PDF", ".txt": "Text",
};
function catFor(path) {
  const e = extname(path).toLowerCase();
  return EXT_CAT[e] || (e ? e.replace(/^\./, "").toUpperCase() + " 文件" : "无扩展名");
}

// ---- 运行 git ----
const gitArgs = ["-C", repo, "log", "--no-merges"];
if (since) gitArgs.push("--since=" + since);
if (until) gitArgs.push("--until=" + until);
gitArgs.push("--numstat", "--pretty=format:%h%x1f%an%x1f%ad%x1f%s", "--date=short");

let raw = "";
try {
  raw = execFileSync("git", gitArgs, { encoding: "utf8", maxBuffer: 256 * 1024 * 1024 });
} catch (e) {
  const msg = e && e.stderr ? e.stderr : String(e);
  process.stdout.write(
    JSON.stringify({
      error: msg, commits: [], files: [], fileTypeBreakdown: {}, byDay: {},
      totals: { commits: 0, files: 0, add: 0, del: 0, authors: [] },
      count: 0, filesList: [], truncated: false,
    })
  );
  process.exit(0);
}

const TYPE_RE = /^(\w+)\s*[:：]/;
const lines = raw.split("\n");
const commits = [];
const fileTotals = new Map();
const byDay = {};
const authors = new Set();
let cur = null;
let truncated = false;

for (const line of lines) {
  if (!line) continue;
  if (line.includes("\x1f")) {
    // 提交头：hash\x1fauthor\x1fdate\x1fsubject
    if (cur) commits.push(cur);
    if (commits.length >= maxCommits) { truncated = true; cur = null; continue; }
    const [hash, author, date, subject = ""] = line.split("\x1f");
    let type = "";
    const m = subject.match(TYPE_RE);
    if (m) type = m[1].toLowerCase();
    cur = {
      hash, author: author || "", date: date || "",
      subject: subject.trim(), type, files: [], add: 0, del: 0, fileCount: 0,
    };
    if (date) {
      if (!byDay[date]) byDay[date] = { commits: 0, add: 0, del: 0, files: new Set() };
      byDay[date].commits++;
    }
    continue;
  }
  if (!cur) continue;
  const parts = line.split("\t");
  if (parts.length < 3) continue;
  let add = parseInt(parts[0], 10);
  if (isNaN(add)) add = 0;
  let del = parseInt(parts[1], 10);
  if (isNaN(del)) del = 0;
  const path = parts[parts.length - 1].trim();
  if (!path || isExcluded(path)) continue;
  cur.files.push({ path, add, del });
  cur.add += add; cur.del += del; cur.fileCount++;
  const ft = fileTotals.get(path) || { add: 0, del: 0 };
  ft.add += add; ft.del += del; fileTotals.set(path, ft);
  const d = cur.date;
  if (!byDay[d]) byDay[d] = { commits: 0, add: 0, del: 0, files: new Set() };
  byDay[d].add += add; byDay[d].del += del; byDay[d].files.add(path);
  authors.add(cur.author);
}
if (cur && commits.length < maxCommits) commits.push(cur);

// 每条提交的文件按改动量截断
for (const c of commits) {
  c.files.sort((a, b) => b.add + b.del - (a.add + a.del));
  if (c.files.length > topPerCommit) c.files = c.files.slice(0, topPerCommit);
}

// Top 改动文件
const filesArr = [...fileTotals.entries()]
  .map(([path, v]) => ({ path, add: v.add, del: v.del, total: v.add + v.del }))
  .sort((a, b) => b.total - a.total)
  .slice(0, topFiles);

// 文件类型分布
const fileTypeBreakdown = {};
for (const [path, v] of fileTotals) {
  const cat = catFor(path);
  if (!fileTypeBreakdown[cat]) fileTypeBreakdown[cat] = { files: 0, add: 0, del: 0 };
  fileTypeBreakdown[cat].files++;
  fileTypeBreakdown[cat].add += v.add;
  fileTypeBreakdown[cat].del += v.del;
}

// byDay 收尾（Set -> 数量）
const byDayOut = {};
for (const [d, v] of Object.entries(byDay)) {
  byDayOut[d] = { commits: v.commits, add: v.add, del: v.del, files: v.files.size };
}

const totals = {
  commits: commits.length,
  files: fileTotals.size,
  add: commits.reduce((s, c) => s + c.add, 0),
  del: commits.reduce((s, c) => s + c.del, 0),
  authors: [...authors],
};

const filesList = [...fileTotals.keys()];

process.stdout.write(
  JSON.stringify({
    commits, files: filesArr, fileTypeBreakdown, byDay: byDayOut, totals,
    count: filesList.length, filesList, truncated,
  }, null, 2)
);

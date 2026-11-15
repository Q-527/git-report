#!/usr/bin/env node
// changed-files.mjs — 统计某仓库在指定时间区间内的"有效变更文件"。
// 自动排除生成目录 / 锁定文件（默认列表 + 仓库内 .git-report.json 的 excludePaths）。
// 仅供 git-report 插件内部调用，输出 JSON：{ count, files, truncated }。

import { execFileSync } from "node:child_process";
import { resolve, join } from "node:path";
import { readFileSync } from "node:fs";

const args = process.argv.slice(2);
const get = (name, def = "") => {
  const i = args.indexOf("--" + name);
  return i >= 0 ? args[i + 1] : def;
};

const repo = resolve(get("repo", "."));
const since = get("since");
const until = get("until", "now");
const top = parseInt(get("top", "15"), 10);
const override = get("exclude", "");

const DEFAULT_EXCLUDES = [
  "node_modules",
  "dist",
  "build",
  ".next",
  "out",
  "vendor",
  "target",
  ".gradle",
  "*.min.js",
  "*.min.css",
  "package-lock.json",
  "yarn.lock",
  "pnpm-lock.yaml",
  "*.lock",
];

// 解析仓库级配置（若存在）
let cfgExcludes = [];
try {
  const raw = readFileSync(join(repo, ".git-report.json"), "utf8");
  const cfg = JSON.parse(raw);
  if (Array.isArray(cfg.excludePaths)) cfgExcludes = cfg.excludePaths;
} catch {
  /* 无配置文件则忽略 */
}

const excludes = override ? override.split(",").map((s) => s.trim()).filter(Boolean) : cfgExcludes.length ? cfgExcludes : DEFAULT_EXCLUDES;

function isExcluded(p) {
  if (!p) return true;
  const norm = p.replace(/\\/g, "/");
  const base = norm.split("/").pop();
  for (const e of excludes) {
    if (e.includes("*")) {
      const re = new RegExp(
        "^" +
          e
            .split("*")
            .map((x) => x.replace(/[.+?^${}()|[\]\\]/g, "\\$&"))
            .join(".*") +
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

let raw = "";
try {
  raw = execFileSync(
    "git",
    ["-C", repo, "log", `--since=${since}`, `--until=${until}`, "--name-only", "--pretty=format:"],
    { encoding: "utf8" }
  );
} catch (e) {
  const msg = e && e.stderr ? e.stderr : String(e);
  process.stdout.write(JSON.stringify({ error: msg, count: 0, files: [], truncated: false }));
  process.exit(0);
}

const files = [
  ...new Set(
    raw
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean)
      .filter((p) => !isExcluded(p))
  ),
];
const sorted = files.slice(0, top);
process.stdout.write(
  JSON.stringify({ count: files.length, files: sorted, truncated: files.length > top }, null, 2)
);

#!/usr/bin/env node
// secret-scan.mjs — 在本地工作树（排除生成目录）中扫描疑似泄露的密钥/凭证。
// 纯只读、纯本地：只报告"在哪个文件第几行发现了哪种模式的疑似凭证"，并**遮蔽**真实值，绝不打印完整密钥。
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const args = process.argv.slice(2);
const get = (n, d = "") => {
  const i = args.indexOf("--" + n);
  return i >= 0 ? args[i + 1] : d;
};
const repo = resolve(get("repo", "."));

const DEFAULT_EXCLUDES = ["node_modules", "dist", "build", ".next", "out", "vendor", "target", "*.min.js", "*.min.css", "*.lock"];
let excludes = DEFAULT_EXCLUDES;
try {
  const cfg = JSON.parse(readFileSync(resolve(repo, ".git-report.json"), "utf8"));
  if (Array.isArray(cfg.excludePaths)) excludes = cfg.excludePaths;
} catch {
  /* ignore */
}
const isExcluded = (p) => {
  const norm = p.replace(/\\/g, "/");
  const base = norm.split("/").pop();
  return excludes.some((e) => {
    if (e.includes("*")) {
      const re = new RegExp("^" + e.split("*").map((x) => x.replace(/[.+?^${}()|[\]\\]/g, "\\$&")).join(".*") + "$");
      return re.test(norm) || re.test(base);
    }
    return norm === e || norm.startsWith(e + "/") || norm.split("/").includes(e) || base === e;
  });
};

// 已知凭证模式（仅检测，不捕获完整值）
const PATTERNS = [
  { type: "AWS Access Key", re: /\bAKIA[0-9A-Z]{16}\b/g },
  { type: "AWS Secret", re: /\b(aws_secret_access_key)\s*[:=]\s*['"]?[A-Za-z0-9\/+]{40}/gi },
  { type: "Private Key", re: /-----BEGIN [A-Z ]*PRIVATE KEY-----/g },
  { type: "Google API Key", re: /\bAIza[0-9A-Za-z\-_]{35}\b/g },
  { type: "Slack Token", re: /\bxox[baprs]-[0-9A-Za-z\-]{10,}/g },
  { type: "GitHub Token", re: /\b(ghp_[0-9A-Za-z]{36}|github_pat_[0-9A-Za-z_]{50,})\b/g },
  { type: "Generic API Key assign", re: /\b(api[_-]?key|secret|token|password|passwd)\b\s*[:=]\s*['"]?[A-Za-z0-9\-_]{16,}/gi },
];

let tracked = [];
try {
  const out = execFileSync("git", ["-C", repo, "ls-files", "-z"], { encoding: "utf8" });
  tracked = out.split("\0").filter(Boolean).filter((f) => !isExcluded(f));
} catch (e) {
  console.error(JSON.stringify({ error: String(e.stderr || e.message) }));
  process.exit(0);
}

const findings = [];
for (const f of tracked) {
  let content;
  try {
    content = readFileSync(resolve(repo, f), "utf8");
  } catch {
    continue; // 二进制或不可读跳过
  }
  if (content.includes("\u0000")) continue; // 二进制
  const lines = content.split("\n");
  lines.forEach((line, idx) => {
    for (const p of PATTERNS) {
      p.re.lastIndex = 0;
      if (p.re.test(line)) {
        // 遮蔽：只保留模式类型与行号，不输出疑似密钥本身
        findings.push({ file: f, line: idx + 1, type: p.type });
        break;
      }
    }
  });
}

console.log(
  JSON.stringify(
    {
      scannedFiles: tracked.length,
      findings,
      note: findings.length ? "以上为疑似凭证，请人工核对并尽快轮换；本工具不会输出真实密钥值" : "未发现常见凭证模式",
    },
    null,
    2
  )
);

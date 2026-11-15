// git-report: 里程碑分组计算
// 优先用 git tag 作为里程碑边界；无 tag 时退化到从 commit message 抽取版本号（如 v1.2.0）；
// 两者皆无则返回 mode="type"，由调用方回落到约定式类型分组，绝不报错。
import { execFileSync } from "node:child_process";

function getArg(name, def) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : def;
}

const repo = getArg("repo", ".");
const since = getArg("since", "1970-01-01");
const until = getArg("until", "now");
const pattern = getArg("pattern", "v\\d+\\.\\d+\\.\\d+");

function git(args) {
  try {
    return execFileSync("git", ["-C", repo, ...args], { encoding: "utf8" }).trim();
  } catch {
    return "";
  }
}

// 1) 收集 tag 及其创建日期（short）
const tagOut = git(["tag", "--list", "--sort=creatordate"]);
const tagNames = tagOut ? tagOut.split("\n").filter(Boolean) : [];
const tags = [];
for (const t of tagNames) {
  const d = git(["log", "-1", "--format=%ad", "--date=short", t]);
  if (d) tags.push({ name: t, date: d });
}

// 2) 区间内的提交
const log = git([
  "log",
  `--since=${since}`,
  `--until=${until}`,
  "--pretty=format:%h%x1f%ad%x1f%s",
  "--date=short",
]);
const commits = log
  ? log
      .split("\n")
      .filter(Boolean)
      .map((line) => {
        const [h, ad, s] = line.split("\x1f");
        return { hash: h, date: ad, subject: s };
      })
  : [];

let mode;
let milestones;

if (tags.length) {
  mode = "tag";
  milestones = groupByTag(commits, tags);
} else {
  const re = new RegExp(pattern, "i");
  const hasMarker = commits.some((c) => re.test(c.subject));
  if (hasMarker) {
    mode = "message";
    milestones = groupByMessage(commits, re);
  } else {
    mode = "type"; // 回落信号
    milestones = [];
  }
}

function groupByTag(commits, tags) {
  const sorted = [...tags].sort((a, b) => a.date.localeCompare(b.date));
  const groups = new Map();
  for (const c of commits) {
    let name = "未打标签(最新)";
    for (const t of sorted) {
      if (c.date >= t.date) name = t.name;
      else break;
    }
    if (!groups.has(name)) groups.set(name, []);
    groups.get(name).push({ hash: c.hash, subject: c.subject, date: c.date });
  }
  return [...groups.entries()]
    .map(([name, items]) => ({ name, commits: items }))
    .reverse(); // 最新里程碑在前
}

function groupByMessage(commits, re) {
  // git log 默认最新在前；改为最旧在前，逐条跟踪"当前里程碑"
  const oldestFirst = [...commits].reverse();
  const groups = new Map();
  let current = null;
  for (const c of oldestFirst) {
    const m = c.subject.match(re);
    if (m) current = m[0];
    const key = current || "初始提交(未标记版本)";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push({ hash: c.hash, subject: c.subject, date: c.date });
  }
  // 组按最新在前，组内提交也最新在前
  return [...groups.entries()]
    .reverse()
    .map(([name, items]) => ({ name, commits: items.reverse() }));
}

console.log(
  JSON.stringify(
    { mode, commitCount: commits.length, tagCount: tags.length, milestones },
    null,
    2,
  ),
);

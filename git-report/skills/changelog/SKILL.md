---
name: changelog
description: 从两个 git tag（或 tag 到 HEAD）之间的提交，按约定式规范生成 CHANGELOG.md / Release Notes（standard-version 风格）
disable-model-invocation: false
---

# 生成 Changelog / Release Notes

## 0. 读取配置
先 Read 当前仓库根的 `.git-report.json`；失败用默认值（language 默认 zh、emoji 默认 true、excludeTypes 默认 ["chore","style","docs"]、members 默认 {}）。

## 1. 确定区间
- 用户给了两个 tag（如 `v1.0.0..v1.1.0`）：用 `git log <from>..<to>`。
- 只给一个 tag：用 `git log <tag>..HEAD`（相对最新发布到现在）。
- 都没给：列出可用 tag（`git tag --sort=-creatordate`），让用户选；或默认取最近两个 tag。
- 校验 tag 存在：`git rev-parse <tag>` 失败则提示并询问。

## 2. 收集
`git -C <p> log <range> --pretty=format:"%h|%an|%ad|%s" --date=short`
多仓库时分别取各自区间再合并。
跳过合并提交（message 以 `Merge ` 开头）。

## 2.5 改动统计（走富数据脚本）
为让 Changelog 顶部多一行"这次发版到底动了多少"，再用脚本取区间汇总：
1. 取两端日期：`FROM_DATE=$(git -C <p> show -s --format=%ad --date=short <from>)`，`TO_DATE=$(git -C <p> show -s --format=%ad --date=short <to 或 HEAD>)`。
2. `node ${CLAUDE_PLUGIN_ROOT}/scripts/repo-stats.mjs --repo <p> --since "<FROM_DATE> 00:00" --until "<TO_DATE> 23:59"`。
3. 读返回 `totals`（提交/文件/+/−行）与 `fileTypeBreakdown`（类型分布），在 Changelog 顶部"## [版本] - 日期"之下补一行汇总，例如：
   `> 本次共 N 次提交，改动 M 个文件，+X / -Y 行；主要改动类型：JavaScript、CSS。`
   无数据则跳过。多仓库时各自统计后合并展示。

## 3. 分组（standard-version 风格）
按 type 归入固定区块，顺序如下：
- ✨ Features → feat
- 🐛 Bug Fixes → fix
- 📝 Documentation → docs
- ♻️ Code Refactoring → refactor
- ⚡ Performance → perf
- ✅ Tests → test
- 🔧 Build & Chores → build / chore / ci
- 🔥 Reverts → revert
- 其他 → 其余 type
`excludeTypes` 中的类型整体跳过。
每条格式：`* <去掉 type 前缀后的描述> (<short-hash>)`；若 message 含工单号（按 ticketPattern）一并保留。

## 4. 输出
顶部：`## [<to 或 HEAD>] - <日期>`。
按区块列出；无内容的区块省略。
按 `language`：en 用英文区块标题（Features / Bug Fixes / …）；both 中英对照；默认中文（新功能 / 缺陷修复 / 文档 / 重构 / 性能 / 测试 / 构建与杂务 / 回滚）。
emoji=false 时去掉图标，仅用区块标题。

## 5. 落盘
询问用户：追加到仓库根 `CHANGELOG.md`，还是单独写到 `<output.dir>/CHANGELOG-<to>.md`（若 output.enabled）。用 Write 落盘并说明路径。

## 6. 纪律
只基于真实 git 数据，禁止编造提交或描述。

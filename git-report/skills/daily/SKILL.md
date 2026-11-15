---
name: daily
description: 生成今日工作日报，支持 .git-report.json 配置、约定式提交解析、工单聚合、贡献者统计、中英双语与自动落盘
disable-model-invocation: false
---

# 今日工作日报

## 0. 读取配置
先用 Read 尝试读取当前仓库根目录的 `.git-report.json`；失败则用下方默认值。
- `language`: `"zh"` | `"en"` | `"both"`，默认 `"zh"`
- `groupBy`: `"type"` | `"ticket"` | `"author"` | `"chronological"`，默认 `"type"`
- `excludeTypes`: 数组，默认 `["chore","style","docs"]`
- `excludePaths`: 数组，默认排除 `node_modules`/`dist`/`build`/`.next`/`out`/`vendor`/`target`/`*.min.js`/`*.min.css`/各类 `*.lock`（详见 `config` 技能）；用于让"变更文件数"更准确
- `ticketPattern`: 正则字符串，默认 `"([A-Z]{2,}-\d+)"`
- `emoji`: 布尔，默认 `true`
- `members`: `{ git作者名: 显示名 }` 映射，默认 `{}`
- `output`: `{ enabled, dir: ".reports", format: "md" }`，默认 `enabled=false`

## 1. 范围
今天 00:00 到 now。`TODAY=$(date +%Y-%m-%d)`。除非用户明确给了别的区间，否则不追问，直接用今天。

## 2. 收集数据
默认当前目录；用户给路径或多个仓库时，逐个 `git -C <p> rev-parse --is-inside-work-tree` 校验。
对每个仓库拉取：
- 提交列表：`git -C <p> log --since="<TODAY> 00:00" --until="now" --pretty=format:"%h|%an|%ad|%s" --date=short`
- 变更文件（已排除生成目录/锁定文件，统计更稳定）：调用插件脚本
  `node ${CLAUDE_PLUGIN_ROOT}/scripts/changed-files.mjs --repo <p> --since "<TODAY> 00:00" --until "now"`，
  读取返回 JSON 的 `count` 作为变更文件数、`files` 作为涉及文件清单（自动套用 `.git-report.json` 的 `excludePaths` 与默认排除项；如需改列表可加 `--exclude "a,b,c"` 覆盖）。
聚合所有仓库。每条记录：hash、作者（用 `members` 映射成显示名，未映射则原样）、日期、message、变更文件数。
若所有仓库都无提交：如实说"今日暂无提交记录"，绝不编造，结束。

## 2.5 预处理（日报/周报/月报通用）
- 收集前先 `git -C <p> status --porcelain` 检查未提交改动；若有，在报告开头温和提示"当前还有 N 个未提交改动，可能未计入本次报告"。
- 默认跳过 message 以 `Merge ` 开头的合并提交（避免报告充满无意义噪声）；除非用户明确要求保留。
- 若某条提交 diff 极大或 message 极长（疑似由多次改动 `squash` 合并而成），在对应分组下温和提示"该提交可能由多次改动压缩而成，细节已合并"，不强行拆分。

## 3. 解析与分组
- 约定式提交：取 message 首个 `:` 前的词作为 type（feat/fix/docs/style/refactor/perf/test/build/ci/chore/revert）。命中已知 type 归入该类；否则归入"其他"。
- 排除：type 出现在 `excludeTypes` 中则跳过（不计入报告）。
- 工单聚合（`groupBy==="ticket"`）：用 `ticketPattern` 从 message 抽取工单号，按工单分组；无工单的归入"未关联工单"。
- 作者分组（`groupBy==="author"`）：按作者（显示名）分组。
- emoji：`emoji=true` 时各组标题加对应图标（✨feat 🐛fix 📝docs ♻️refactor ⚡perf ✅test 🔧chore 🔥revert/remove）。

## 4. 生成报告
把上面的结构化数据 + 配置（语言、分组方式）交给 `git-report:report-writer` 子代理生成最终通顺叙事；简单场景也可直接生成。
报告含：标题（工作日报 YYYY-MM-DD）、概览（N 提交 / M 文件 / K 作者）、按组进展（通顺中文，不堆原文）、风险/卡点、明日计划（可选）。

## 5. 语言
按 `cfg.language`：`en` 出英文；`both` 先中文后英文；默认中文。

## 6. 落盘
若 `cfg.output.enabled`，用 Write 把报告写到 `<cfg.output.dir>/日报-YYYY-MM-DD.md`（目录不存在先建）。写完告知路径。

## 7. 纪律
只基于真实 git 数据，禁止编造任何提交、作者或进展。

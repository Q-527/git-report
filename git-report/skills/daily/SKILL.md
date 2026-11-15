---
name: daily
description: 生成今日工作日报，支持 .git-report.json 配置、约定式提交解析、工单聚合、贡献者统计、中英双语与自动落盘
disable-model-invocation: false
---

# 今日工作日报

## 0. 读取配置
先用 Read 尝试读取当前仓库根目录的 `.git-report.json`；失败则用下方默认值。
- `language`: `"zh"` | `"en"` | `"both"`，默认 `"zh"`
- `groupBy`: `"type"` | `"ticket"` | `"author"` | `"chronological"` | `"milestone"`，默认 `"type"`
- `excludeTypes`: 数组，默认 `["chore","style","docs"]`
- `excludePaths`: 数组，默认排除 `node_modules`/`dist`/`build`/`.next`/`out`/`vendor`/`target`/`*.min.js`/`*.min.css`/各类 `*.lock`（详见 `config` 技能）；用于让"变更文件数"更准确
- `ticketPattern`: 正则字符串，默认 `"([A-Z]{2,}-\d+)"`
- `emoji`: 布尔，默认 `true`
- `members`: `{ git作者名: 显示名 }` 映射，默认 `{}`
- `output`: `{ enabled, dir: ".reports", format: "md" }`，默认 `enabled=false`

## 1. 范围
今天 00:00 到 now。`TODAY=$(date +%Y-%m-%d)`。除非用户明确给了别的区间，否则不追问，直接用今天。

## 2. 收集数据（富数据模式）
默认当前目录；用户给路径或多个仓库时，逐个 `git -C <p> rev-parse --is-inside-work-tree` 校验。
对每个仓库运行插件的富数据统计脚本（一次性给出提交、逐文件增删行、按天节奏、文件类型分布、Top 改动文件）：
`node ${CLAUDE_PLUGIN_ROOT}/scripts/repo-stats.mjs --repo <p> --since "<TODAY> 00:00" --until "now"`
读取返回的 JSON：
- `commits[]`：每条含 hash、author、date、subject、type、files[{path,add,del}]、add、del、fileCount
- `files[]`：Top 改动文件（按 add+del 排序），含 add/del/total
- `fileTypeBreakdown`：按文件类型统计 文件数/新增/删除
- `byDay`：每天 提交数/新增/删除/涉及文件数（日报通常只有一天）
- `totals`：commits/files/add/del/authors
（changed-files.mjs 仍保留作兜底；repo-stats 不可用时退用它拿 count/files）
把 `members` 映射套到 author 上。每条记录：hash、作者（显示名）、日期、message、变更文件数。
若所有仓库 `totals.commits===0`：如实说"今日暂无提交记录"，绝不编造，结束。

## 2.5 预处理（日报/周报/月报通用）
- 收集前先 `git -C <p> status --porcelain` 检查未提交改动；若有，在报告开头温和提示"当前还有 N 个未提交改动，可能未计入本次报告"。
- 默认跳过 message 以 `Merge ` 开头的合并提交（避免报告充满无意义噪声）；除非用户明确要求保留。
- 若某条提交 diff 极大或 message 极长（疑似由多次改动 `squash` 合并而成），在对应分组下温和提示"该提交可能由多次改动压缩而成，细节已合并"，不强行拆分。

## 3. 解析与分组
- 约定式提交：取 message 首个 `:` 前的词作为 type（feat/fix/docs/style/refactor/perf/test/build/ci/chore/revert）。命中已知 type 归入该类；否则归入"其他"。
- 排除：type 出现在 `excludeTypes` 中则跳过（不计入报告）。
- 工单聚合（`groupBy==="ticket"`）：用 `ticketPattern` 从 message 抽取工单号，按工单分组；无工单的归入"未关联工单"。若配置了 `ticketUrlTemplate`，把工单号渲染成 Markdown 链接；用户额外要求真实标题且环境可用 github MCP / gh 时再解析（见 `issues` 技能）。
- 作者分组（`groupBy==="author"`）：按作者（显示名）分组。
- 里程碑分组（`groupBy==="milestone"`）：运行
  `node ${CLAUDE_PLUGIN_ROOT}/scripts/milestones.mjs --repo <p> --since "<范围起>" --until "<范围止>"`（可追加 `--pattern "<milestonePattern>"`），
  按返回的 `milestones[].name` 分组每个提交。脚本优先用 git tag（取每个提交所属的最新 tag，未打标签的归"未打标签(最新)"）；无 tag 时退化到从 commit message 抽 `vX.Y.Z` 当里程碑边界；两者皆无会返回 `mode:"type"`，此时**回落到上面的 type 分组**，不会出错。
- emoji：`emoji=true` 时各组标题加对应图标（✨feat 🐛fix 📝docs ♻️refactor ⚡perf ✅test 🔧chore 🔥revert/remove）。

## 4. 生成报告（详细模式）
把 §2 的完整 JSON + 配置（language / groupBy / detail / members / excludeTypes）交给 `git-report:report-writer` 子代理，要求按"详细模式"排版（见 report-writer 模板：概览 + 每日节奏表 + 提交明细 + 改动榜 + 类型分布 + 分组 + 风险 + 明日建议）。
`detail` 配置为 `normal` 时，子代理省略"每日节奏表 / 改动榜 / 类型分布"三张表，只保留概览 + 提交明细 + 分组 + 建议；默认 `rich` 出全量。
简单场景也可直接生成，但须保持同样的详细结构。

## 5. 语言
按 `cfg.language`：`en` 出英文；`both` 先中文后英文；默认中文。

## 6. 落盘
若 `cfg.output.enabled`，用 Write 把报告写到 `<cfg.output.dir>/日报-YYYY-MM-DD.md`（目录不存在先建）。写完告知路径。

## 7. 纪律
只基于真实 git 数据，禁止编造任何提交、作者或进展。

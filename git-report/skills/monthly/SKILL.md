---
name: monthly
description: 生成本月工作月报，聚合本月 1 号至今的 git 提交，含贡献者统计、配置、约定式解析、工单聚合、中英双语与自动落盘
disable-model-invocation: false
---

# 本月工作月报

## 0. 读取配置
同 `daily`/`weekly`：先 Read 当前仓库根的 `.git-report.json`，失败用默认值。

## 1. 范围
本月 1 号 00:00 到 now。月初：`date +%Y-%m-01`。除非用户给了别的区间，否则不追问直接本月。

## 2. 收集数据（富数据模式）
默认当前目录；多仓库时逐个 `git -C <p> rev-parse --is-inside-work-tree` 校验。
对每个仓库运行插件的富数据统计脚本（一次性给出提交、逐文件增删行、按天节奏、文件类型分布、Top 改动文件）：
`node ${CLAUDE_PLUGIN_ROOT}/scripts/repo-stats.mjs --repo <p> --since "<月初> 00:00" --until "now"`
读取返回的 JSON：
- `commits[]`：每条含 hash、author、date、subject、type、files[{path,add,del}]、add、del、fileCount
- `files[]`：Top 改动文件（按 add+del 排序），含 add/del/total
- `fileTypeBreakdown`：按文件类型统计 文件数/新增/删除
- `byDay`：每天 提交数/新增/删除/涉及文件数
- `totals`：commits/files/add/del/authors
（changed-files.mjs 仍保留作兜底；repo-stats 不可用时退用它拿 count/files）
把 `members` 映射套到 author 上；若 `totals.commits===0`：如实说"本月暂无提交记录"，不编造，结束。

## 2.5 预处理（日报/周报/月报通用）
- 收集前先 `git -C <p> status --porcelain` 检查未提交改动；若有，在报告开头温和提示"当前还有 N 个未提交改动，可能未计入本次报告"。
- 默认跳过 message 以 `Merge ` 开头的合并提交（避免报告充满无意义噪声）；除非用户明确要求保留。
- 若某条提交 diff 极大或 message 极长（疑似 squash 合并），温和提示"该提交可能由多次改动压缩而成，细节已合并"。

## 3. 解析与分组
与 `daily` 相同：约定式 type 归类、excludeTypes 排除、ticket/author/chronological/**milestone** 分组、emoji 前缀。其中 `milestone` 分组调用 `scripts/milestones.mjs`（优先 git tag，无 tag 时退化到 commit message 里的 `vX.Y.Z`），适合"一月内多个版本里程碑"的月度复盘。

## 4. 贡献者统计（月报专属）
额外统计并输出"本月贡献榜"：
- 每位作者（显示名）的提交数、变更文件数、涉及的主要模块/工单。
- 用 `git -C <p> shortlog -sn --since="<月初>"` 交叉验证作者提交数。
- 若仅一位作者则可省略榜单，只在概览点出。

## 5. 生成报告（详细模式）
把 §2 的完整 JSON + 配置（language / groupBy / detail / members / excludeTypes）交给 `git-report:report-writer` 子代理，要求按"详细模式"排版（见 report-writer 模板：概览 + 每日节奏表 + 提交明细 + 改动榜 + 类型分布 + 分组 + 贡献者 + 风险 + 下月建议）。月报在"按组进展"之后额外插入"贡献者榜单"（每位作者提交数/新增/删除/主要模块），用 §4 的 shortlog 交叉验证。
`detail` 配置为 `normal` 时，子代理省略"每日节奏表 / 改动榜 / 类型分布"三张表，只保留概览 + 提交明细 + 分组 + 贡献者 + 建议；默认 `rich` 出全量。
简单场景也可直接生成，但须保持同样的详细结构。

## 6. 语言
按 `cfg.language`：en 英文；both 中英双语；默认中文。

## 7. 落盘
若 `cfg.output.enabled`，Write 到 `<cfg.output.dir>/月报-YYYY-MM.md`。写完告知路径。

## 8. 纪律
只基于真实 git 数据，禁止编造。

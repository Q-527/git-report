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

## 2. 收集数据
默认当前目录；多仓库时逐个 `git -C <p> rev-parse --is-inside-work-tree` 校验。
对每个仓库：
- 提交列表：`git -C <p> log --since="<月初> 00:00" --until="now" --pretty=format:"%h|%an|%ad|%s" --date=short`
- 变更文件（已排除生成目录/锁定文件）：`node ${CLAUDE_PLUGIN_ROOT}/scripts/changed-files.mjs --repo <p> --since "<月初> 00:00" --until "now"`，读 `count` 与 `files`。
聚合；每条记 hash、作者（members 映射）、日期、message、变更文件数。
若全无提交：如实说"本月暂无提交记录"，不编造，结束。

## 2.5 预处理（日报/周报/月报通用）
- 收集前先 `git -C <p> status --porcelain` 检查未提交改动；若有，在报告开头温和提示"当前还有 N 个未提交改动，可能未计入本次报告"。
- 默认跳过 message 以 `Merge ` 开头的合并提交（避免报告充满无意义噪声）；除非用户明确要求保留。
- 若某条提交 diff 极大或 message 极长（疑似 squash 合并），温和提示"该提交可能由多次改动压缩而成，细节已合并"。

## 3. 解析与分组
与 `daily` 相同：约定式 type 归类、excludeTypes 排除、ticket/author/chronological 分组、emoji 前缀。

## 4. 贡献者统计（月报专属）
额外统计并输出"本月贡献榜"：
- 每位作者（显示名）的提交数、变更文件数、涉及的主要模块/工单。
- 用 `git -C <p> shortlog -sn --since="<月初>"` 交叉验证作者提交数。
- 若仅一位作者则可省略榜单，只在概览点出。

## 5. 生成报告
交给 `git-report:report-writer` 子代理（或简单场景直接生成）。
报告含：标题（工作月报 YYYY-MM）、概览（N 提交 / M 文件 / K 作者）、本月亮点/里程碑、按组进展（通顺中文，不堆原文）、贡献者榜单、风险/遗留问题、下月计划（可选）。

## 6. 语言
按 `cfg.language`：en 英文；both 中英双语；默认中文。

## 7. 落盘
若 `cfg.output.enabled`，Write 到 `<cfg.output.dir>/月报-YYYY-MM.md`。写完告知路径。

## 8. 纪律
只基于真实 git 数据，禁止编造。

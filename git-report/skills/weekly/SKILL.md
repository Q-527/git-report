---
name: weekly
description: 生成本周工作周报，聚合本周一至今的 git 提交，支持配置、约定式提交解析、工单聚合、贡献者统计、中英双语与自动落盘
disable-model-invocation: false
---

# 本周工作周报

## 0. 读取配置
同 `daily`：先 Read 当前仓库根的 `.git-report.json`，失败用默认值
（`language` 默认 zh / `groupBy` 默认 type / `excludeTypes` 默认 ["chore","style","docs"] / `excludePaths` 默认排除 node_modules/dist/build/.next/out/vendor/target/*.min.js/*.min.css/*.lock / `ticketPattern` 默认 "([A-Z]{2,}-\d+)" / `emoji` 默认 true / `members` 默认 {} / `output` 默认 disabled）。

## 1. 范围
本周一 00:00 到 now。周一日期：`date -d "last monday" +%Y-%m-%d`（Git Bash）；若今天就是周一则取今天。除非用户给了别的区间，否则不追问直接本周。

## 2. 收集数据
默认当前目录；多仓库时逐个 `git -C <p> rev-parse --is-inside-work-tree` 校验。
对每个仓库：
- 提交列表：`git -C <p> log --since="<周一> 00:00" --until="now" --pretty=format:"%h|%an|%ad|%s" --date=short`
- 变更文件（已排除生成目录/锁定文件）：`node ${CLAUDE_PLUGIN_ROOT}/scripts/changed-files.mjs --repo <p> --since "<周一> 00:00" --until "now"`，读 `count` 与 `files`。
聚合；每条记 hash、作者（members 映射）、日期、message、变更文件数。
若全无提交：如实说"本周暂无提交记录"，不编造，结束。

## 2.5 预处理（日报/周报/月报通用）
- 收集前先 `git -C <p> status --porcelain` 检查未提交改动；若有，在报告开头温和提示"当前还有 N 个未提交改动，可能未计入本次报告"。
- 默认跳过 message 以 `Merge ` 开头的合并提交（避免报告充满无意义噪声）；除非用户明确要求保留。
- 若某条提交 diff 极大或 message 极长（疑似 squash 合并），温和提示"该提交可能由多次改动压缩而成，细节已合并"。

## 3. 解析与分组
与 `daily` 相同：约定式 type 归类、excludeTypes 排除、ticket/author/chronological 分组、emoji 前缀。

## 4. 生成报告
交给 `git-report:report-writer` 子代理（或简单场景直接生成）。
报告含：标题（工作周报 YYYY-MM-DD，标注周一到周日）、概览（N 提交 / M 文件 / K 作者）、按组进展（通顺中文，不堆原文）、风险/卡点、下周计划（可选）。

## 5. 语言
按 `cfg.language`：en 英文；both 中英双语；默认中文。

## 6. 落盘
若 `cfg.output.enabled`，Write 到 `<cfg.output.dir>/周报-YYYY-MM-DD.md`。写完告知路径。

## 7. 纪律
只基于真实 git 数据，禁止编造。

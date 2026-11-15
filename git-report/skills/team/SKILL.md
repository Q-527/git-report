---
name: team
description: 生成团队视角的周报或区间报告，按贡献者拆分每个人的亮点与改动，支持多仓库与中英双语；单人仓库会提示改用 weekly
disable-model-invocation: false
---

# 团队周报（按人拆分）

复用 `daily` 技能的 §0 配置读取、§2 收集数据（多仓库）、§2.5 预处理、§3 解析与分组、§5 语言、§7 纪律。范围默认本周（同 `weekly` §1），或用户给的区间（同 `range`）。本技能只定义"如何按人组织"。

## 1. 范围
默认本周一 00:00 到 now；用户给区间则按 `range` 解析。

## 2. 按作者拆分（走富数据脚本）
对每个仓库（先 `git -C <p> rev-parse --is-inside-work-tree` 校验），运行：
`node ${CLAUDE_PLUGIN_ROOT}/scripts/repo-stats.mjs --repo <p> --since "<S>" --until "<U>"`
读取返回 JSON 的 `authorStats[]`（已按提交数降序），每位作者直接含：
- `author`：git 名（用 `members` 映射成显示名；未映射则原样）
- `commits`：提交数
- `add` / `del`：新增 / 删除行数
- `files`：涉及文件数
据此即可为每位贡献者写一段亮点，无需再逐人跑 `shortlog`。若想要额外交叉验证，可用 `git -C <p> shortlog -sn --since="<S>" --until="<U>"` 比对提交数。

（旧版用 `changed-files.mjs` 的 `count` 只能给仓库总量、不区分作者，已弃用；富数据脚本一次给全。）

## 3. 生成报告
交给 `git-report:report-writer` 子代理（或简单场景直接生成）。结构：
- 标题（团队周报 YYYY-MM-DD）
- 概览：总提交 / 贡献者人数 / 涉及仓库
- **每位贡献者一段**：用通顺中文/英文写"本周亮点"，归纳其提交（按 type/工单分组），不堆原文；标注其提交数与主要模块
- 协作/风险小结：跨人依赖、集中风险、未提交改动提醒（沿用 §2.5）

## 4. 边界
若全部仓库仅 1 位作者：温和提示"当前为单人产出，团队视角意义不大，建议用 `/git-report:weekly` 看个人周报"，仍可按用户要求输出。

## 5. 语言与落盘
按 `cfg.language`；若 `cfg.output.enabled`，写到 `<cfg.output.dir>/团队周报-YYYY-MM-DD.md`。

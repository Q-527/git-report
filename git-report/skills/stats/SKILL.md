---
name: stats
description: 分析提交节奏与贡献分布：总提交、活跃天数、最忙星期几/时段、最长连续提交 streak、人均产出与最活跃作者；纯本地只读
disable-model-invocation: false
---

# 提交节奏分析（Rhythm）

不止"数提交"，而是刻画你/团队的开发节律。纯只读，可作用于全部历史或指定区间。

## 1. 范围
默认全部历史；用户给区间则按 `range` 解析（如"最近 90 天"），换算成 `--since/--until` 传给下方脚本。

## 2. 取数据（统一走富数据脚本）
运行插件脚本一次性拿到节奏所需全部统计量：
`node ${CLAUDE_PLUGIN_ROOT}/scripts/repo-stats.mjs --repo <p> --since "<S>" --until "<U>"`
读取返回的 JSON，关键字段：
- `totals`：`{commits, files, add, del, authors[]}`
- `byDay`：每天 `{commits, add, del, files}`
- `authorStats[]`：每位作者 `{author, commits, add, del, files}`（已按提交数降序）
- `commits[]`：每条含 `date`，用于 streak / 星期几分布

仅"最忙时段（按小时）"无法从上面直接得到，额外取一次时间戳：
`git -C <p> log --since="<S>" --until="<U>" --pretty=format:"%ad" --date=iso`
（每行一个 ISO 时间戳，含时区偏移，用于把 UTC 归到本地小时。）

多仓库时逐个跑并合并（提交数/行数相加；byDay 按日期归并；authorStats 按作者名归并）。

## 3. 指标（基于上面的数据计算，纯本地、无需联网）
- 总提交数（`totals.commits`）
- 涉及作者数 + `git shortlog -sn` 交叉验证
- 活跃天数（出现过提交的不同自然日数，来自 `byDay` 的键）
- 最忙星期几（把 `byDay` 各日期映射到 Mon..Sun 后计数）
- 最忙时段（按小时 0–23 计数；用 §2 的时间戳时区偏移归到本地小时）
- 最长连续提交 streak（按 `commits` 的自然日连续天数；缺口即断）
- 人均提交（总/作者数）、最活跃作者及其占比（来自 `authorStats`）
- 周末 vs 工作日占比（仅基于真实比例，不臆测原因）

## 4. 输出
一段"节奏画像" + 一张小表（指标 | 值），末尾给 1–2 句基于真实数据的观察（如"提交高度集中在周三、四，周末几乎为零"）。
绝不评价个人生活，仅陈述分布事实。

## 5. 纪律
纯只读，不改动任何文件，不调用网络/MCP；只基于真实 git 数据。

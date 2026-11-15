---
name: range
description: 按用户指定的任意时间区间（如"上周""2026-01-01 到 2026-01-15""最近 7 天"）生成工作进展报告，支持全部配置项、约定式解析、工单聚合、贡献者统计、中英双语与自动落盘
disable-model-invocation: false
---

# 自定义时间区间报告

复用 `daily` 技能的完整流程，仅把"范围"替换为下面的自定义区间。请先 Read `daily` 技能（同插件 `skills/daily/SKILL.md`）的 §0 配置读取、§2 收集数据、§2.5 预处理、§3 解析分组、§4 生成、§5 语言、§6 落盘、§7 纪律，并严格照做；本技能只定义"范围如何确定"。

## 1. 确定范围（替代 daily §1）

从用户的话里提取区间，二选一即可，不追问已明确的信息：

- **相对说法**：
  - "上周" → 上周一 00:00 到 上周日 23:59（或本周一 00:00 作为 until）。
  - "最近 N 天" → `date -d "N days ago" +%Y-%m-%d 00:00` 到 now。
  - "本月/本周/今天" → 直接复用 daily/weekly/monthly 的默认范围即可，不必走本技能。
- **显式日期**：`YYYY-MM-DD` 到 `YYYY-MM-DD`，或 `YYYY-MM-DD HH:MM` 到 `YYYY-MM-DD HH:MM`。不足两位补零。

计算示例（Git Bash）：
```bash
SINCE=$(date -d "2026-01-01" +%Y-%m-%d)" 00:00"
UNTIL=$(date -d "2026-01-15" +%Y-%m-%d)" 23:59"
# 或开放式：
UNTIL="now"
```

## 2. 容错
- 若日期解析失败或 since ≥ until，向用户说明并请其确认，不要硬跑。
- 区间跨度很大时（> 3 个月），在报告开头提示"区间较长，建议按月拆分查看"。

## 3. 收集 / 解析 / 生成 / 落盘
完全沿用 `daily` 对应章节，把其中的 `<TODAY> 00:00` / `<周一>` / `<月初>` 统一替换为上面算出的 `$SINCE` / `$UNTIL`，文件名用 `报告-<SINCE日期>_至_<UNTIL日期>.md`。

### 3.1 环比上一区间（可选增强）
若用户给的是明确区间（显式日期或"最近 N 天"这类可算出跨度的相对说法），再跑一次 repo-stats 取"紧邻本次区间之前、等长"的上一区间：
- 跨度 = `$UNTIL` − `$SINCE`（天数或秒数）。
- `SINCE2 = $SINCE − 跨度`，`UNTIL2 = $SINCE`。
- `node ${CLAUDE_PLUGIN_ROOT}/scripts/repo-stats.mjs --repo <p> --since "<SINCE2>" --until "<UNTIL2>"`，取返回 `totals` 作 `prevTotals`，带 `prevLabel="上一区间"`。
- 若区间无法换算（如纯相对含糊说法）或用户未要求对比，跳过 `prevTotals`，不报错。
把 `prevTotals` + `prevLabel` 一并交给 report-writer 用于概览环比。

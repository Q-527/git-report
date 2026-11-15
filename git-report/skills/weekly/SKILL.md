---
name: weekly
description: 生成本周中文工作周报，聚合本周一 00:00 至今的 git 提交
disable-model-invocation: false
---

帮用户生成"本周工作周报"。

范围：本周一 00:00 到当前时刻。周一日期用 `date -d "last monday" +%Y-%m-%d`（Git Bash）取得；若今天就是周一，则取今天。其余流程与 daily 完全一致（多仓库、--since/--until、聚合、中文分组、禁止编造、询问落盘）。

报告结构：
- 标题：工作周报（YYYY-MM-DD 当周，标注周一到周日）
- 概览：本周 N 个提交、M 个文件变更
- 按模块 / 功能分组的核心进展（通顺中文，不堆原文）
- 风险 / 卡点
- 下周计划（可选，简短）

只基于真实 git 数据，禁止编造。输出后询问是否写入 `报告-周-YYYY-MM-DD.md`。

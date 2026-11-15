---
name: daily
description: 生成今日中文工作日报，基于当前或指定 git 仓库今天的提交记录
disable-model-invocation: false
---

帮用户生成"今日工作日报"。

范围：今天 00:00 到当前时刻。除非用户明确给了别的日期区间，否则不要追问，直接用今天。

执行步骤：
1. 确定仓库：默认当前目录。若用户给了路径，或说"所有项目 / 多个仓库"，收集这些路径，逐个用 `git -C <path> rev-parse --is-inside-work-tree` 校验是否 git 仓库。
2. 取得今天日期：`date +%Y-%m-%d`。
3. 对每个仓库拉取提交：
   `git -C <path> log --since="<今天日期> 00:00" --until="now" --pretty=format:"%ad|%h|%an|%s" --date=short --stat`
4. 若所有仓库都没有提交，如实告知"今日暂无提交记录"，绝不编造。
5. 汇总成中文报告：
   - 标题：工作日报（YYYY-MM-DD）
   - 概览：共 N 个提交、M 个文件变更（多仓库聚合后）
   - 按模块 / 功能分组的核心进展：把 "feat: 加登录" 这类原文翻成通顺中文叙述，不要逐条罗列 commit message
   - 风险 / 卡点（如有关联的失败提交、WIP 半成品）
   - 明日计划（简短，可选）
6. 只基于真实 git 数据，禁止编造任何提交或进展。
7. 输出后询问是否写入 `报告-YYYY-MM-DD.md`。

---
name: issues
description: 把报告中的工单号渲染成可点击链接，并在环境可用时（github MCP 或 gh）解析真实标题，实现 Issue/Jira 双向联动；无需 token 时退化为纯链接
disable-model-invocation: false
---

# 工单联动（Issue / Jira 双向）

让报告里的 `JIRA-123` / `#42` 不再是裸文本，而是有用信息。

## 1. 链接（零依赖）
若 `.git-report.json` 配置了 `ticketUrlTemplate`（如 `https://github.com/Q-527/foo/issues/{ticket}` 或 `https://your-domain.atlassian.net/browse/{ticket}`），把每个工单号渲染成 Markdown 链接 `[JIRA-123](展开后的 URL)`。

## 2. 解析真实标题（需环境）
当用户要求"显示真实标题"且环境具备以下之一时，解析工单号对应的标题：
- **github MCP**（本插件常配）：用 MCP 工具拉取当前仓库对应 issue 的标题。
- **`gh` CLI**：`gh issue view <n> --json title -q .title`（需已登录）。
- Jira 等：若配置了 `ticketUrlTemplate` 指向 Jira 且用户提供了 Jira API token，可用其 REST API 解析（由用户在下一条消息提供 token，本技能不主动索要）。

## 3. 降级
- 没有 `ticketUrlTemplate` 也没有可用解析工具：保留工单号原文，并在报告脚注注明"未配置工单链接/解析"。
- 解析失败（issue 不存在/无权限）：保留链接，标题处标"（无法解析）"，不报错中断报告。

## 4. 与报告技能协作
`daily`/`weekly`/`monthly`/`team`/`range` 在"工单聚合"分组时：先按 §1 渲染链接；若用户额外要求真实标题，再按 §2 解析。默认只做链接，不额外消耗 token。

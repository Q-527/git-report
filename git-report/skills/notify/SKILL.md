---
name: notify
description: 把已生成的报告推送到飞书/钉钉/Slack 群。仅手动触发；目标 webhook 来自配置或环境变量，发送前先展示预览并确认，绝不自动推送
disable-model-invocation: true
---

# 推送到群（飞书 / 钉钉 / Slack）

把某份报告（刚生成的，或 `<cfg.output.dir>` 里的 `.md`）发到团队群。**只手动触发，绝不自动发送。**

## 1. 确定内容与目标
- 内容：刚生成的报告文本，或用户指定的 `.md` 文件路径。
- 目标：`feishu` / `dingtalk` / `slack` 三选一。
- webhook 来源优先级：`--webhook` 参数 > 环境变量 `FEISHU_WEBHOOK`/`DINGTALK_WEBHOOK`/`SLACK_WEBHOOK` > `.git-report.json` 的 `notify.<target>`。

## 2. 发送前必须确认
先把报告预览（前若干行）与"将发送到：<目标平台>（webhook 域名脱敏）"展示给用户，**等用户确认后再发**。绝不在未经确认时 POST。

## 3. 发送
调用插件脚本（比手拼 curl 更稳，避免多行文本引号问题）：
```bash
node ${CLAUDE_PLUGIN_ROOT}/scripts/notify.mjs --target feishu --file "<报告路径>"
# 或
node ${CLAUDE_PLUGIN_ROOT}/scripts/notify.mjs --target slack --text "$(cat 报告.md)"
```
脚本返回 `{ ok, status }`。失败则展示错误信息，不重试超过一次。

## 4. 安全纪律（必须）
- 绝不把 webhook 地址或报告内容写入任何文件/记忆；只在本次会话内存放。
- 绝不读取、上传报告之外的代码或数据。
- 不自动推送、不定时发送；每次发送都需用户当次明确确认。
- 若用户未提供任何 webhook 来源，提示其配置，不臆造地址。

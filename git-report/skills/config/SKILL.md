---
name: init
description: 在当前 git 仓库生成 .git-report.json 配置文件，自定义报告语言、分组方式、排除项、工单正则、贡献者别名、输出路径与周五提醒
disable-model-invocation: true
---

# 初始化 git-report 配置

在当前目录的 git 仓库里创建（或覆盖）`.git-report.json`。

## 步骤
1. 校验当前目录是 git 仓库：`git rev-parse --is-inside-work-tree`。不是则提示并结束。
2. 若已存在 `.git-report.json`，先问用户是否覆盖。
3. 用 Write 创建文件，内容为下方默认 JSON（**纯 JSON，不要写注释**，解析器不接受注释）。
4. 在对话里逐项解释字段含义与可选值（见下表），并提醒：保存后 daily/weekly/monthly 会自动读取。

## 默认配置
```json
{
  "language": "zh",
  "groupBy": "type",
  "excludeTypes": ["chore", "style", "docs"],
  "excludePaths": ["node_modules", "dist", "build", ".next", "out", "vendor", "target", "*.min.js", "*.min.css", "package-lock.json", "yarn.lock", "pnpm-lock.yaml", "*.lock"],
  "ticketPattern": "([A-Z]{2,}-\\d+)",
  "ticketUrlTemplate": "",
  "notify": { "feishu": "", "dingtalk": "", "slack": "" },
  "emoji": true,
  "members": {},
  "output": { "enabled": false, "dir": ".reports", "format": "md" },
  "repos": [],
  "autoReminder": true
}
```

## 字段说明
| 字段 | 可选值 | 含义 |
| --- | --- | --- |
| `language` | `zh` / `en` / `both` | 报告语言，both 时先中文后英文 |
| `groupBy` | `type` / `ticket` / `author` / `chronological` | 提交分组方式 |
| `excludeTypes` | 字符串数组 | 这些约定式类型不计入报告（如杂务、样式、文档） |
| `excludePaths` | 字符串数组 | 变更文件统计时排除的路径/目录/ glob（如 `node_modules`、`dist`、`*.lock`）；也支持在 `git-report:range` / 周期报告里让"变更文件数"更准确 |
| `ticketPattern` | 正则字符串 | 从 commit message 抽取工单号的正则，用于按工单聚合 |
| `ticketUrlTemplate` | 字符串 | 工单号渲染链接模板，如 `https://github.com/Q-527/foo/issues/{ticket}` 或 Jira `https://x.atlassian.net/browse/{ticket}` |
| `notify` | `{ feishu, dingtalk, slack }` | 三个群机器人的 webhook 地址（也可改用环境变量 `FEISHU_WEBHOOK` 等，避免写入仓库） |
| `emoji` | 布尔 | 分组标题是否加 emoji 图标 |
| `members` | `{ git名: 显示名 }` | 把 git 作者名映射成更好看的中文名 |
| `output.enabled` | 布尔 | 是否自动把报告写成文件 |
| `output.dir` | 路径 | 报告文件存放目录，默认 `.reports` |
| `output.format` | `md` | 文件格式（当前仅 md） |
| `repos` | 字符串数组 | 跨仓库看板（`/git-report:dashboard`）要扫描的仓库路径列表；为空则只用当前目录 |
| `autoReminder` | 布尔 | 周五是否弹"要不要写周报"提醒（插件钩子读取） |

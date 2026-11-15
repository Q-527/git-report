# git-report

一个 Claude Code 插件：从 git 提交记录一键生成**工作日报 / 周报 / 月报**。

不止"把 commit 罗列出来"——它会按你的团队习惯**分组、归纳、翻译成通顺的中文/英文叙述**，还能按工单聚合、统计贡献者、自动落盘。

## 它能做什么

- 按天 / 周 / 月汇总 git 提交，自动切好时间范围（今天 / 本周一 / 本月 1 号）
- **约定式提交解析**：自动把 `feat:` / `fix:` / `docs:` 等归类并加 emoji 图标
- **工单聚合**：从 commit message 抽取 `JIRA-123` / `#42` 这类工单号，按工单分组
- **贡献者统计**：月报自动出"贡献榜"，并支持把 git 作者名映射成中文显示名
- **中英双语**：同一份报告可出中文、英文、或中英双语
- **多仓库聚合**：同时维护多个项目时，一次汇总所有仓库
- **自动落盘**：可一键把报告写成 Markdown 文件
- **周五自动提醒**：装好后在周五打开仓库，会温柔提示"要不要写周报"（可关）
- **可配置**：`/git-report:init` 一键生成 `.git-report.json`，自定义以上所有行为

## 安装

方式一（推荐，Claude Code 2.1.275+ 一步装）：在 Claude Code 会话里执行

```
/plugin install git-report --marketplace Q-527/git-report
```

方式二（通用）：

```bash
claude plugin marketplace add https://github.com/Q-527/git-report
```

然后在 Claude Code 会话里执行 `/plugin`，从列表安装 `git-report`。
（开发期也可直接 `claude --plugin-dir <仓库根目录>` 加载本地副本。）

## 使用

| 命令 | 作用 |
| --- | --- |
| `/git-report:daily` | 今日工作日报（今天 00:00 起） |
| `/git-report:weekly` | 本周工作周报（本周一 00:00 起） |
| `/git-report:monthly` | 本月工作月报（本月 1 号 00:00 起，含贡献者榜单） |
| `/git-report:init` | 在当前仓库生成 `.git-report.json` 配置文件 |

也支持自然语言触发，例如"帮我写个这周的周报""总结一下这个月干了啥"。
指定多个仓库时，直接说"把 A、B、C 三个项目这周的提交汇总一下"即可。

## 配置

运行 `/git-report:init` 会在仓库根生成 `.git-report.json`：

```json
{
  "language": "zh",
  "groupBy": "type",
  "excludeTypes": ["chore", "style", "docs"],
  "ticketPattern": "([A-Z]{2,}-\\d+)",
  "emoji": true,
  "members": { "anann": "宝宝" },
  "output": { "enabled": false, "dir": ".reports", "format": "md" },
  "autoReminder": true
}
```

| 字段 | 可选值 | 含义 |
| --- | --- | --- |
| `language` | `zh` / `en` / `both` | 报告语言，`both` 先中文后英文 |
| `groupBy` | `type` / `ticket` / `author` / `chronological` | 提交分组方式 |
| `excludeTypes` | 数组 | 这些约定式类型不计入报告 |
| `ticketPattern` | 正则字符串 | 从 commit message 抽取工单号 |
| `emoji` | 布尔 | 分组标题是否加 emoji |
| `members` | `{ git名: 显示名 }` | 作者名映射 |
| `output.enabled` | 布尔 | 是否自动写成文件 |
| `output.dir` | 路径 | 报告存放目录 |
| `autoReminder` | 布尔 | 周五是否弹提醒 |

**关闭周五提醒**：把 `autoReminder` 设为 `false`，或删掉配置文件（默认开启）。

## 说明

- 报告只基于真实 git 数据生成，没有提交就如实说"暂无记录"，绝不编造。
- 报告执笔由一个内置子代理 `git-report:report-writer` 完成，主模型更轻、输出更稳定。

## 许可证

MIT

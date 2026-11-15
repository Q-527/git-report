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
- **Changelog / Release Notes**：从两个 tag 之间的提交，按 standard-version 风格生成 `CHANGELOG.md`
- **反向写提交信息**：根据暂存区 diff，生成符合约定式规范的 commit message，确认后可直接提交
- **去噪与提醒**：日报/周报/月报默认跳过合并提交噪声，并在有未提交改动时温和提醒
- **自定义时间区间**：`/git-report:range` 支持"上周""2026-01-01 到 2026-01-15""最近 7 天"等任意区间
- **排除生成目录**：默认忽略 `node_modules`/`dist`/`build`/`vendor`/锁定文件等，文件统计更准（可配 `excludePaths`）
- **PR 描述生成**：`/git-report:pr` 按当前分支相对 main/master 的提交生成标题/描述/测试要点
- **安全优先**：纯本地、只读、显式确认——绝不自动 `git push`、绝不绕过钩子、绝不丢弃改动（见 SAFETY.md）
- **团队周报**：`/git-report:team` 按贡献者拆分每个人的亮点与改动，适合小组复盘
- **跨仓库看板**：`/git-report:dashboard` 一条命令总览所有项目本周进度（用 `repos` 配置多仓库）
- **版本号建议**：`/git-report:version` 依据约定式提交自动建议 major/minor/patch，与 Changelog 联动
- **提交节奏分析**：`/git-report:stats` 刻画最忙星期几/时段、最长连续提交 streak、人均产出
- **GitHub Action 自动周报**：内置 `.github/workflows/weekly-report.yml`，周五自动开周报 Issue

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
| `/git-report:changelog` | 生成 CHANGELOG / Release Notes（两个 tag 之间，约定式分组） |
| `/git-report:commit` | 根据暂存区改动生成约定式提交信息，确认后可直接提交 |
| `/git-report:range` | 按自定义时间区间生成进展报告（"上周""某天到某天""最近 N 天"） |
| `/git-report:pr` | 根据当前分支相对 main/master 的提交生成 PR 描述（不自动推送） |
| `/git-report:team` | 团队周报/区间报告，按贡献者拆分每个人亮点 |
| `/git-report:dashboard` | 跨仓库看板，一条命令总览所有项目本周进度 |
| `/git-report:version` | 依据约定式提交建议语义化版本号（major/minor/patch） |
| `/git-report:stats` | 提交节奏分析：最忙星期几/时段、连续提交 streak、人均产出 |

也支持自然语言触发，例如"帮我写个这周的周报""总结一下这个月干了啥""给这次改动写个提交信息""上个月 1 号到 15 号我干了啥""给这个分支写个 PR 描述""把 A、B、C 三个项目这周的进度汇总一下""这次该发几版本""我最近三个月提交节奏怎么样"。
指定多个仓库时，直接说"把 A、B、C 三个项目这周的提交汇总一下"即可。

## 配置

运行 `/git-report:init` 会在仓库根生成 `.git-report.json`：

```json
{
  "language": "zh",
  "groupBy": "type",
  "excludeTypes": ["chore", "style", "docs"],
  "excludePaths": ["node_modules", "dist", "build", ".next", "out", "vendor", "target", "*.min.js", "*.min.css", "package-lock.json", "yarn.lock", "pnpm-lock.yaml", "*.lock"],
  "ticketPattern": "([A-Z]{2,}-\\d+)",
  "emoji": true,
  "members": { "anann": "宝宝" },
  "output": { "enabled": false, "dir": ".reports", "format": "md" },
  "repos": [],
  "autoReminder": true
}
```

| 字段 | 可选值 | 含义 |
| --- | --- | --- |
| `language` | `zh` / `en` / `both` | 报告语言，`both` 先中文后英文 |
| `groupBy` | `type` / `ticket` / `author` / `chronological` | 提交分组方式 |
| `excludeTypes` | 数组 | 这些约定式类型不计入报告 |
| `excludePaths` | 数组 | 变更文件统计时排除的路径/目录/glob（如 `node_modules`、`dist`、`*.lock`） |
| `ticketPattern` | 正则字符串 | 从 commit message 抽取工单号 |
| `emoji` | 布尔 | 分组标题是否加 emoji |
| `members` | `{ git名: 显示名 }` | 作者名映射 |
| `output.enabled` | 布尔 | 是否自动写成文件 |
| `output.dir` | 路径 | 报告存放目录 |
| `repos` | 数组 | 跨仓库看板要扫描的仓库路径列表；为空则只用当前目录 |
| `autoReminder` | 布尔 | 周五是否弹提醒 |

**关闭周五提醒**：把 `autoReminder` 设为 `false`，或删掉配置文件（默认开启）。

## GitHub Action 自动周报

仓库内置 `.github/workflows/weekly-report.yml`：每周五 09:00 UTC（北京/上海约 17:00）自动开一个本周周报 Issue。开箱步骤：

1. 在自己的项目仓库放一份同样的 workflow 文件（或 fork 本仓库的 `.github/`）。
2. 仓库 **Settings → Secrets → Actions** 添加 `ANTHROPIC_API_KEY`（在 Claude 官方申请）。
3. 工作流已申请 `issues: write` 与 `contents: read` 权限，无需额外配置。

也可在 Actions 页面手动 `Run workflow` 立即试跑。改触发时间编辑文件里的 cron 表达式即可（[crontab.guru](https://crontab.guru) 可可视化调试）。

## 说明

- 报告只基于真实 git 数据生成，没有提交就如实说"暂无记录"，绝不编造。
- 报告执笔由一个内置子代理 `git-report:report-writer` 完成，主模型更轻、输出更稳定。

## 安全保证

git-report 是**只读 + 显式确认**的插件，详见仓库根 `SAFETY.md`。要点：

- 不自动 `git push`、不创建/强推分支、不 `git reset --hard`、不丢弃未提交改动。
- `commit` 只用已暂存内容、不绕过 pre-commit 钩子；`pr` 只生成文本、不代为创建 PR。
- 不联网、不调用 MCP、不上传你的代码或报告。

## 许可证

MIT

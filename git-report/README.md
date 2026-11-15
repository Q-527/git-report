# git-report

一个 Claude Code 插件：从 git 提交记录一键生成**中文工作日报 / 周报 / 月报**。

## 它能做什么

- 按天 / 周 / 月汇总你的 git 提交，无需手工整理
- 自动按模块、功能分组，输出通顺中文，而不是堆一堆 commit message 原文
- 支持多仓库遍历聚合（适合同时维护多个项目的你）
- 零配置，打开仓库就能用；汇报范围自动按"今天 / 本周一 / 本月 1 号"切好

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
| `/git-report:monthly` | 本月工作月报（本月 1 号 00:00 起） |

也支持自然语言触发，例如"帮我写个这周的周报""总结一下这个月干了啥"。
指定多个仓库时，直接说"把 A、B、C 三个项目这周的提交汇总一下"即可。

## 说明

- 报告只基于真实 git 数据生成，没有提交就如实说"暂无记录"，绝不编造。
- 生成的报告可一键写入 `报告-YYYY-MM-DD.md`，方便你直接转发。

## 许可证

MIT

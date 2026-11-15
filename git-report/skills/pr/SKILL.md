---
name: pr
description: 根据当前分支相对 main/master 的提交与差异，生成结构化的 PR 标题、描述与测试要点，支持约定式提交解析与中英双语；绝不自动推送或创建 PR
disable-model-invocation: false
---

# 生成 PR 描述

基于当前分支相对基准分支（main 或 master）的提交，产出一份可直接粘贴的 PR 描述。**本技能只生成文本，不执行任何 git push，也不调用 gh 创建 PR。**

## 0. 读取配置
同 `daily` §0：Read `.git-report.json`，失败用默认值（language 默认 zh、emoji 默认 true 等）。

## 1. 确定基准分支
按顺序检测，命中即用：
```bash
BASE=main
git -C . rev-parse --verify main >/dev/null 2>&1 || BASE=master
```
（若用户明确给了基准分支，以用户为准。）

## 2. 收集数据
- 提交列表：`git --no-pager log ${BASE}..HEAD --pretty=format:"%h|%an|%ad|%s" --date=short`
- 差异概览：`git --no-pager diff --stat ${BASE}...HEAD`
- 若 `HEAD` 与 `BASE` 无差异（提交数为 0）：如实告知"当前分支相对 ${BASE} 没有可提交的改动"，结束。
- 若当前不在分支上（detached HEAD）或尚未推送，温和提示用户先确认分支状态。

## 3. 解析
复用 `daily` §3 的约定式提交解析（type 归类、emoji），把 PR 里的改动按 feat/fix/refactor/… 分组。

## 4. 生成 PR 描述
交给 `git-report:report-writer` 子代理（或简单场景直接生成）。结构：
- **标题**：一条约定式标题，概括本次 PR 主旨（如 `feat: 支持自定义时间区间报告`）。
- **背景 / Why**：本次改动要解决什么问题（基于提交信息合理推断，不编造未提及的需求）。
- **改动内容**：按 type 分组，每条用通顺中文/英文说明，附关键文件。
- **测试要点**：列出建议的回归/验证步骤（基于改动类型推断，标注"建议"而非既定事实）。
- **关联工单**：把 commit 里抽到的工单号（按 `ticketPattern`）列出。
- 若 `language` 为 `en` 出英文、`both` 中英双语、默认中文。

## 5. 安全纪律（必须）
- **绝不**自动执行 `git push`、`gh pr create`、或任何会改动远端/创建 PR 的命令。
- 生成后只把文本展示给用户；若用户要求"真的创建 PR"，给出他们可自行执行的安全命令示例（如 `gh pr create --fill`），但**不要**代为执行，除非用户在下一条消息明确授权。
- 只基于真实 git 数据，禁止编造提交或改动。

## 6. 语言与落盘
按 `cfg.language`。若 `cfg.output.enabled`，可把 PR 描述写到 `<cfg.output.dir>/PR-<分支名>.md`，并提示路径。

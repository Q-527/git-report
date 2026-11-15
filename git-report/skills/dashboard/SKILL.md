---
name: dashboard
description: 一条命令总览所有项目本周（或指定区间）进度：每个仓库的提交数、贡献者、主要改动类型与变更文件数，并给出跨仓库汇总
disable-model-invocation: false
---

# 跨仓库周报 Dashboard

一条命令看"这周所有项目都在干嘛"。纯只读。

## 1. 范围
默认本周一 00:00 到 now；用户给区间则按 `range` 解析。

## 2. 仓库来源（按顺序，命中即用）
1. 用户显式给的路径列表；
2. 否则读当前仓库根的 `.git-report.json` 的 `repos` 数组（绝对路径或相对路径）；
3. 否则仅当前目录。

若最终只有 1 个仓库且无多项目诉求：提示"仅检测到单仓库，细节可用 `/git-report:weekly`"，仍输出该仓库卡片。

## 3. 每个仓库卡片
先 `git -C <p> rev-parse --is-inside-work-tree` 校验，失败跳过并标注。
- 提交数：`git -C <p> log --since="<S>" --until="<U>" --oneline | wc -l`
- 贡献者：`git -C <p> shortlog -sn --since="<S>" --until="<U>"`（取前几名）
- 主要改动类型：复用 `daily` §3 约定式 type 计数，取 top 3（feat/fix/…）
- 变更文件数：`node ${CLAUDE_PLUGIN_ROOT}/scripts/changed-files.mjs --repo <p> --since "<S>" --until "<U>"` 的 `count`

## 4. 输出
- 一张紧凑表格：仓库 | 提交 | 贡献者(前2) | 主要类型 | 变更文件
- 一句话总览："本周 X 个仓库共 N 次提交，最活跃的是 A（M 次）"
- 如有仓库零提交，照实列出"本周无提交"。

## 5. 纪律
只基于真实 git 数据，禁止编造；不改动任何文件（除非 `cfg.output.enabled` 且用户已开启，写到 `<cfg.output.dir>/dashboard-YYYY-MM-DD.md`）。

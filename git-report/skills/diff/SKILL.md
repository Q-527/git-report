---
name: diff
description: 读取单个提交或一段范围的真实 diff（而非仅 commit message），用中文/英文总结"实际改了什么逻辑、影响哪些模块、有何风险"。高成本，默认仅手动触发
disable-model-invocation: true
---

# Diff 感知摘要（读取真实改动）

本技能**只**在用户显式调用 `/git-report:diff` 或明确要求"总结这个 commit 实际改了什么"时运行（默认不自动触发，避免无谓消耗）。

## 1. 确定目标
- 单个提交：`git show --stat <hash>` 先看文件清单与规模。
- 一段范围：`git diff --stat <base>...HEAD` 或 `git diff <a> <b>`。
- 未提交改动：`git diff`（已暂存用 `git diff --cached`）。
用户给 hash / 分支 / "未提交" 三者之一；不明确则问。

## 2. 安全读取（避免一次性灌入超大 diff）
- 先 `git show --stat <hash>`（或 `git diff --stat`）拿到文件级概览与增删行数。
- 仅当总增删 < 约 800 行时，再 `git show <hash>`（或 `git diff`）读取完整 patch。
- 超过阈值：**逐文件**读取关键文件（`Read` 对应文件 + 用 `git show <hash>:<path>` 看该文件此提交的改动），跳过纯格式/依赖变更。
- 绝不把整个大型仓库 diff 无脑塞进上下文。

## 3. 生成逻辑摘要
交给 `git-report:report-writer` 子代理（或自行）产出：
- **改了什么逻辑**：哪些函数/类/模块的行为变了，不只是"改了 X 文件"。
- **影响面**：可能受影响的调用方、对外行为、数据格式。
- **风险/注意**：破坏性变更、边界情况、是否需要迁移或回滚预案。
- 按 `cfg.language` 出中文/英文；引用具体文件与符号名，不臆测未读到的代码。

## 4. 纪律
只基于真实 diff；未读到的部分如实标注"未查看"。只读，不改动任何文件、不提交。

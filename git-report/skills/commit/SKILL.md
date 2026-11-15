---
name: commit
description: 根据 git 暂存区改动（git diff --staged）生成符合约定式规范的提交信息，并可在用户确认后直接提交
disable-model-invocation: false
---

# 生成提交信息（反向）

## 0. 读取配置
先 Read 当前仓库根的 `.git-report.json`；失败用默认值（language 默认 zh、emoji 默认 true）。

## 1. 检查暂存区
- `git status --porcelain` 与 `git diff --staged --stat`。
- 若没有任何 staged 改动：提示"暂存区为空，请先用 `git add` 选中要提交的文件"，结束。
- 若有未暂存的重要改动，温和提醒"还有未暂存的改动，是否一并 add"。

## 2. 分析改动
- 读 `git diff --staged`（大文件可分段读）理解"改了什么、为什么"。
- 参考 `git log --oneline -10` 保持与近期提交语气一致。

## 3. 生成提交信息
遵循 Conventional Commits：
```
<type>(<scope 可选>): <subject>

<body 可选，解释 why 而非 what>
<footer 可选：BREAKING CHANGE: ... 或 关联工单 ABC-123>
```
- type 依改动性质推断：feat / fix / refactor / perf / docs / test / chore / style / build / ci。
- subject：按 `language` 出中文或英文（默认中文），简洁、祈使、不超过 50 字。
- 有破坏性改动：加 `!` 或 `BREAKING CHANGE` 段。
- 若 diff 含多个不相关主题：建议拆成多条提交，并分别给出信息。

## 4. 呈现与执行
- 先把生成的信息展示给用户确认。
- 用户同意后：用 Bash 执行 `git commit -m "<subject>" -m "<body>"`（多段用多个 `-m` 拼接）。
- 除非用户明确要求：不要用 `git commit -a`、`--no-verify`，不要绕过 hook。
- 提交后回显新生成的 commit hash。

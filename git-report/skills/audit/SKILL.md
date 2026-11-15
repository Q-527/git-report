---
name: audit
description: 仓库健康/安全卫生检查：检测被跟踪的大文件、疑似泄露的密钥（遮蔽展示）、不该被跟踪的生成目录、以及超长提交；纯只读、不改动任何东西
disable-model-invocation: false
---

# 仓库卫生与安全审计

一次性盘点仓库的"健康隐患"。**纯只读**，不改动文件、不提交、不推送。

## 1. 大文件
`node ${CLAUDE_PLUGIN_ROOT}/scripts/big-files.mjs --repo <p> --mb 1`（阈值 1MB，可调）。
- `bigFiles`：列出超过阈值的被跟踪文件（路径 + 大小）。建议：大文件应改用 Git LFS 或移出仓库。
- `trackedExcludedDirFiles`：若 `node_modules`/`dist` 等被跟踪，提示加入 `.gitignore`。

## 2. 疑似密钥泄露
`node ${CLAUDE_PLUGIN_ROOT}/scripts/secret-scan.mjs --repo <p>`。
- 扫描工作树（排除生成目录）中的常见凭证模式（AWS / 私钥 / Google / Slack / GitHub / 通用 api_key/secret/token）。
- **只报告 文件:行号:类型，绝不输出密钥真实值**。发现后建议：立即轮换凭证、加入 `.gitignore`、若已提交则用 `git filter-repo` 清理历史。

## 3. 超长提交
- 消息超长：`git log --since=... --pretty=format:"%h|%s" | awk -F'|' 'length($2)>100'`（>100 字提示拆分）。
- diff 超大：`git log --since=... --shortstat` 中增删行数异常高的提交，提示可能应由多次提交或 squash 整理。
- 检测 `.env` / 凭据文件是否被跟踪：`git ls-files | grep -iE '\.env|credentials|\.pem|\.key$'`，命中则高亮警告。

## 4. 输出
一份"卫生清单"：✅/⚠️ 各项结果 + 整改建议（基于真实扫描，不臆测）。若一切干净，明确说"未发现明显隐患"。

## 5. 纪律
只读；密钥值一律遮蔽；不自动修复、不推送、不提交。整改动作（如加 `.gitignore`、轮换密钥）需用户自行或明确授权后执行。

---
name: version
description: 根据自上次 tag（或仓库起始）以来的约定式提交，建议语义化版本号 major/minor/patch 并给出升级理由与 changelog 摘要；只建议、不自动打 tag
disable-model-invocation: false
---

# 版本号建议（SemVer）

把"该发几版本"从拍脑袋变成可解释的规则。纯只读，只输出建议。

## 1. 确定基线
- 上一个 tag：`git describe --tags --abbrev=0 2>/dev/null`；若有则区间为 `<tag>..HEAD`。
- 若无任何 tag：基线为仓库首提交（`git rev-list --max-parents=0 HEAD | head -1`），区间为全量历史。

## 2. 取区间提交
`git log <base>..HEAD --pretty=format:"%s"`（无 tag 则 `git log --pretty=format:"%s"`）。

## 3. 判定规则（conventional commits）
按优先级（高者覆盖低者）：
- 任意提交含 `BREAKING CHANGE`，或 type 后带 `!`（如 `feat!:`、`fix!:`）→ **major**
- 否则任意 `feat:` → **minor**
- 否则任意 `fix:` / `perf:` → **patch**
- 以上都没有（只有 docs/chore/style/refactor/test 等）→ 维持原版本（建议 `patch` 或不升，视情况说明）

## 4. 输出
- 当前版本（取 tag 或 `0.0.0`）、**建议版本**、一句话理由（如"含 2 个 feat、1 个 fix，无破坏性变更 → minor"）
- 按 type 分组的提交清单（可直接喂给 `/git-report:changelog`）
- 若判定 major，单独列出触发破坏性变更的提交。

## 5. 纪律（必须）
- **绝不**自动执行 `git tag`、`npm version`、`gh release create`。
- 只在末尾给出用户可自行执行的示例命令（如 `git tag v1.4.0 && git push --tags`），**不代执行**，除非用户在下一条消息明确授权。
- 只基于真实 git 数据，禁止编造提交。

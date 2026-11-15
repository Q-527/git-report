# git-report

A Claude Code plugin that turns your git history into **daily / weekly / monthly work reports** — without you writing a word of prose.

It does more than dump commits. It groups them your way, summarizes them in plain language (Chinese, English, or both), rolls up contributors, and saves the result to a file if you want.

## What it does

- Summaries by day / week / month, with the time window picked for you (today / this Monday / the 1st of the month)
- **Conventional-commit parsing**: `feat:` / `fix:` / `docs:` etc. get grouped and labeled automatically
- **Ticket grouping**: pull issue numbers like `JIRA-123` / `#42` out of commit messages and group by ticket
- **Milestone grouping**: `groupBy: "milestone"` groups by version — it prefers git tags, and falls back to `vX.Y.Z` in commit messages when there are no tags. Built for repos that commit by version number, where type grouping collapses into a release log
- **Contributors**: the monthly report includes a contributor board, and you can map git usernames to display names
- **Bilingual**: one report in Chinese, English, or both side by side
- **Detailed by default**: daily/weekly/monthly reports come in "rich" mode — a per-day rhythm table, per-commit file-level +/− line counts, the most-changed files, and a file-type breakdown, plus grouping and risks. Set `detail: "normal"` to drop the tables
- **Multi-repo**: summarize several projects in one pass
- **Auto-save**: write the report to a Markdown file with one flag
- **Friday nudge**: after install, opening a repo on Friday gently asks if you want your weekly report (can be turned off)
- **Configurable**: `/git-report:init` writes a `.git-report.json` with all the knobs above
- **Changelog / Release Notes**: from the commits between two tags, in standard-version style
- **Commit messages**: draft a conventional-commit message from your staged diff; commit only after you confirm
- **Noise control**: merge commits are skipped by default, and you're warned about uncommitted changes
- **Custom ranges**: `/git-report:range` handles "last week", "2026-01-01 to 2026-01-15", "last 7 days", anything
- **Generated-dir filtering**: `node_modules` / `dist` / `build` / lockfiles are excluded by default (tune with `excludePaths`)
- **PR descriptions**: `/git-report:pr` writes a title / body / test notes from the branch's commits (doesn't push)
- **Safe by design**: local-only, read-only, explicit confirmation — never auto `git push`, never bypasses hooks, never drops your work (see SAFETY.md)
- **Team reports**: `/git-report:team` splits the writeup per contributor
- **Cross-repo dashboard**: `/git-report:dashboard` shows this week's progress across all projects in one view
- **Version bump suggestions**: `/git-report:version` suggests major/minor/patch from your commits
- **Rhythm analysis**: `/git-report:stats` shows your busiest weekday / hour and longest commit streak
- **GitHub Action weekly report**: a built-in workflow opens a weekly report issue every Friday
- **Diff-aware summary**: `/git-report:diff` reads the actual diff (not just the message) to explain what changed and what could break; expensive, manual only
- **Issue linking**: `/git-report:issues` renders issue numbers as links and resolves real titles when a GitHub token is available
- **Group push**: `/git-report:notify` sends the report to Feishu / DingTalk / Slack, with a preview and confirmation first
- **Security audit**: `/git-report:audit` flags tracked large files, leaked secrets (redacted), stray generated dirs, and oversized commits

## Install

Option A (recommended, Claude Code 2.1.275+), run inside a Claude Code session:

```
/plugin install git-report --marketplace Q-527/git-report
```

Option B (general):

```bash
claude plugin marketplace add https://github.com/Q-527/git-report
```

Then run `/plugin` in a Claude Code session and install `git-report` from the list.
(For local development you can also load a copy directly with `claude --plugin-dir <repo root>`.)

## Usage

| Command | What it does |
| --- | --- |
| `/git-report:daily` | Today's report (since 00:00) |
| `/git-report:weekly` | This week's report (since Monday 00:00) |
| `/git-report:monthly` | This month's report (since the 1st, with contributor board) |
| `/git-report:init` | Write a `.git-report.json` in the current repo |
| `/git-report:changelog` | CHANGELOG / Release Notes between two tags |
| `/git-report:commit` | Draft a conventional commit message from staged changes, commit after confirm |
| `/git-report:range` | Report for any custom range ("last week", "Jan 1–15", "last 7 days") |
| `/git-report:pr` | PR description from the branch's commits (doesn't push) |
| `/git-report:team` | Team report split per contributor |
| `/git-report:dashboard` | Cross-repo dashboard of this week's progress |
| `/git-report:version` | Suggest a semver bump (major/minor/patch) from commits |
| `/git-report:stats` | Rhythm analysis: busiest weekday / hour, commit streak |
| `/git-report:diff` | Summarize what a commit actually changed (expensive, manual) |
| `/git-report:issues` | Render issue numbers as links / resolve titles |
| `/git-report:notify` | Push the report to Feishu / DingTalk / Slack (confirm first) |
| `/git-report:audit` | Repo hygiene audit: large files / leaked secrets / oversized commits |

Natural-language triggers work too: "write me this week's report", "what did I do this month", "draft a commit message for these changes", "summarize what this commit actually changed", "send my weekly report to the Feishu group".

## Config

Run `/git-report:init` to create `.git-report.json` in the repo root:

```json
{
  "language": "zh",
  "groupBy": "type",
  "excludeTypes": ["chore", "style", "docs"],
  "excludePaths": ["node_modules", "dist", "build", ".next", "out", "vendor", "target", "*.min.js", "*.min.css", "package-lock.json", "yarn.lock", "pnpm-lock.yaml", "*.lock"],
  "ticketPattern": "([A-Z]{2,}-\\d+)",
  "ticketUrlTemplate": "",
  "milestonePattern": "v\\d+\\.\\d+\\.\\d+",
  "notify": { "feishu": "", "dingtalk": "", "slack": "" },
  "emoji": true,
  "detail": "rich",
  "members": { "anann": "宝宝" },
  "output": { "enabled": false, "dir": ".reports", "format": "md" },
  "repos": [],
  "autoReminder": true
}
```

| Field | Values | Meaning |
| --- | --- | --- |
| `language` | `zh` / `en` / `both` | Report language; `both` does Chinese then English |
| `groupBy` | `type` / `ticket` / `author` / `chronological` / `milestone` | How commits are grouped; `milestone` groups by version |
| `excludeTypes` | array | Conventional types to skip |
| `excludePaths` | array | Paths/dirs/globs excluded from file stats |
| `ticketPattern` | regex string | Extract issue numbers from commit messages |
| `ticketUrlTemplate` | string | Render issue numbers as links, e.g. `https://github.com/Q-527/foo/issues/{ticket}` |
| `milestonePattern` | regex string | Version pattern for milestone grouping, default `v\d+\.\d+\.\d+` |
| `notify` | `{ feishu, dingtalk, slack }` | Webhook URLs (or env vars `FEISHU_WEBHOOK` etc.) |
| `emoji` | boolean | Add emoji to group headers |
| `detail` | `rich` / `normal` | Report depth; `rich` (default) includes the tables |
| `members` | `{ git name: display name }` | Author name mapping |
| `output.enabled` | boolean | Auto-write report to a file |
| `output.dir` | path | Where reports go |
| `repos` | array | Repos to scan for the dashboard |
| `autoReminder` | boolean | Friday nudge on/off |

**Turn off the Friday nudge**: set `autoReminder` to `false`, or delete the config file (it's on by default).

## GitHub Action weekly report

The repo ships `.github/workflows/weekly-report.yml`: every Friday 09:00 UTC (≈17:00 Beijing/Shanghai) it opens a weekly-report issue. To enable:

1. Drop the same workflow file into your own project repo (or fork this repo's `.github/`).
2. Add `ANTHROPIC_API_KEY` under your repo's **Settings → Secrets → Actions** (get one from Anthropic).
3. The workflow already requests `issues: write` and `contents: read`; nothing else to configure.

You can also hit **Run workflow** on the Actions page to try it now. Edit the cron expression to change the time ([crontab.guru](https://crontab.guru) helps).

## Notes

- Reports are built only from real git data. No commits in the range? It says so honestly — nothing fabricated.
- The writing is done by a built-in subagent, `git-report:report-writer`, so the main model stays light and output stays consistent.

## Safety

git-report is **read-only + explicit-confirmation**. Details in `SAFETY.md`:

- Never auto `git push`, never force-pushes or creates branches, never `git reset --hard`, never drops uncommitted work.
- `commit` uses only staged content and respects pre-commit hooks; `pr` only drafts text, never creates the PR for you.
- `audit` / `secret-scan` are local read-only; on finding a suspected secret it reports only `file:line:type` — never the secret's value.
- `notify` is the only network action: it sends one POST to a webhook **you** configured, only after you confirm that run; the webhook URL is never written to a file or memory.
- All other report/analysis skills stay offline — no MCP, no upload of your code or reports.

## License

MIT

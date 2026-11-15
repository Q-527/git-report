#!/usr/bin/env node
// git-report 周五提醒钩子（opt-in）。
// 仅当：今天周五 + 当前目录是 git 仓库 + 未显式关闭 autoReminder 时，打印一条温和提醒。
// 任何异常都静默退出，绝不影响 Claude Code 启动。
import { existsSync, readFileSync } from "node:fs";

try {
  const d = new Date();
  if (d.getDay() !== 5) process.exit(0); // 仅周五
  if (!existsSync(".git")) process.exit(0); // 仅 git 仓库内

  let cfg = {};
  try {
    cfg = JSON.parse(readFileSync(".git-report.json", "utf8"));
  } catch {
    // 无配置文件则用默认（默认开启提醒）
  }
  if (cfg.autoReminder === false) process.exit(0); // 用户已关闭

  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const today = `${y}-${m}-${day}`;

  console.log(
    `\n[git-report] 今天是周五（${today}），要不要顺手生成本周工作周报？直接说「写个本周周报」即可。\n`
  );
} catch {
  process.exit(0);
}

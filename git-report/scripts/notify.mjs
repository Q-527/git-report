#!/usr/bin/env node
// notify.mjs — 把报告文本推送到飞书 / 钉钉 / Slack webhook。
// 仅做一件事：POST 到用户明确配置的 webhook；不读取、不存储任何代码或报告之外的内容。
import { readFileSync } from "node:fs";
import { resolve, join } from "node:path";

const args = process.argv.slice(2);
const get = (n, d = "") => {
  const i = args.indexOf("--" + n);
  return i >= 0 ? args[i + 1] : d;
};

const target = (get("target") || "").toLowerCase();
if (!["feishu", "dingtalk", "slack"].includes(target)) {
  console.error("用法: node notify.mjs --target feishu|dingtalk|slack --text \"...\" | --file report.md [--webhook URL]");
  process.exit(2);
}

const envName = target.toUpperCase() + "_WEBHOOK";

// webhook 解析优先级：--webhook > 环境变量 > .git-report.json 的 notify.<target>
let webhook = get("webhook", "");
if (!webhook) webhook = process.env[envName] || "";
if (!webhook && get("file")) {
  try {
    const cfg = JSON.parse(readFileSync(join(resolve(get("file")), "..", ".git-report.json"), "utf8"));
    webhook = (cfg.notify && cfg.notify[target]) || "";
  } catch {
    /* 无配置则忽略 */
  }
}
if (!webhook) {
  console.error(`缺少 webhook：请通过 --webhook、环境变量 ${envName}，或在 .git-report.json 的 notify.${target} 提供`);
  process.exit(2);
}

let text = get("text", "");
if (!text && get("file")) {
  try {
    text = readFileSync(resolve(get("file")), "utf8");
  } catch (e) {
    console.error("读取报告文件失败:", e.message);
    process.exit(2);
  }
}
if (!text.trim()) {
  console.error("缺少推送内容：请用 --text 或 --file 提供");
  process.exit(2);
}

const payload =
  target === "slack"
    ? JSON.stringify({ text })
    : target === "dingtalk"
    ? JSON.stringify({ msgtype: "text", text: { content: text } })
    : JSON.stringify({ msg_type: "text", content: { text } }); // feishu

(async () => {
  try {
    const r = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
    });
    const body = await r.text();
    console.log(JSON.stringify({ ok: r.ok, status: r.status, response: body.slice(0, 200) }));
    process.exit(r.ok ? 0 : 1);
  } catch (e) {
    console.error("推送失败:", e.message);
    process.exit(1);
  }
})();

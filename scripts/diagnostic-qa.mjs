// Diagnostic ("Comment choisir votre agent IA ?") QA: plays scenarios and captures each step (desktop).
// Usage: node scripts/diagnostic-qa.mjs [--tag X]
import { mkdirSync } from "node:fs";
import path from "node:path";
import { chromium } from "@playwright/test";

const root = path.resolve(import.meta.dirname, "..");
const args = process.argv.slice(2);
const tag = args.includes("--tag") ? args[args.indexOf("--tag") + 1] : "current";
const out = path.join(root, "design/captures/diagnostic-qa", tag);
mkdirSync(out, { recursive: true });

const SCENARIOS = {
  ready: { task: "content", time: "mid", tools: ["social", "mail"], process: "standard" },
  adapted: { task: "support", time: "high", tools: ["chat", "crm", "software"], process: "specific" },
  custom: { task: "other", time: "high", tools: ["software", "sheet"], process: "unique" },
};

const browser = await chromium.launch({ args: ["--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist"] });
const page = await (await browser.newContext({ viewport: { width: 1672, height: 861 } })).newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => m.type() === "error" && errors.push(m.text().slice(0, 200)));
await page.goto("http://localhost:3217/?capture=1", { waitUntil: "load" });
await page.waitForFunction(() => window.__d2s?.store?.getState().ready === true, null, { timeout: 90000 });
await new Promise((r) => setTimeout(r, 1500));
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const toPanel = async () => {
  await page.evaluate(() => {
    const p = document.querySelector("#comment-choisir [data-phase]");
    window.scrollTo(0, p.getBoundingClientRect().top + window.scrollY - 150);
  });
  await wait(2400);
};
const pick = async (value) => {
  await page.locator(`#comment-choisir input[value="${value}"]`).click();
  await wait(250);
};
const next = async () => {
  await page.locator("#comment-choisir button[type=submit]").click();
  await wait(900);
};

// The section as it arrives after the team.
await page.evaluate(() => {
  const el = document.getElementById("comment-choisir");
  window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 260);
});
await wait(2400);
await page.screenshot({ path: path.join(out, "section.png") });
await toPanel();
await page.screenshot({ path: path.join(out, "0-start.png") });
let first = true;
for (const [name, s] of Object.entries(SCENARIOS)) {
  if (!first) {
    await page.getByRole("button", { name: "Refaire le diagnostic" }).click();
    await wait(900);
  }
  await pick(s.task);
  await wait(800);
  if (first) await page.screenshot({ path: path.join(out, "1-task.png") });
  await pick(s.time);
  await wait(800);
  for (const t of s.tools) await pick(t);
  await wait(700);
  if (first) await page.screenshot({ path: path.join(out, "3-tools.png") });
  await next();
  await pick(s.process);
  await wait(1800);
  await page.screenshot({ path: path.join(out, `result-${name}.png`) });
  first = false;
}
await browser.close();
console.log(errors.length ? errors : "no errors", "→", path.relative(root, out));

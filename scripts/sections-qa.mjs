// Captures the sections below the reception (services, method, agents) at a given viewport.
// Usage: node scripts/sections-qa.mjs [--tag X] [--width 1672 --height 861] [--mobile]
import { mkdirSync } from "node:fs";
import path from "node:path";
import { chromium } from "@playwright/test";
import sharp from "sharp";

const root = path.resolve(import.meta.dirname, "..");
const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : fallback;
};
const tag = opt("tag", "current");
const mobile = args.includes("--mobile");
const W = Number(opt("width", mobile ? "390" : "1672"));
const H = Number(opt("height", mobile ? "844" : "861"));
const out = path.join(root, "design/captures/sections-qa", tag);
mkdirSync(out, { recursive: true });

const browser = await chromium.launch({ args: ["--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist"] });
const context = await browser.newContext({ viewport: { width: W, height: H }, ...(mobile ? { isMobile: true, hasTouch: true, deviceScaleFactor: 2 } : {}) });
const page = await context.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.goto("http://localhost:3217/?capture=1#nos-services", { waitUntil: "load" });
await page.waitForFunction(() => window.__d2s?.store?.getState().ready === true, null, { timeout: 90000 });
await page.waitForFunction(() => Math.abs(document.getElementById("nos-services").getBoundingClientRect().top) < 2, null, { timeout: 30000 });

const shots = [];
const at = async (name, selector, offset = 0, wait = 3200) => {
  await page.evaluate(([sel, off]) => {
    const el = document.querySelector(sel);
    window.scrollTo(0, window.scrollY + el.getBoundingClientRect().top + off);
  }, [selector, offset]);
  await new Promise((r) => setTimeout(r, wait));
  const file = path.join(out, `${name}.png`);
  await page.screenshot({ path: file });
  shots.push(file);
};
await at("1-services", "#nos-services", 0, 4200);
await at("2-method", "#nos-services [class*='methodWrap']", mobile ? -80 : -110, 3500);
await at("3-agents", "#nos-agents-ia", 0, 2500);
await browser.close();
if (errors.length) console.log("page errors:", errors.join(" | "));
console.log(`→ ${path.relative(root, out)}/ (${shots.length} shots)`);

// "Notre méthode" scroll-driven QA (desktop): captures the pinned block at several scroll positions.
// Usage: node scripts/method-qa.mjs [--tag X]
import { mkdirSync } from "node:fs";
import path from "node:path";
import { chromium } from "@playwright/test";
import sharp from "sharp";

const root = path.resolve(import.meta.dirname, "..");
const args = process.argv.slice(2);
const tag = args.includes("--tag") ? args[args.indexOf("--tag") + 1] : "current";
const out = path.join(root, "design/captures/method-qa", tag);
mkdirSync(out, { recursive: true });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await chromium.launch({ args: ["--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist"] });
const page = await (await browser.newContext({ viewport: { width: 1672, height: 861 } })).newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.goto("http://localhost:3217/?capture=1", { waitUntil: "load" });
await page.waitForFunction(() => window.__d2s?.store?.getState().ready === true, null, { timeout: 90000 });
await wait(1500);
const geo = await page.evaluate(() => {
  const method = [...document.querySelectorAll("[data-mode]")].find((e) => e.className.includes("scroller"));
  const r = method.getBoundingClientRect();
  return { top: r.top + window.scrollY, height: r.height, vh: window.innerHeight };
});
console.log("scroller", geo);
const stops = [-0.15, 0, 0.12, 0.2, 0.3, 0.45, 0.55, 0.7, 0.8, 1, 1.12];
const tiles = [];
for (const k of stops) {
  const extra = geo.height - 560;
  await page.evaluate((y) => window.scrollTo(0, y), Math.round(geo.top - 96 + extra * k));
  await wait(900);
  const info = await page.evaluate(() => {
    const m = document.querySelector("[data-mode='scroll'][data-started]");
    const cs = m && getComputedStyle(m);
    return { fill: cs?.getPropertyValue("--fill"), active: document.querySelector("[role=tab][aria-selected=true]")?.textContent?.slice(2, 30), top: m && Math.round(m.getBoundingClientRect().top) };
  });
  console.log(k.toFixed(2), JSON.stringify(info));
  tiles.push(await sharp(await page.screenshot()).resize(557, 287).toBuffer());
}
await sharp({ create: { width: 557 * 4 + 18, height: 287 * 3 + 12, channels: 3, background: "#222" } })
  .composite(tiles.map((input, i) => ({ input, left: (i % 4) * 563, top: Math.floor(i / 4) * 293 })))
  .png()
  .toFile(path.join(out, "sheet.png"));
await browser.close();
console.log(errors.length ? errors : "no errors", "→", path.relative(root, out));

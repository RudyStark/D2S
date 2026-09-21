// Lobby → Services transition QA: captures at several arrival values k of the services section (desktop).
// Usage: node scripts/transition-qa.mjs [--tag X] [--k 0,0.2,0.4,0.6,0.8,1]
import { mkdirSync } from "node:fs";
import path from "node:path";
import { chromium } from "@playwright/test";
import sharp from "sharp";

const root = path.resolve(import.meta.dirname, "..");
const args = process.argv.slice(2);
const opt = (name, def) => (args.includes(name) ? args[args.indexOf(name) + 1] : def);
const tag = opt("--tag", "current");
const ks = opt("--k", "0,0.2,0.4,0.6,0.8,1").split(",").map(Number);
/** Wait after each scroll (ms): short values catch the arrival animations mid-way. */
const delay = Number(opt("--delay", "3200"));
const out = path.join(root, "design/captures/transition-qa", tag);
mkdirSync(out, { recursive: true });

const browser = await chromium.launch({ args: ["--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist"] });
const page = await (await browser.newContext({ viewport: { width: 1672, height: 861 } })).newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => m.type() === "error" && errors.push(m.text().slice(0, 200)));
await page.goto("http://localhost:3217/?capture=1", { waitUntil: "load" });
await page.waitForFunction(() => window.__d2s?.store?.getState().ready === true, null, { timeout: 90000 });
await new Promise((r) => setTimeout(r, 2000));
const files = [];
for (const k of ks) {
  await page.evaluate((k) => {
    const el = document.getElementById("nos-services");
    const top = el.getBoundingClientRect().top + window.scrollY;
    window.scrollTo(0, top - (1 - k) * window.innerHeight);
  }, k);
  await new Promise((r) => setTimeout(r, delay));
  const f = path.join(out, `k${String(Math.round(k * 100)).padStart(3, "0")}.png`);
  await page.screenshot({ path: f });
  files.push(f);
}
await browser.close();
// Contact sheet, 3 per row at 1/3 scale.
const w = 557, h = 287, cols = 3, rows = Math.ceil(files.length / cols);
const tiles = await Promise.all(files.map((f) => sharp(f).resize(w, h).toBuffer()));
await sharp({ create: { width: cols * w + (cols - 1) * 6, height: rows * h + (rows - 1) * 6, channels: 3, background: "#222" } })
  .composite(tiles.map((input, i) => ({ input, left: (i % cols) * (w + 6), top: Math.floor(i / cols) * (h + 6) })))
  .png()
  .toFile(path.join(out, "sheet.png"));
console.log(errors.length ? errors : "no errors", "→", path.relative(root, out));

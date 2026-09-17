// Scroll-accurate captures of the sequence + side-by-side sheets against the references.
// Usage: npm run shots [-- --base http://localhost:3217 --mobile --forced]
import { mkdirSync } from "node:fs";
import path from "node:path";
import { chromium, devices } from "@playwright/test";
import sharp from "sharp";

const root = path.resolve(import.meta.dirname, "..");
const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : fallback;
};

const BASE = opt("base", "http://localhost:3217");
const OUT = path.join(root, opt("out", "design/captures"));
const MOBILE = flag("mobile");
const FORCED = flag("forced");
const STOPS = (opt("stops", "0,0.25,0.45,0.65,1")).split(",").map(Number);
const REF_CHROME = 80; // browser chrome baked into the reference screenshots

// Reference screenshots are 1672×941 including 80px of browser UI → 1672×861 viewport.
const context = MOBILE
  ? { ...devices["iPhone 13"], deviceScaleFactor: 2 }
  : { viewport: { width: 1672, height: 861 }, deviceScaleFactor: 1 };

mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({
  headless: true,
  args: ["--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist", "--enable-unsafe-webgpu"],
});
const page = await (await browser.newContext(context)).newPage();
page.on("console", (m) => {
  if (m.type() === "error") console.log("[console]", m.text());
});

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitSettled() {
  await page.waitForFunction(() => window.__d2s?.frame?.settled === true, null, { timeout: 30000 });
  await wait(1400); // camera inertia + overlay fades
}

const suffix = MOBILE ? "-mobile" : "";
const files = [];

if (FORCED) {
  for (const p of STOPS) {
    await page.goto(`${BASE}/?capture=1&p=${p}`, { waitUntil: "load" });
    await page.waitForFunction(() => window.__d2s?.store?.getState().ready === true, null, { timeout: 60000 });
    await wait(2500);
    const file = path.join(OUT, `forced-${String(Math.round(p * 100)).padStart(3, "0")}${suffix}.png`);
    await page.screenshot({ path: file });
    files.push({ p, file });
    console.log("captured", path.relative(root, file));
  }
} else {
  await page.goto(`${BASE}/?capture=1`, { waitUntil: "load" });
  await page.waitForFunction(() => window.__d2s?.store?.getState().ready === true, null, { timeout: 60000 });
  await wait(2500);
  for (const p of STOPS) {
    await page.evaluate((target) => {
      const track = document.getElementById("sequence-track");
      const max = track.offsetTop + track.offsetHeight - window.innerHeight;
      window.scrollTo(0, Math.round(max * target));
    }, p);
    await waitSettled();
    const fps = await page.evaluate(() => window.__d2s.frame.fps);
    const file = path.join(OUT, `scroll-${String(Math.round(p * 100)).padStart(3, "0")}${suffix}.png`);
    await page.screenshot({ path: file });
    files.push({ p, file });
    console.log("captured", path.relative(root, file), `(${fps} fps headless)`);
  }
}

await browser.close();

// Side-by-side sheets for the two composed references.
if (!MOBILE) {
  const refs = { 0: "01-home-final.png", 1: "03-lobby-final.png" };
  for (const { p, file } of files) {
    const ref = refs[p];
    if (!ref) continue;
    const refBuf = await sharp(path.join(root, "design/references", ref))
      .extract({ left: 0, top: REF_CHROME, width: 1672, height: 861 })
      .toBuffer();
    const sheet = path.join(OUT, `compare-${String(Math.round(p * 100)).padStart(3, "0")}.png`);
    const joined = await sharp({ create: { width: 1672 * 2 + 16, height: 861, channels: 3, background: "#ffffff" } })
      .composite([
        { input: refBuf, left: 0, top: 0 },
        { input: file, left: 1672 + 16, top: 0 },
      ])
      .png()
      .toBuffer();
    await sharp(joined).resize(1672, null).png().toFile(sheet);
    console.log("sheet", path.relative(root, sheet));
  }
}

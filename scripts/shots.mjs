// Scroll-accurate captures + reference QA sheets.
// Usage: npm run shots [-- --base http://localhost:3217 --mobile --forced --stops 0,0.25,0.45,0.65,1]
// For p=0 and p=1 (desktop) writes design/captures/qa-XXX/{reference,capture,side-by-side,overlay-50,diff}.png
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
const STOPS = opt("stops", "0,0.25,0.45,0.65,1").split(",").map(Number);
const REF_CHROME = 80; // browser UI baked into the reference screenshots
const W = 1672;
const H = 861;
const REFS = { 0: "01-home-final.png", 1: "03-lobby-final.png" };

const context = MOBILE
  ? { ...devices["iPhone 13"], deviceScaleFactor: 2 }
  : { viewport: { width: W, height: H }, deviceScaleFactor: 1 };

mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({
  headless: true,
  args: ["--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist"],
});
const page = await (await browser.newContext(context)).newPage();
page.on("console", (m) => {
  if (m.type() === "error") console.log("[console]", m.text());
});

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const tag = (p) => String(Math.round(p * 100)).padStart(3, "0");
const suffix = MOBILE ? "-mobile" : "";
const files = [];

async function ready() {
  await page.waitForFunction(() => window.__d2s?.store?.getState().ready === true, null, { timeout: 90000 });
  await page.evaluate(() => document.fonts.ready);
  await wait(2500);
}

if (FORCED) {
  for (const p of STOPS) {
    await page.goto(`${BASE}/?capture=1&p=${p}`, { waitUntil: "load" });
    await ready();
    const file = path.join(OUT, `forced-${tag(p)}${suffix}.png`);
    await page.screenshot({ path: file });
    files.push({ p, file });
    console.log("captured", path.relative(root, file));
  }
} else {
  await page.goto(`${BASE}/?capture=1`, { waitUntil: "load" });
  await ready();
  for (const p of STOPS) {
    await page.evaluate((target) => {
      const track = document.getElementById("sequence-track");
      const max = track.offsetTop + track.offsetHeight - window.innerHeight;
      window.scrollTo(0, Math.round(max * target));
    }, p);
    await page.waitForFunction(() => window.__d2s?.frame?.settled === true, null, { timeout: 30000 });
    await wait(1600); // camera inertia + overlay fades
    const fps = await page.evaluate(() => window.__d2s.frame.fps);
    const file = path.join(OUT, `scroll-${tag(p)}${suffix}.png`);
    await page.screenshot({ path: file });
    files.push({ p, file });
    console.log("captured", path.relative(root, file), `(${fps} fps headless)`);
  }
}

await browser.close();

if (!MOBILE) {
  for (const { p, file } of files) {
    const refName = REFS[p];
    if (!refName) continue;
    const dir = path.join(OUT, `qa-${tag(p)}`);
    mkdirSync(dir, { recursive: true });

    const ref = sharp(path.join(root, "design/references", refName)).removeAlpha().extract({ left: 0, top: REF_CHROME, width: W, height: H });
    const refPng = await ref.clone().png().toBuffer();
    const capPng = await sharp(file).removeAlpha().resize(W, H).png().toBuffer();
    await sharp(refPng).toFile(path.join(dir, "reference.png"));
    await sharp(capPng).toFile(path.join(dir, "capture.png"));

    // Side by side (half size)
    const joined = await sharp({ create: { width: W * 2 + 16, height: H, channels: 3, background: "#ffffff" } })
      .composite([
        { input: refPng, left: 0, top: 0 },
        { input: capPng, left: W + 16, top: 0 },
      ])
      .png()
      .toBuffer();
    await sharp(joined).resize(W, null).png().toFile(path.join(dir, "side-by-side.png"));

    // 50/50 blend
    const refRaw = await sharp(refPng).raw().toBuffer();
    const capRaw = await sharp(capPng).raw().toBuffer();
    const blend = Buffer.alloc(refRaw.length);
    const diff = Buffer.alloc(refRaw.length);
    let total = 0;
    for (let i = 0; i < refRaw.length; i += 3) {
      let d = 0;
      for (let c = 0; c < 3; c++) {
        blend[i + c] = (refRaw[i + c] + capRaw[i + c]) >> 1;
        d += Math.abs(refRaw[i + c] - capRaw[i + c]);
      }
      d /= 3;
      total += d;
      // Heatmap: black = identical, yellow → red = large difference
      const k = Math.min(1, d / 96);
      diff[i] = Math.round(255 * Math.min(1, k * 2));
      diff[i + 1] = Math.round(255 * Math.max(0, 1 - Math.abs(k - 0.5) * 2) * 0.9);
      diff[i + 2] = Math.round(40 * (1 - k));
    }
    await sharp(blend, { raw: { width: W, height: H, channels: 3 } }).png().toFile(path.join(dir, "overlay-50.png"));
    await sharp(diff, { raw: { width: W, height: H, channels: 3 } }).png().toFile(path.join(dir, "diff.png"));
    const mean = total / (W * H);
    console.log(`qa ${tag(p)}: mean abs diff ${mean.toFixed(1)} → ${path.relative(root, dir)}/`);
  }
}

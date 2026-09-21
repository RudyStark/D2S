// Façade visual QA at p=0 against design/references/01-home-final.png.
// Usage: node scripts/facade-qa.mjs [--tag passA] [--debug] [--p 0]
// Writes design/captures/facade-qa/<tag>/:
//   facade-reference.png, facade-current.png, facade-side-by-side.png, facade-overlay-50.png, facade-diff.png
//   crop-{sign,doors,water,pool-rim,floor,left-agent,right-agent,glass}.png (reference | current)
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
const p = Number(opt("p", "0"));
const debug = args.includes("--debug");
const W = 1672;
const H = 861;
const REF_CHROME = 80;
const out = path.join(root, "design/captures/facade-qa", debug ? `${tag}-debug` : tag);
mkdirSync(out, { recursive: true });

// Page-px regions (1672×861), identical for reference and capture.
const CROPS = {
  sign: { left: 760, top: 60, width: 560, height: 240 },
  doors: { left: 740, top: 240, width: 620, height: 470 },
  water: { left: 0, top: 680, width: 520, height: 181 },
  "pool-rim": { left: 240, top: 640, width: 440, height: 221 },
  floor: { left: 480, top: 690, width: 900, height: 171 },
  "left-agent": { left: 470, top: 330, width: 400, height: 460 },
  "right-agent": { left: 1250, top: 290, width: 422, height: 490 },
  glass: { left: 560, top: 90, width: 280, height: 500 },
};

const browser = await chromium.launch({ args: ["--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist"] });
const page = await (await browser.newContext({ viewport: { width: W, height: H } })).newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.goto(`http://localhost:3217/?capture=1&p=${p}${debug ? "&debugMaterials=1" : ""}`, { waitUntil: "load" });
await page.waitForFunction(() => window.__d2s?.store?.getState().ready === true, null, { timeout: 90000 });
await new Promise((r) => setTimeout(r, 3500));
const capFile = path.join(out, "facade-current.png");
await page.screenshot({ path: capFile });
await browser.close();

const refPng = await sharp(path.join(root, "design/references/01-home-final.png")).removeAlpha().extract({ left: 0, top: REF_CHROME, width: W, height: H }).png().toBuffer();
const capPng = await sharp(capFile).removeAlpha().png().toBuffer();
await sharp(refPng).toFile(path.join(out, "facade-reference.png"));

await sharp({ create: { width: W * 2 + 16, height: H, channels: 3, background: "#ffffff" } })
  .composite([{ input: refPng, left: 0, top: 0 }, { input: capPng, left: W + 16, top: 0 }])
  .png()
  .toFile(path.join(out, "facade-side-by-side.png"));

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
  const k = Math.min(1, d / 96);
  diff[i] = Math.round(255 * Math.min(1, k * 2));
  diff[i + 1] = Math.round(255 * Math.max(0, 1 - Math.abs(k - 0.5) * 2) * 0.9);
  diff[i + 2] = Math.round(40 * (1 - k));
}
await sharp(blend, { raw: { width: W, height: H, channels: 3 } }).png().toFile(path.join(out, "facade-overlay-50.png"));
await sharp(diff, { raw: { width: W, height: H, channels: 3 } }).png().toFile(path.join(out, "facade-diff.png"));

for (const [name, r] of Object.entries(CROPS)) {
  const scale = Math.min(2, 760 / r.width);
  const w = Math.round(r.width * scale);
  const h = Math.round(r.height * scale);
  const a = await sharp(refPng).extract(r).resize(w, h).png().toBuffer();
  const b = await sharp(capPng).extract(r).resize(w, h).png().toBuffer();
  await sharp({ create: { width: w * 2 + 10, height: h, channels: 3, background: "#ffffff" } })
    .composite([{ input: a, left: 0, top: 0 }, { input: b, left: w + 10, top: 0 }])
    .png()
    .toFile(path.join(out, `crop-${name}.png`));
}

// Clipping: share of near-white pixels (≥ 250 on all channels) in the 3D-heavy crops.
const clip = [];
for (const name of ["sign", "doors", "floor", "water"]) {
  const { data } = await sharp(capPng).extract(CROPS[name]).raw().toBuffer({ resolveWithObject: true });
  let n = 0;
  for (let i = 0; i < data.length; i += 3) if (data[i] >= 250 && data[i + 1] >= 250 && data[i + 2] >= 250) n++;
  clip.push(`${name} ${((n / (data.length / 3)) * 100).toFixed(1)}%`);
}
console.log(`[${tag}] mean abs diff ${(total / (W * H)).toFixed(1)} · clipped ≥250: ${clip.join(" · ")}`);
if (errors.length) console.log("page errors:", errors.join(" | "));
console.log(`→ ${path.relative(root, out)}/`);

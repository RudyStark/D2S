// Lobby material QA: capture p=1 (optionally ?debugMaterials=1) and compare detail crops A–F
// with design/references/03-lobby-final.png. Usage: node scripts/lobby-crops.mjs [--tag pass1] [--debug]
import { mkdirSync } from "node:fs";
import path from "node:path";
import { chromium } from "@playwright/test";
import sharp from "sharp";

const root = path.resolve(import.meta.dirname, "..");
const args = process.argv.slice(2);
const tagIdx = args.indexOf("--tag");
const tag = tagIdx >= 0 ? args[tagIdx + 1] : "current";
const debug = args.includes("--debug");
const out = path.join(root, "design/captures/lobby-qa", tag);
mkdirSync(out, { recursive: true });

// Page-px regions (1672×861), identical for reference and capture.
const REGIONS = {
  A_drum_logo: { left: 540, top: 90, width: 600, height: 330 },
  B_desk: { left: 470, top: 440, width: 700, height: 320 },
  C_floor: { left: 250, top: 690, width: 1170, height: 171 },
  D_pot_left: { left: 280, top: 470, width: 280, height: 300 },
  E_pot_right: { left: 1120, top: 470, width: 280, height: 300 },
  F_glazing: { left: 0, top: 90, width: 300, height: 520 },
};

const browser = await chromium.launch({ args: ["--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist"] });
const page = await (await browser.newContext({ viewport: { width: 1672, height: 861 } })).newPage();
await page.goto(`http://localhost:3217/?capture=1&p=1${debug ? "&debugMaterials=1" : ""}`, { waitUntil: "load" });
await page.waitForFunction(() => window.__d2s?.store?.getState().ready === true, null, { timeout: 90000 });
await new Promise((r) => setTimeout(r, 3500));
const capFile = path.join(out, debug ? "capture-materials.png" : "capture.png");
await page.screenshot({ path: capFile });
await browser.close();

const ref = await sharp(path.join(root, "design/references/03-lobby-final.png")).removeAlpha().extract({ left: 0, top: 80, width: 1672, height: 861 }).png().toBuffer();
const tiles = [];
let y = 0;
const labelH = 26;
for (const [name, r] of Object.entries(REGIONS)) {
  const scale = Math.min(2, 780 / r.width);
  const w = Math.round(r.width * scale);
  const h = Math.round(r.height * scale);
  const a = await sharp(ref).extract(r).resize(w, h).png().toBuffer();
  const b = await sharp(capFile).extract(r).resize(w, h).png().toBuffer();
  await sharp(b).toFile(path.join(out, `${name}.png`));
  const label = Buffer.from(`<svg width="${w * 2 + 12}" height="${labelH}"><text x="4" y="18" font-family="Helvetica" font-size="15" font-weight="700" fill="#0b1238">${name} — référence | rendu (${tag}${debug ? ", matériaux seuls" : ""})</text></svg>`);
  tiles.push({ input: label, left: 0, top: y }, { input: a, left: 0, top: y + labelH }, { input: b, left: w + 12, top: y + labelH });
  y += labelH + h + 14;
}
await sharp({ create: { width: 780 * 2 + 12, height: y, channels: 3, background: "#ffffff" } }).composite(tiles).png().toFile(path.join(out, "sheet.png"));

// Clipping report: share of pixels at (near) pure white in the capture, per region.
const { data, info } = await sharp(capFile).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const clip = (r) => {
  let n = 0, c = 0;
  for (let yy = r.top; yy < r.top + r.height; yy++) for (let xx = r.left; xx < r.left + r.width; xx++) {
    const i = (yy * info.width + xx) * 3;
    n++;
    if (data[i] >= 250 && data[i + 1] >= 250 && data[i + 2] >= 250) c++;
  }
  return ((100 * c) / n).toFixed(1) + "%";
};
console.log(`[${tag}] clipped ≥250:`, Object.entries(REGIONS).map(([k, r]) => `${k} ${clip(r)}`).join(" · "), "· full", clip({ left: 0, top: 0, width: 1672, height: 861 }));
console.log("sheet:", path.relative(root, path.join(out, "sheet.png")));

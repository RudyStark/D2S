// Bakes the procedural textures (components/experience/textures.ts → BAKED_TEXTURES) to WebP files.
// Painting them at runtime blocked the page for ~2.8 s during loading and looked different in Safari.
// Needs the dev server (capture mode exposes the painter): node scripts/bake-textures.mjs [--base http://localhost:3217]
import { mkdirSync, statSync } from "node:fs";
import path from "node:path";
import { chromium } from "@playwright/test";
import sharp from "sharp";

const root = path.resolve(import.meta.dirname, "..");
const args = process.argv.slice(2);
const baseIdx = args.indexOf("--base");
const BASE = baseIdx >= 0 ? args[baseIdx + 1] : "http://localhost:3217";
const out = path.join(root, "public/textures/baked");
mkdirSync(out, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(`${BASE}/?capture=1`, { waitUntil: "load" });
await page.waitForFunction(() => typeof window.__d2s?.bakeTextures === "function", null, { timeout: 90000 });
const baked = await page.evaluate(() => window.__d2s.bakeTextures());
await browser.close();

for (const [name, dataUrl] of Object.entries(baked)) {
  const png = Buffer.from(dataUrl.split(",")[1], "base64");
  const file = path.join(out, `${name}.webp`);
  // Roughness is data: near-lossless. Colour maps: high quality, the veins are hair-thin.
  const quality = /rough/i.test(name) ? 95 : 92;
  await sharp(png).webp({ quality, effort: 6, smartSubsample: true }).toFile(file);
  const meta = await sharp(file).metadata();
  console.log(`${name}: ${meta.width}×${meta.height} · ${(statSync(file).size / 1024).toFixed(0)} KB`);
}

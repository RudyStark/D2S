// Agent poster → transparent, trimmed WebP billboard + metadata.
// Source posters live in design/agents-source/<type>.png (not shipped).
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const root = path.resolve(import.meta.dirname, "..");
const srcDir = path.join(root, "design/agents-source");
const outDir = path.join(root, "public/images/agents");
const cacheDir = path.join(root, ".cache");
const cutoutBin = path.join(cacheDir, "cutout");
const TYPES = ["automation", "support", "prospection", "content", "data"];
const MAX_HEIGHT = 1280;

mkdirSync(cacheDir, { recursive: true });
mkdirSync(outDir, { recursive: true });

if (!existsSync(cutoutBin)) {
  execFileSync("swiftc", ["-O", path.join(root, "scripts/cutout.swift"), "-o", cutoutBin], { stdio: "inherit" });
}

const meta = {};

for (const type of TYPES) {
  const src = path.join(srcDir, `${type}.png`);
  const cut = path.join(cacheDir, `${type}-cut.png`);
  execFileSync(cutoutBin, [src, cut], { stdio: "inherit" });

  // Trim to the alpha bounding box, keep a small margin so soft edges survive.
  const { data, info } = await sharp(cut).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let minX = info.width, minY = info.height, maxX = 0, maxY = 0;
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      if (data[(y * info.width + x) * 4 + 3] > 12) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  const pad = 6;
  const left = Math.max(0, minX - pad);
  const top = Math.max(0, minY - pad);
  const width = Math.min(info.width, maxX + pad + 1) - left;
  const height = Math.min(info.height, maxY + 2) - top; // feet sit on the bottom edge

  const pipeline = sharp(cut).extract({ left, top, width, height });
  const scale = Math.min(1, MAX_HEIGHT / height);
  const outW = Math.round(width * scale);
  const outH = Math.round(height * scale);

  await pipeline
    .clone()
    .resize(outW, outH)
    .webp({ quality: 88, alphaQuality: 95, effort: 6 })
    .toFile(path.join(outDir, `${type}.webp`));

  // Small face crop for the "team" pill avatars (head ≈ top 30% of the figure).
  const headSize = Math.round(width * 0.62);
  await sharp(cut)
    .extract({
      left: Math.max(0, Math.round(left + width / 2 - headSize / 2)),
      top: Math.max(0, top - 4),
      width: Math.min(headSize, info.width),
      height: Math.min(headSize, info.height - top),
    })
    .resize(96, 96, { fit: "cover", position: "top" })
    .webp({ quality: 86 })
    .toFile(path.join(outDir, `${type}-avatar.webp`));

  meta[type] = { width: outW, height: outH, aspect: +(outW / outH).toFixed(4) };
  console.log(`${type}: ${outW}×${outH}`);
}

writeFileSync(path.join(root, "lib/generated/agent-images.json"), JSON.stringify(meta, null, 2) + "\n");

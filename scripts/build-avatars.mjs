// Team-pill avatars: head-and-shoulders portraits cut from the existing agent cut-outs
// (public/images/agents/<type>.webp — never regenerated here), on a pale disc, as in 01-home-final.
// Usage: node scripts/build-avatars.mjs
import path from "node:path";
import sharp from "sharp";

const root = path.resolve(import.meta.dirname, "..");
const dir = path.join(root, "public/images/agents");
const TYPES = ["automation", "support", "prospection", "content", "data"];
const SIZE = 128;
/** Portrait height as a share of the figure height (head + shoulders). */
const BUST = 0.41;

for (const type of TYPES) {
  const src = path.join(dir, `${type}.webp`);
  const { data, info } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  const alpha = (x, y) => data[(y * w + x) * 4 + 3];

  // Figure bounds.
  let top = h;
  let bottom = 0;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++)
      if (alpha(x, y) > 40) {
        top = Math.min(top, y);
        bottom = Math.max(bottom, y);
        break;
      }
  const figureH = bottom - top;

  // Head centre: mean x of the opaque pixels in the top 16 % of the figure.
  let sx = 0;
  let n = 0;
  for (let y = top; y < top + figureH * 0.16; y++)
    for (let x = 0; x < w; x++)
      if (alpha(x, y) > 40) {
        sx += x;
        n++;
      }
  const cx = n ? sx / n : w / 2;

  const side = Math.round(figureH * BUST);
  const left = Math.round(cx - side / 2);
  const cropTop = Math.round(top - side * 0.04);
  // Pad so the crop can extend past the image edges.
  const pad = side;
  // sharp runs extract before extend inside one pipeline: materialise the padded image first.
  const extended = await sharp(src)
    .extend({ top: pad, bottom: pad, left: pad, right: pad, background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  const padded = await sharp(extended)
    .extract({ left: left + pad, top: cropTop + pad, width: side, height: side })
    .resize(SIZE, SIZE)
    .toBuffer();

  const disc = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}"><circle cx="${SIZE / 2}" cy="${SIZE / 2}" r="${SIZE / 2}" fill="#e9eef6"/></svg>`,
  );
  const mask = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}"><circle cx="${SIZE / 2}" cy="${SIZE / 2}" r="${SIZE / 2}" fill="#fff"/></svg>`,
  );
  await sharp(disc)
    .composite([{ input: padded }, { input: mask, blend: "dest-in" }])
    .webp({ quality: 88, alphaQuality: 95 })
    .toFile(path.join(dir, `${type}-avatar.webp`));
  console.log(`${type}-avatar: ${side}px bust around x ${Math.round(cx)} → ${SIZE}px`);
}

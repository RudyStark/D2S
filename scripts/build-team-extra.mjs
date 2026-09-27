// The eleven agents beyond the 3D five (« Toute l'équipe », 2D only): full-body cut-outs and round avatars, from the
// avatars kept in the hub (d2s-app/design/agents/<slug>.webp, transparent, never regenerated here).
// Usage: node scripts/build-team-extra.mjs [source dir]   (default: ../d2s-app/design/agents)
import path from "node:path";
import sharp from "sharp";

const root = path.resolve(import.meta.dirname, "..");
const src = path.resolve(process.argv[2] ?? path.join(root, "../d2s-app/design/agents"));
const out = path.join(root, "public/images/agents");
const SLUGS = ["orchestrateur", "proposition", "fireflies", "presentateur", "strategiste", "designer", "gmail", "ecommerce", "veille", "comptabilite", "cerveau"];
/** Emma's ponytail makes her head look off-centre. */
const NUDGE = { ecommerce: -70 };
const SIZE = 128;

for (const slug of SLUGS) {
  const file = path.join(src, `${slug}.webp`);
  // Full body: trimmed to the figure, same height as the site's five cut-outs.
  const trimmed = await sharp(file).trim({ threshold: 1 }).png().toBuffer();
  const full = await sharp(trimmed).resize({ height: 1150, withoutEnlargement: true }).webp({ quality: 84, alphaQuality: 92 }).toFile(path.join(out, `${slug}.webp`));

  // Avatar: head and shoulders on a pale disc (as build-avatars.mjs), centred on the widest run of the head rows.
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  const opaque = (x, y) => data[(y * w + x) * 4 + 3] > 40;
  let top = h;
  let bottom = 0;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++)
      if (opaque(x, y)) {
        top = Math.min(top, y);
        bottom = Math.max(bottom, y);
        break;
      }
  const figureH = bottom - top;
  const centres = [];
  for (let y = Math.round(top + figureH * 0.05); y < top + figureH * 0.17; y++) {
    let best = 0;
    let centre = null;
    for (let x = 0, start = -1; x <= w; x++) {
      const on = x < w && opaque(x, y);
      if (on && start < 0) start = x;
      if (!on && start >= 0) {
        if (x - start > best) {
          best = x - start;
          centre = (start + x) / 2;
        }
        start = -1;
      }
    }
    if (centre != null) centres.push(centre);
  }
  centres.sort((a, b) => a - b);
  const cx = (centres.length ? centres[Math.floor(centres.length / 2)] : w / 2) + (NUDGE[slug] ?? 0);
  const side = Math.round(figureH * 0.41);
  const pad = side;
  const extended = await sharp(file).extend({ top: pad, bottom: pad, left: pad, right: pad, background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
  const bust = await sharp(extended)
    .extract({ left: Math.round(cx - side / 2) + pad, top: Math.round(top - side * 0.04) + pad, width: side, height: side })
    .resize(SIZE, SIZE)
    .toBuffer();
  const disc = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}"><circle cx="${SIZE / 2}" cy="${SIZE / 2}" r="${SIZE / 2}" fill="#e9eef6"/></svg>`);
  const mask = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}"><circle cx="${SIZE / 2}" cy="${SIZE / 2}" r="${SIZE / 2}" fill="#fff"/></svg>`);
  await sharp(disc)
    .composite([{ input: bust }, { input: mask, blend: "dest-in" }])
    .webp({ quality: 88, alphaQuality: 95 })
    .toFile(path.join(out, `${slug}-avatar.webp`));
  console.log(`${slug}: ${full.width}×${full.height} (${Math.round(full.size / 1024)} Ko) + avatar`);
}

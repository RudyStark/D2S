// Measures text/UI bands in a screenshot region (page coordinates).
// Usage: node scripts/measure.mjs <image> <cropTop> <x> <y> <w> <h> [mode=dark|blue|white] [minRowGap=3]
import sharp from "sharp";

const [, , file, cropTop = "0", x0s, y0s, ws, hs, mode = "dark", gapS = "3"] = process.argv;
const cropT = Number(cropTop);
const [x0, y0, w, h, gap] = [x0s, y0s, ws, hs, gapS].map(Number);
const { data, info } = await sharp(file).removeAlpha().extract({ left: x0, top: y0 + cropT, width: w, height: h }).raw().toBuffer({ resolveWithObject: true });

const hit = (r, g, b) => {
  const l = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  if (mode === "dark") return l < 140;
  if (mode === "blue") return b > 180 && b - r > 70 && l < 200;
  if (mode === "white") return l > 250;
  return false;
};

const rows = [];
for (let y = 0; y < info.height; y++) {
  let minX = Infinity, maxX = -1, n = 0;
  for (let x = 0; x < info.width; x++) {
    const i = (y * info.width + x) * 3;
    if (hit(data[i], data[i + 1], data[i + 2])) { n++; if (x < minX) minX = x; if (x > maxX) maxX = x; }
  }
  rows.push({ n, minX, maxX });
}
const bands = [];
let cur = null, empty = 0;
rows.forEach((r, y) => {
  if (r.n > 0) {
    if (!cur) cur = { y0: y, y1: y, minX: r.minX, maxX: r.maxX, px: 0 };
    cur.y1 = y; cur.minX = Math.min(cur.minX, r.minX); cur.maxX = Math.max(cur.maxX, r.maxX); cur.px += r.n;
    empty = 0;
  } else if (cur) {
    empty++;
    if (empty >= gap) { bands.push(cur); cur = null; }
  }
});
if (cur) bands.push(cur);
for (const b of bands) {
  if (b.px < 20) continue;
  console.log(`y ${b.y0 + y0}–${b.y1 + y0} (h ${b.y1 - b.y0 + 1})  x ${b.minX + x0}–${b.maxX + x0} (w ${b.maxX - b.minX + 1})  ink ${b.px}`);
}

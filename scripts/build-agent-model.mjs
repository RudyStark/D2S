// Builds a web-ready agent GLB from a (heavy, AI-generated) source model.
// Keeps a copy of the source in .cache/agents, writes public/models/agents/<type>.glb and refreshes the manifest.
// Usage: node scripts/build-agent-model.mjs <source.glb> <automation|support|prospection|content|data> [--tris 40000] [--yaw 0] [--keep-maps]
//   --tris       target triangles (40k: no visible difference with 80k even at the closest shot, p = 0.25).
//   --yaw        degrees added around Y so the character faces +Z (the street / the camera).
//   --keep-maps  keep the source normal / metallic-roughness maps (default: cleaned, see below).
//
// AI-generated characters come with thousands of tiny UV islands on a flat background, a normal map
// that only holds island-border ridges and a noisy roughness map. Seen at 300–500 px, mip filtering
// (and the small UV drift of decimation) samples the background → sparkling, "snowy" surfaces.
// Cleaning: the base colour background is filled from the neighbouring islands (UV coverage mask
// rasterised from the source mesh + push-pull fill); normal and roughness maps are replaced by a
// uniform satin finish (roughness 0.62, no metal).
import { copyFileSync, mkdirSync, statSync } from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { center, dedup, meshopt, prune, quantize, simplify, textureCompress, weld } from "@gltf-transform/functions";
import { MeshoptEncoder, MeshoptSimplifier } from "meshoptimizer";
import sharp from "sharp";

const TYPES = ["automation", "support", "prospection", "content", "data"];
const root = path.resolve(import.meta.dirname, "..");
const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : fallback;
};
const [src, type] = args;
if (!src || !TYPES.includes(type)) {
  console.error(`usage: node scripts/build-agent-model.mjs <source.glb> <${TYPES.join("|")}> [--tris 40000] [--yaw 0] [--keep-maps]`);
  process.exit(1);
}
const targetTris = Number(opt("tris", "40000"));
const keepMaps = args.includes("--keep-maps");
const yaw = (Number(opt("yaw", "0")) * Math.PI) / 180;

const cacheDir = path.join(root, ".cache/agents");
mkdirSync(cacheDir, { recursive: true });
const cached = path.join(cacheDir, `${type}.source.glb`);
if (path.resolve(src) !== cached) copyFileSync(src, cached);

await MeshoptEncoder.ready;
await MeshoptSimplifier.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ "meshopt.encoder": MeshoptEncoder });
const doc = await io.read(cached);

const countTris = () =>
  doc
    .getRoot()
    .listMeshes()
    .flatMap((m) => m.listPrimitives())
    .reduce((n, p) => n + (p.getIndices() ? p.getIndices().getCount() : p.getAttribute("POSITION").getCount()) / 3, 0);

const before = countTris();

/** Rasterises the UV triangles of every primitive using `texture` into a coverage mask. */
function uvCoverage(texture, w, h) {
  const mask = new Uint8Array(w * h);
  for (const mesh of doc.getRoot().listMeshes()) {
    for (const prim of mesh.listPrimitives()) {
      const mat = prim.getMaterial();
      if (!mat || mat.getBaseColorTexture() !== texture) continue;
      const uv = prim.getAttribute("TEXCOORD_0")?.getArray();
      if (!uv) continue;
      const idx = prim.getIndices()?.getArray() ?? Uint32Array.from({ length: uv.length / 2 }, (_, i) => i);
      for (let t = 0; t < idx.length; t += 3) {
        const a = idx[t] * 2;
        const b = idx[t + 1] * 2;
        const c = idx[t + 2] * 2;
        const ax = uv[a] * w, ay = uv[a + 1] * h;
        const bx = uv[b] * w, by = uv[b + 1] * h;
        const cx = uv[c] * w, cy = uv[c + 1] * h;
        const x0 = Math.max(0, Math.floor(Math.min(ax, bx, cx)));
        const x1 = Math.min(w - 1, Math.ceil(Math.max(ax, bx, cx)));
        const y0 = Math.max(0, Math.floor(Math.min(ay, by, cy)));
        const y1 = Math.min(h - 1, Math.ceil(Math.max(ay, by, cy)));
        const area = (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
        if (Math.abs(area) < 1e-9) {
          mask[Math.min(h - 1, Math.max(0, Math.round(ay))) * w + Math.min(w - 1, Math.max(0, Math.round(ax)))] = 1;
          continue;
        }
        for (let y = y0; y <= y1; y++) {
          const py = y + 0.5;
          for (let x = x0; x <= x1; x++) {
            const px = x + 0.5;
            const w0 = ((bx - px) * (cy - py) - (by - py) * (cx - px)) / area;
            const w1 = ((cx - px) * (ay - py) - (cy - py) * (ax - px)) / area;
            const w2 = 1 - w0 - w1;
            // Slightly conservative: texels touched by an edge count as covered.
            if (w0 >= -0.02 && w1 >= -0.02 && w2 >= -0.02) mask[y * w + x] = 1;
          }
        }
      }
    }
  }
  return mask;
}

/** Push-pull fill: uncovered texels take the (mask-weighted) colour of the nearest islands. */
function pushPullFill(rgba, mask, w, h) {
  const levels = [];
  let cw = w;
  let ch = h;
  let col = new Float32Array(w * h * 3);
  let wt = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) {
    if (!mask[i]) continue;
    wt[i] = 1;
    col[i * 3] = rgba[i * 4];
    col[i * 3 + 1] = rgba[i * 4 + 1];
    col[i * 3 + 2] = rgba[i * 4 + 2];
  }
  levels.push({ w: cw, h: ch, col, wt });
  while (cw > 1 || ch > 1) {
    const nw = Math.max(1, cw >> 1);
    const nh = Math.max(1, ch >> 1);
    const ncol = new Float32Array(nw * nh * 3);
    const nwt = new Float32Array(nw * nh);
    for (let y = 0; y < nh; y++)
      for (let x = 0; x < nw; x++) {
        let sw = 0, r = 0, g = 0, b = 0;
        for (let dy = 0; dy < 2; dy++)
          for (let dx = 0; dx < 2; dx++) {
            const si = Math.min(ch - 1, y * 2 + dy) * cw + Math.min(cw - 1, x * 2 + dx);
            const ww = wt[si];
            sw += ww;
            r += col[si * 3] * ww;
            g += col[si * 3 + 1] * ww;
            b += col[si * 3 + 2] * ww;
          }
        if (sw > 0) {
          const di = y * nw + x;
          ncol[di * 3] = r / sw;
          ncol[di * 3 + 1] = g / sw;
          ncol[di * 3 + 2] = b / sw;
          nwt[di] = 1;
        }
      }
    cw = nw;
    ch = nh;
    col = ncol;
    wt = nwt;
    levels.push({ w: cw, h: ch, col, wt });
  }
  for (let l = levels.length - 2; l >= 0; l--) {
    const fine = levels[l];
    const coarse = levels[l + 1];
    for (let y = 0; y < fine.h; y++)
      for (let x = 0; x < fine.w; x++) {
        const i = y * fine.w + x;
        if (fine.wt[i] > 0) continue;
        const ci = Math.min(coarse.h - 1, y >> 1) * coarse.w + Math.min(coarse.w - 1, x >> 1);
        fine.col[i * 3] = coarse.col[ci * 3];
        fine.col[i * 3 + 1] = coarse.col[ci * 3 + 1];
        fine.col[i * 3 + 2] = coarse.col[ci * 3 + 2];
        fine.wt[i] = 1;
      }
  }
  const out = Buffer.from(rgba);
  for (let i = 0; i < w * h; i++) {
    if (mask[i]) continue;
    out[i * 4] = Math.round(levels[0].col[i * 3]);
    out[i * 4 + 1] = Math.round(levels[0].col[i * 3 + 1]);
    out[i * 4 + 2] = Math.round(levels[0].col[i * 3 + 2]);
  }
  return out;
}

if (!keepMaps) {
  for (const texture of doc.getRoot().listTextures()) {
    const users = doc.getRoot().listMaterials().filter((m) => m.getBaseColorTexture() === texture);
    if (!users.length) continue;
    const { data, info } = await sharp(Buffer.from(texture.getImage())).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const mask = uvCoverage(texture, info.width, info.height);
    const covered = mask.reduce((n, v) => n + v, 0) / mask.length;
    const filled = pushPullFill(data, mask, info.width, info.height);
    const png = await sharp(filled, { raw: { width: info.width, height: info.height, channels: 4 } }).removeAlpha().png().toBuffer();
    texture.setImage(new Uint8Array(png)).setMimeType("image/png");
    console.log(`base colour: ${(covered * 100).toFixed(1)} % covered by UV islands, background filled from the islands`);
  }
  for (const mat of doc.getRoot().listMaterials()) {
    mat.setNormalTexture(null).setMetallicRoughnessTexture(null).setOcclusionTexture(null);
    mat.setMetallicFactor(0).setRoughnessFactor(0.62);
  }
}

// Orientation fix around Y, applied on the root nodes.
if (yaw !== 0) {
  const q = [0, Math.sin(yaw / 2), 0, Math.cos(yaw / 2)];
  for (const node of doc.getRoot().getDefaultScene().listChildren()) {
    const [x, y, z, w] = node.getRotation();
    // q * r
    node.setRotation([
      q[3] * x + q[0] * w + q[1] * z - q[2] * y,
      q[3] * y - q[0] * z + q[1] * w + q[2] * x,
      q[3] * z + q[0] * y - q[1] * x + q[2] * w,
      q[3] * w - q[0] * x - q[1] * y - q[2] * z,
    ]);
  }
}

await doc.transform(
  prune(),
  center({ pivot: "below" }),
  weld(),
  simplify({ simplifier: MeshoptSimplifier, ratio: Math.min(1, targetTris / before), error: 0.0015 }),
  dedup(),
  textureCompress({ encoder: sharp, targetFormat: "webp", slots: /^baseColor/, resize: [2048, 2048], quality: 88 }),
  textureCompress({ encoder: sharp, targetFormat: "webp", slots: /^(normal|metallicRoughness|occlusion)/, resize: [1024, 1024], quality: 85 }),
  prune(),
  quantize(),
  meshopt({ encoder: MeshoptEncoder, level: "medium" }),
);

const outDir = path.join(root, "public/models/agents");
mkdirSync(outDir, { recursive: true });
const file = path.join(outDir, `${type}.glb`);
await io.write(file, doc);
const mb = (f) => (statSync(f).size / 1024 / 1024).toFixed(2);
console.log(`${type}: ${Math.round(before).toLocaleString()} → ${Math.round(countTris()).toLocaleString()} triangles · ${mb(cached)} MB → ${mb(file)} MB`);

execFileSync("node", [path.join(root, "scripts/asset-manifest.mjs")], { stdio: "inherit" });

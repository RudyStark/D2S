import * as THREE from "three";

/**
 * Procedural surface layers built on top of the CC0 source maps (no new downloads).
 *  - marble: tone variation from marble_01 (blurred so its small ashlar joints disappear),
 *    fine veins, optional large-format slab joints.
 *  - terrazzo: off-white mineral base with very fine aggregate, for planters.
 * Everything is generated once per page; textures are shared and cloned per object when
 * a different repeat is needed.
 */

function seeded(seed: number) {
  let s = Math.max(1, Math.floor(seed * 7919) % 2147483647);
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function loadImage(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

interface MarbleOptions {
  size: number;
  /** Slabs per texture side (0 = no joints). */
  slabs: number;
  seed: number;
  /** Veins per texture. */
  veins: number;
  /** 0–1 vein opacity scale. */
  veinStrength?: number;
  /** Vein width multiplier (large textures seen from afar need wider veins to survive mipmapping). */
  veinWidth?: number;
  /** Gain applied to marble_01's low-frequency tone deviations. */
  tone?: number;
  /** Per-slab tone shift amplitude. */
  slabTone?: number;
  base?: string;
}

function drawVeins(ctx: CanvasRenderingContext2D, size: number, count: number, strength: number, widthScale: number, rnd: () => number) {
  for (let v = 0; v < count; v++) {
    let x = rnd() * size;
    let y = rnd() * size;
    let a = (rnd() - 0.5) * 1.2 + (rnd() > 0.5 ? 0.6 : -0.6);
    const steps = 50 + Math.floor(rnd() * 90);
    const width = (0.5 + rnd() * 1.4) * widthScale;
    const alpha = (0.05 + rnd() * 0.12) * strength;
    const tone = 130 + Math.floor(rnd() * 40);
    ctx.beginPath();
    ctx.moveTo(x, y);
    for (let i = 0; i < steps; i++) {
      a += (rnd() - 0.5) * 0.35;
      x += Math.cos(a) * size * 0.008;
      y += Math.sin(a) * size * 0.008;
      ctx.lineTo(x, y);
      // Occasional hair-thin branch.
      if (rnd() > 0.965) {
        const bx = x;
        const by = y;
        let ba = a + (rnd() - 0.5) * 1.6;
        ctx.moveTo(bx, by);
        let cx = bx;
        let cy = by;
        for (let j = 0; j < 14; j++) {
          ba += (rnd() - 0.5) * 0.4;
          cx += Math.cos(ba) * size * 0.006;
          cy += Math.sin(ba) * size * 0.006;
          ctx.lineTo(cx, cy);
        }
        ctx.moveTo(x, y);
      }
    }
    // Soft halo first, then the vein itself.
    ctx.strokeStyle = `rgba(${tone + 20},${tone + 24},${tone + 32},${alpha * 0.3})`;
    ctx.lineWidth = width * 4;
    ctx.stroke();
    ctx.strokeStyle = `rgba(${tone},${tone + 4},${tone + 14},${alpha})`;
    ctx.lineWidth = width;
    ctx.stroke();
  }
}

function parseHex(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** White polished marble. Returns immediately; the canvas is refined once marble_01 has loaded. */
export function createMarbleTexture({
  size,
  slabs,
  seed,
  veins,
  veinStrength = 1,
  veinWidth = 1,
  tone = 0.55,
  slabTone = 0.06,
  base = "#f1f1ef",
}: MarbleOptions) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = 8;

  loadImage("/textures/marble_diff.webp")
    .then((img) => {
      const rnd = seeded(seed);
      // Low-frequency tone from the real stone, blurred so its small-format joints vanish,
      // re-centred on the base colour with an explicit gain.
      const toneLayer = document.createElement("canvas");
      toneLayer.width = toneLayer.height = size;
      const tctx = toneLayer.getContext("2d", { willReadFrequently: true })!;
      tctx.filter = `blur(${Math.round(size / 110)}px)`;
      for (let ty = -1; ty <= 1; ty++) for (let tx = -1; tx <= 1; tx++) tctx.drawImage(img, tx * size, ty * size, size, size);
      const pixels = tctx.getImageData(0, 0, size, size);
      const d = pixels.data;
      let mean = 0;
      for (let i = 0; i < d.length; i += 4) mean += d[i];
      mean /= d.length / 4;
      const [br, bg, bb] = parseHex(base);
      for (let i = 0; i < d.length; i += 4) {
        const dev = (d[i] - mean) * tone;
        d[i] = br + dev;
        d[i + 1] = bg + dev;
        d[i + 2] = bb + dev * 1.05;
      }
      ctx.putImageData(pixels, 0, 0);

      // Per-slab tone shift.
      if (slabs > 0) {
        const s = size / slabs;
        for (let j = 0; j < slabs; j++)
          for (let i = 0; i < slabs; i++) {
            const d = (rnd() - 0.5) * slabTone;
            ctx.fillStyle = d > 0 ? `rgba(255,255,255,${d})` : `rgba(120,118,112,${-d})`;
            ctx.fillRect(i * s, j * s, s, s);
          }
      }

      // Fine veins, slightly softened; drawn on a 3×3 wrap so they tile seamlessly.
      const layer = document.createElement("canvas");
      layer.width = layer.height = size;
      const lctx = layer.getContext("2d")!;
      lctx.lineCap = "round";
      lctx.lineJoin = "round";
      for (let ty = -1; ty <= 1; ty++)
        for (let tx = -1; tx <= 1; tx++) {
          lctx.save();
          lctx.translate(tx * size, ty * size);
          drawVeins(lctx, size, veins, veinStrength, veinWidth, seeded(seed * 3 + 1));
          lctx.restore();
        }
      ctx.filter = "blur(0.6px)";
      ctx.drawImage(layer, 0, 0);
      ctx.filter = "none";

      // Large-format joints: hair-thin, light grey — scale cue only.
      if (slabs > 0) {
        const s = size / slabs;
        ctx.fillStyle = "rgba(160,162,166,0.5)";
        const w = Math.max(1, size / 800);
        for (let i = 0; i <= slabs; i++) {
          ctx.fillRect(i * s - w / 2, 0, w, size);
          ctx.fillRect(0, i * s - w / 2, size, w);
        }
      }
      texture.needsUpdate = true;
    })
    .catch(() => undefined);

  return texture;
}

/**
 * Roughness companion for large floors: marble_01's roughness, blurred so its small-format
 * joints disappear, plus slightly rougher slab joints (they catch less reflection).
 */
export function createMarbleRoughness({ size, slabs }: { size: number; slabs: number }) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "rgb(128,128,128)";
  ctx.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = 8;
  loadImage("/textures/marble_rough.webp")
    .then((img) => {
      ctx.filter = `blur(${Math.round(size / 90)}px)`;
      for (let ty = -1; ty <= 1; ty++) for (let tx = -1; tx <= 1; tx++) ctx.drawImage(img, tx * size, ty * size, size, size);
      ctx.filter = "none";
      if (slabs > 0) {
        const s = size / slabs;
        const w = Math.max(2, size / 900);
        ctx.fillStyle = "rgba(235,235,235,0.9)";
        for (let i = 0; i <= slabs; i++) {
          ctx.fillRect(i * s - w / 2, 0, w, size);
          ctx.fillRect(0, i * s - w / 2, size, w);
        }
      }
      texture.needsUpdate = true;
    })
    .catch(() => undefined);
  return texture;
}

/**
 * Mineral / micro-terrazzo planter surface: off-white, soft mottling at 1–15 cm and a very
 * fine aggregate. `size` px cover one tile (see PLANTER_TILE in materials).
 */
export function createTerrazzoTexture(size = 1024, seed = 5) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const rnd = seeded(seed);
  ctx.fillStyle = "#eeece7";
  ctx.fillRect(0, 0, size, size);
  // Mottling, drawn on a 3×3 wrap so the tile stays seamless.
  const blotch = (count: number, rMin: number, rMax: number, alpha: number) => {
    for (let i = 0; i < count; i++) {
      const x = rnd() * size;
      const y = rnd() * size;
      const r = size * (rMin + rnd() * (rMax - rMin));
      const t = rnd() > 0.5 ? "255,255,253" : "200,195,186";
      const a = alpha * (0.5 + rnd());
      for (let ty = -1; ty <= 1; ty++)
        for (let tx = -1; tx <= 1; tx++) {
          const cx = x + tx * size;
          const cy = y + ty * size;
          const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
          g.addColorStop(0, `rgba(${t},${a})`);
          g.addColorStop(1, `rgba(${t},0)`);
          ctx.fillStyle = g;
          ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
        }
    }
  };
  blotch(36, 0.08, 0.24, 0.12);
  blotch(260, 0.015, 0.05, 0.1);
  // Fine aggregate (≈ 0.5–3 mm).
  const k = size / 512;
  for (let i = 0; i < size * 6; i++) {
    const x = rnd() * size;
    const y = rnd() * size;
    const r = k * (0.4 + rnd() * rnd() * 1.6);
    const tone = rnd();
    ctx.fillStyle =
      tone > 0.86 ? `rgba(146,142,134,${0.25 + rnd() * 0.25})` : tone > 0.6 ? `rgba(194,188,178,${0.3 + rnd() * 0.3})` : `rgba(251,250,247,${0.4 + rnd() * 0.4})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = 8;
  return texture;
}

/** Clone a shared map with its own repeat, leaving the original untouched. */
export function withRepeat<T extends THREE.Texture>(texture: T, u: number, v: number): T {
  const t = texture.clone() as T;
  t.repeat.set(u, v);
  t.needsUpdate = true;
  return t;
}

let spill: THREE.CanvasTexture | null = null;
/** Soft elliptical warm falloff for the light spilling from the desk plinth onto the floor. */
export function getSpillTexture() {
  if (spill) return spill;
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  // Opaque greyscale: alphaMap reads the green channel, not canvas alpha.
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, size, size);
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, "rgb(255,255,255)");
  g.addColorStop(0.35, "rgb(115,115,115)");
  g.addColorStop(1, "rgb(0,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  spill = new THREE.CanvasTexture(canvas);
  return spill;
}

let contact: THREE.CanvasTexture | null = null;
/** Contact shadow falloff (greyscale, for alphaMap): dense at the footprint, fading within a hand's width. */
export function getContactShadowTexture() {
  if (contact) return contact;
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, size, size);
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, "rgb(255,255,255)");
  g.addColorStop(0.62, "rgb(230,230,230)");
  g.addColorStop(0.72, "rgb(120,120,120)");
  g.addColorStop(0.85, "rgb(35,35,35)");
  g.addColorStop(1, "rgb(0,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  contact = new THREE.CanvasTexture(canvas);
  return contact;
}

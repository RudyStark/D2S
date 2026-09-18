import * as THREE from "three";
import { COLORS } from "@/lib/brand";

/**
 * Shared materials. Geometry UVs are in metres (see architecture/primitives), so a texture
 * repeat of 1/N means "one tile every N metres" everywhere.
 * Textures: CC0 Poly Haven (marble_01, white_plaster_02), recoloured — see design/ASSETS.md.
 */

const loader = typeof window !== "undefined" ? new THREE.TextureLoader() : null;

function tex(url: string, { repeat = 1, srgb = false }: { repeat?: number; srgb?: boolean } = {}) {
  const t = loader ? loader.load(url) : new THREE.Texture();
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat, repeat);
  t.anisotropy = 8;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Fine horizontal brushing for stainless steel (roughness variation). */
function brushedTexture() {
  if (typeof document === "undefined") return null;
  const w = 512;
  const h = 64;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "rgb(120,120,120)";
  ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 900; i++) {
    const y = Math.random() * h;
    const v = 90 + Math.random() * 70;
    ctx.fillStyle = `rgba(${v},${v},${v},0.35)`;
    ctx.fillRect(0, y, w, 0.6 + Math.random() * 0.8);
  }
  const t = new THREE.CanvasTexture(canvas);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(2, 2);
  return t;
}

const plasterMaps = {
  map: tex("/textures/plaster_diff.webp", { repeat: 1 / 2.6, srgb: true }),
  roughnessMap: tex("/textures/plaster_rough.webp", { repeat: 1 / 2.6 }),
  normalMap: tex("/textures/plaster_nor.webp", { repeat: 1 / 2.6 }),
};

const stoneMaps = {
  map: tex("/textures/marble_diff.webp", { repeat: 1 / 2.4, srgb: true }),
  roughnessMap: tex("/textures/marble_rough.webp", { repeat: 1 / 2.4 }),
  normalMap: tex("/textures/marble_nor.webp", { repeat: 1 / 2.4 }),
};

/** Floor tiles for a plane of width × depth metres with 0–1 UVs. */
export function createFloorMaps(width: number, depth: number) {
  const tile = 2.6;
  const make = (url: string, srgb = false) => {
    const t = tex(url, { srgb });
    t.repeat.set(width / tile, depth / tile);
    return t;
  };
  return {
    map: make("/textures/marble_diff.webp", true),
    roughnessMap: make("/textures/marble_rough.webp"),
    normalMap: make("/textures/marble_nor.webp"),
  };
}

const brushed = brushedTexture();

export const MATERIALS = {
  plaster: new THREE.MeshStandardMaterial({
    color: "#fbfaf8",
    ...plasterMaps,
    normalScale: new THREE.Vector2(0.22, 0.22),
    roughness: 0.82,
    metalness: 0,
  }),
  plasterWarm: new THREE.MeshStandardMaterial({
    color: "#fcf9f4",
    ...plasterMaps,
    normalScale: new THREE.Vector2(0.18, 0.18),
    roughness: 0.8,
    metalness: 0,
  }),
  stone: new THREE.MeshStandardMaterial({
    color: "#fbfbfa",
    ...stoneMaps,
    normalScale: new THREE.Vector2(0.3, 0.3),
    roughness: 0.42,
    metalness: 0,
    envMapIntensity: 0.9,
  }),
  ceiling: new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.92, metalness: 0 }),
  /** Polished white lacquer (reception desk, smooth joinery). */
  lacquer: new THREE.MeshPhysicalMaterial({
    color: "#ffffff",
    roughness: 0.18,
    metalness: 0,
    clearcoat: 0.6,
    clearcoatRoughness: 0.15,
    envMapIntensity: 1.1,
  }),
  floor: new THREE.MeshStandardMaterial({ color: "#f6f6f5", roughness: 0.2, metalness: 0, envMapIntensity: 1 }),
  steel: new THREE.MeshPhysicalMaterial({
    color: "#eaedf2",
    metalness: 1,
    roughness: 0.22,
    roughnessMap: brushed,
    anisotropy: 0.6,
    envMapIntensity: 1.5,
  }),
  steelDark: new THREE.MeshStandardMaterial({ color: "#7d8591", roughness: 0.35, metalness: 0.85 }),
  glass: new THREE.MeshPhysicalMaterial({
    color: "#f3f7f9",
    metalness: 0,
    roughness: 0.03,
    ior: 1.52,
    thickness: 0.02,
    specularIntensity: 1,
    envMapIntensity: 1.4,
    transparent: true,
    opacity: 0.16,
    depthWrite: false,
    side: THREE.DoubleSide,
  }),
  doorGlass: new THREE.MeshPhysicalMaterial({
    color: "#f1f6f8",
    metalness: 0,
    roughness: 0.02,
    ior: 1.52,
    thickness: 0.02,
    specularIntensity: 1,
    envMapIntensity: 1.6,
    transparent: true,
    opacity: 0.18,
    depthWrite: false,
    side: THREE.DoubleSide,
  }),
  logo: new THREE.MeshStandardMaterial({ color: COLORS.logo, roughness: 0.38, metalness: 0.15, side: THREE.DoubleSide }),
  signFace: new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.55, emissive: "#fffdf8", emissiveIntensity: 0.55 }),
  signGlow: new THREE.MeshBasicMaterial({
    color: new THREE.Color("#fff6e8").multiplyScalar(2.6),
    transparent: true,
    opacity: 0.9,
    toneMapped: false,
    depthWrite: false,
  }),
  coveLight: new THREE.MeshBasicMaterial({ color: new THREE.Color("#ffe6c7").multiplyScalar(6), toneMapped: false }),
  coolLight: new THREE.MeshBasicMaterial({ color: new THREE.Color("#f4f8ff").multiplyScalar(5), toneMapped: false }),
  fabric: new THREE.MeshStandardMaterial({ color: "#e7e6e3", roughness: 0.92 }),
  fabricDark: new THREE.MeshStandardMaterial({ color: "#d8d7d4", roughness: 0.95 }),
  screen: new THREE.MeshStandardMaterial({ color: "#1a2040", roughness: 0.2, metalness: 0.3, emissive: "#2a3a8a", emissiveIntensity: 0.25 }),
  shadow: new THREE.MeshBasicMaterial({ color: "#1d2233", transparent: true, opacity: 0.3, depthWrite: false }),
} as const;

/**
 * High tier: real transmission (the opaque scene refracted behind + env reflections).
 * Everything that must stay visible through glass is opaque (alpha-tested agents, canvas wall type).
 */
export function setGlassQuality(transmission: boolean) {
  for (const m of [MATERIALS.glass, MATERIALS.doorGlass]) {
    m.transmission = transmission ? 1 : 0;
    m.transparent = !transmission;
    m.opacity = transmission ? 1 : m === MATERIALS.glass ? 0.16 : 0.18;
    m.needsUpdate = true;
  }
}

let radialTexture: THREE.CanvasTexture | null = null;

/** Soft radial falloff used for contact shadows. */
export function getRadialTexture() {
  if (radialTexture) return radialTexture;
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.45, "rgba(255,255,255,0.55)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  radialTexture = new THREE.CanvasTexture(canvas);
  return radialTexture;
}

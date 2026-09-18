import * as THREE from "three";
import { COLORS } from "@/lib/brand";
import { createMarbleRoughness, createMarbleTexture, createTerrazzoTexture, getContactShadowTexture, withRepeat } from "./textures";

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

/**
 * Floor: large-format white marble, 2.1 m slabs with hair-line joints and fine veins.
 * One texture covers 2 × 2 slabs (4.2 m); the ground plane has 0–1 UVs over width × depth metres.
 */
export function createFloorMaps(width: number, depth: number) {
  const span = 4.2;
  const map = createMarbleTexture({ size: 2048, slabs: 2, seed: 3, veins: 14, veinStrength: 1.3, veinWidth: 4, tone: 2.2, slabTone: 0.1, base: "#f0f1f1" });
  const roughnessMap = createMarbleRoughness({ size: 1024, slabs: 2 });
  for (const t of [map, roughnessMap]) t.repeat.set(width / span, depth / span);
  return { map, roughnessMap };
}

const brushed = brushedTexture();

/** Planter maps: one terrazzo tile every PLANTER_TILE metres (pot UVs are in metres). */
export const PLANTER_TILE = 0.6;
const terrazzo = typeof document !== "undefined" ? createTerrazzoTexture(1024, 5) : null;
if (terrazzo) terrazzo.repeat.set(1 / PLANTER_TILE, 1 / PLANTER_TILE);
const planterRelief = {
  roughnessMap: withRepeat(plasterMaps.roughnessMap, 1 / 0.9, 1 / 0.9),
  normalMap: withRepeat(plasterMaps.normalMap, 1 / 0.9, 1 / 0.9),
};

/**
 * Keeps a tiled albedo map's grain but reduces its contrast (0 = flat colour, 1 = full map),
 * so large surfaces read as fine mineral finishes rather than blotchy concrete.
 */
function softenMap<T extends THREE.MeshStandardMaterial>(material: T, strength: number): T {
  material.onBeforeCompile = (shader) => {
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <map_fragment>",
      `#include <map_fragment>
      diffuseColor.rgb = mix(diffuse, diffuseColor.rgb, ${strength.toFixed(2)});`,
    );
  };
  material.customProgramCacheKey = () => `soft-map-${strength}`;
  return material;
}

/**
 * Feature drum: 7.2 m tall, 3.6 m radius → 22.6 m around. CylinderGeometry UVs are 0–1,
 * so the plaster maps are cloned with an integer repeat (9 × 3 → ~2.5 m tiles, seamless).
 */
const drumMaps = {
  map: withRepeat(plasterMaps.map, 9, 3),
  roughnessMap: withRepeat(plasterMaps.roughnessMap, 9, 3),
  normalMap: withRepeat(plasterMaps.normalMap, 9, 3),
};

/** Desk top marble: veined, no joints. Arc geometry UVs are in metres → one tile per 1.8 m. */
const deskMarble = typeof document !== "undefined" ? createMarbleTexture({ size: 1024, slabs: 0, seed: 7, veins: 9, veinStrength: 1.1 }) : null;
if (deskMarble) deskMarble.repeat.set(1 / 1.8, 1 / 1.8);

export const MATERIALS = {
  /* Whites are kept below pure white so light has headroom; each family has its own temperature. */
  /** Mineral plaster — walls, columns: warm ivory, matte. */
  plaster: new THREE.MeshStandardMaterial({
    color: "#f3efe8",
    ...plasterMaps,
    normalScale: new THREE.Vector2(0.35, 0.35),
    roughness: 0.86,
    metalness: 0,
  }),
  plasterWarm: new THREE.MeshStandardMaterial({
    color: "#f0ebe3",
    ...plasterMaps,
    normalScale: new THREE.Vector2(0.3, 0.3),
    roughness: 0.86,
    metalness: 0,
  }),
  /** Stone — steles, planters' square boxes, sign surrounds: off-white, warm grey. */
  stone: new THREE.MeshStandardMaterial({
    color: "#efece6",
    ...stoneMaps,
    normalScale: new THREE.Vector2(0.3, 0.3),
    roughness: 0.5,
    metalness: 0,
  }),
  /** Ceiling: neutral white, fully matte. */
  ceiling: new THREE.MeshStandardMaterial({ color: "#f2f2f0", roughness: 0.96, metalness: 0 }),
  /** Feature drum: premium mineral plaster / fine micro-cement, warm white. */
  featurePlaster: softenMap(
    new THREE.MeshStandardMaterial({
      color: "#f8f5ef",
      ...drumMaps,
      normalScale: new THREE.Vector2(0.42, 0.42),
      roughness: 0.62,
      metalness: 0,
    }),
    0.4,
  ),
  /** Desk body: satin solid surface, slightly cool white, broad soft reflection. */
  solidSurface: new THREE.MeshPhysicalMaterial({
    color: "#f4f5f7",
    roughness: 0.34,
    metalness: 0,
    clearcoat: 0.22,
    clearcoatRoughness: 0.34,
  }),
  /** Desk top: white veined marble, honed-polished. */
  deskStone: new THREE.MeshStandardMaterial({
    color: "#f6f5f2",
    map: deskMarble,
    roughnessMap: withRepeat(stoneMaps.roughnessMap, 1 / 1.8, 1 / 1.8),
    roughness: 0.42,
    metalness: 0,
  }),
  /** Mineral planter: matte micro-terrazzo with a fine hand-finished relief. */
  planterStone: new THREE.MeshStandardMaterial({
    color: "#f1efea",
    map: terrazzo,
    ...planterRelief,
    normalScale: new THREE.Vector2(0.7, 0.7),
    roughness: 0.68,
  }),
  /** Satin glazed ceramic: nearly uniform, a hint of mottling, soft sheen. */
  planterCeramic: softenMap(
    new THREE.MeshPhysicalMaterial({
      color: "#efece7",
      map: terrazzo,
      ...planterRelief,
      normalScale: new THREE.Vector2(0.16, 0.16),
      roughness: 0.52,
      clearcoat: 0.12,
      clearcoatRoughness: 0.42,
    }),
    0.45,
  ),
  /** Soft contact shadow decal under loose objects (pots, benches). */
  contactShadow: new THREE.MeshBasicMaterial({
    color: "#262a33",
    alphaMap: typeof document !== "undefined" ? getContactShadowTexture() : null,
    transparent: true,
    opacity: 0.42,
    depthWrite: false,
  }),
  /** Plinth: matte mineral, a shade darker than the body so the recess reads. */
  plinth: new THREE.MeshStandardMaterial({
    color: "#dcd8d1",
    ...plasterMaps,
    normalScale: new THREE.Vector2(0.25, 0.25),
    roughness: 0.9,
    metalness: 0,
  }),
  /** Reveal / shadow gap: dark satin metal. */
  darkSatin: new THREE.MeshPhysicalMaterial({
    color: "#3b404b",
    metalness: 0.85,
    roughness: 0.8, // × brushed map ≈ 0.38 effective
    roughnessMap: brushed,
    envMapIntensity: 0.8,
  }),
  floor: new THREE.MeshStandardMaterial({ color: "#f6f6f5", roughness: 0.2, metalness: 0 }),
  /**
   * Satin stainless (reflectance ≈ 0.55): reads as brushed metal, never as a light strip.
   * The brushed roughnessMap averages ≈ 0.47, so the effective roughness is ≈ 0.32 (0.24–0.43).
   * No `anisotropy`: under the low sun entering through the glazing, three's anisotropic lobe
   * turns thin frames into glowing bars. The brushing lives in the roughness stripes.
   */
  steel: new THREE.MeshPhysicalMaterial({
    color: "#bfc3c9",
    metalness: 1,
    roughness: 0.68,
    roughnessMap: brushed,
    envMapIntensity: 0.9,
  }),
  /**
   * Same stainless indoors: the HDRI is an outdoor garden (sky + sun), far brighter than the
   * white walls an interior frame would really mirror, so its reflection is scaled down.
   */
  steelInterior: new THREE.MeshPhysicalMaterial({
    color: "#bfc3c9",
    metalness: 1,
    roughness: 0.68,
    roughnessMap: brushed,
    envMapIntensity: 0.6,
  }),
  steelDark: new THREE.MeshStandardMaterial({ color: "#7d8591", roughness: 0.35, metalness: 0.85 }),
  glass: new THREE.MeshPhysicalMaterial({
    color: "#f5f6f6",
    metalness: 0,
    roughness: 0.03,
    ior: 1.52,
    thickness: 0.02,
    specularIntensity: 1,
    envMapIntensity: 1.3,
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
  coveLight: new THREE.MeshBasicMaterial({ color: new THREE.Color("#ffe6c7").multiplyScalar(2.4), toneMapped: false }),
  /** Desk plinth light line: warm, soft — reads as a line of light, not a neon bar. */
  deskGlow: new THREE.MeshBasicMaterial({ color: new THREE.Color("#ffdcb2").multiplyScalar(1.7), toneMapped: false }),
  coolLight: new THREE.MeshBasicMaterial({ color: new THREE.Color("#f4f8ff").multiplyScalar(2), toneMapped: false }),
  fabric: new THREE.MeshStandardMaterial({ color: "#e7e6e3", roughness: 0.92 }),
  fabricDark: new THREE.MeshStandardMaterial({ color: "#d8d7d4", roughness: 0.95 }),
  screen: new THREE.MeshStandardMaterial({ color: "#1a2040", roughness: 0.2, metalness: 0.3, emissive: "#2a3a8a", emissiveIntensity: 0.25 }),
  shadow: new THREE.MeshBasicMaterial({ color: "#1d2233", transparent: true, opacity: 0.3, depthWrite: false }),
} as const;

/**
 * High tier: real transmission (the opaque scene refracted behind + env reflections).
 * Everything that must stay visible through glass is opaque (alpha-tested agents, canvas wall type).
 */
/**
 * three applies `scene.environmentIntensity` to every material that has no envMap of its own,
 * ignoring `material.envMapIntensity`. Materials whose reflection strength must differ from the
 * scene's (metals, glass) get the scene environment bound explicitly (see Lighting).
 */
const ENV_BOUND = () => [MATERIALS.steel, MATERIALS.steelInterior, MATERIALS.darkSatin, MATERIALS.glass];

export function bindEnvironment(scene: THREE.Scene) {
  for (const m of ENV_BOUND()) {
    m.envMap = scene.environment;
    m.envMapRotation.copy(scene.environmentRotation);
    m.needsUpdate = true;
  }
}

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

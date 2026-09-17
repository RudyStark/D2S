import * as THREE from "three";
import { COLORS } from "@/lib/brand";

/**
 * Shared materials (one instance each → fewer shader programs and draw-state changes).
 * Pass 1 = clean volumes; texture maps (marble veins, brushed steel) come in the material pass.
 */
export const MATERIALS = {
  plaster: new THREE.MeshStandardMaterial({ color: "#f5f5f3", roughness: 0.62, metalness: 0 }),
  plasterWarm: new THREE.MeshStandardMaterial({ color: "#f8f7f4", roughness: 0.58, metalness: 0 }),
  stone: new THREE.MeshStandardMaterial({ color: "#eeeeeb", roughness: 0.4, metalness: 0 }),
  floor: new THREE.MeshStandardMaterial({ color: "#f1f1ef", roughness: 0.16, metalness: 0, envMapIntensity: 1.1 }),
  steel: new THREE.MeshStandardMaterial({ color: COLORS.steel, roughness: 0.28, metalness: 0.92, envMapIntensity: 1.2 }),
  steelDark: new THREE.MeshStandardMaterial({ color: "#8e96a3", roughness: 0.35, metalness: 0.9 }),
  glass: new THREE.MeshPhysicalMaterial({
    color: "#e3edf5",
    roughness: 0.04,
    metalness: 0,
    transparent: true,
    opacity: 0.2,
    envMapIntensity: 1.5,
    specularIntensity: 1,
    ior: 1.5,
    depthWrite: false,
    side: THREE.DoubleSide,
  }),
  doorGlass: new THREE.MeshPhysicalMaterial({
    color: "#e8f0f6",
    roughness: 0.03,
    metalness: 0,
    transparent: true,
    opacity: 0.24,
    envMapIntensity: 1.8,
    ior: 1.5,
    depthWrite: false,
    side: THREE.DoubleSide,
  }),
  water: new THREE.MeshPhysicalMaterial({
    color: "#8fb3cf",
    roughness: 0.06,
    metalness: 0.05,
    transparent: true,
    opacity: 0.9,
    envMapIntensity: 1.6,
  }),
  logo: new THREE.MeshStandardMaterial({ color: COLORS.logo, roughness: 0.4, metalness: 0.1, side: THREE.DoubleSide }),
  signFace: new THREE.MeshStandardMaterial({ color: "#fbfbfa", roughness: 0.5, emissive: "#fffaf2", emissiveIntensity: 0.35 }),
  coveLight: new THREE.MeshBasicMaterial({ color: new THREE.Color("#ffe6c7").multiplyScalar(6), toneMapped: false }),
  coolLight: new THREE.MeshBasicMaterial({ color: new THREE.Color("#f4f8ff").multiplyScalar(5), toneMapped: false }),
  fabric: new THREE.MeshStandardMaterial({ color: "#e4e4e2", roughness: 0.95 }),
  foliage: new THREE.MeshStandardMaterial({ color: "#7d9c68", roughness: 0.78 }),
  foliageDark: new THREE.MeshStandardMaterial({ color: "#5f8052", roughness: 0.82 }),
  trunk: new THREE.MeshStandardMaterial({ color: "#8a7a68", roughness: 0.9 }),
  screen: new THREE.MeshStandardMaterial({ color: "#1a2040", roughness: 0.2, metalness: 0.3, emissive: "#2a3a8a", emissiveIntensity: 0.25 }),
  shadow: new THREE.MeshBasicMaterial({ color: "#1d2233", transparent: true, opacity: 0.3, depthWrite: false }),
} as const;

let radialTexture: THREE.CanvasTexture | null = null;

/** Soft radial falloff used for agent contact shadows. */
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

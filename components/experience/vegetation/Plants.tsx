"use client";

import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo } from "react";
import * as THREE from "three";
import { useExperience } from "@/lib/experience/store";
import { boxGeometryMeters } from "../architecture/primitives";
import { MATERIALS } from "../materials";

/**
 * Vegetation from optimised CC0 Poly Haven models (scripts/build-plants.mjs).
 * A handful of models reused with rotation, ±15 % scale and a slight hue shift.
 */
export const PLANT_KINDS = ["olive_a", "olive_b", "olive_c", "shrub", "tropical", "ficus", "pachira_a", "pachira_b"] as const;
export type PlantKind = (typeof PLANT_KINDS)[number];

const url = (kind: PlantKind) => `/models/plants/${kind}.glb`;
PLANT_KINDS.forEach((k) => useGLTF.preload(url(k), false, true));

const windUniform = { value: 0 };
const leafMaterials = new Map<string, THREE.Material>();

function seeded(seed: number) {
  let s = Math.max(1, Math.floor(seed * 9973) % 2147483647);
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/** Shares one material per (source material, tint) and adds a height-weighted breeze. */
function variantMaterial(source: THREE.Material, tint: number) {
  const key = `${source.uuid}|${tint.toFixed(2)}`;
  let m = leafMaterials.get(key);
  if (m) return m;
  const std = (source as THREE.MeshStandardMaterial).clone();
  if (std.color) {
    std.color.offsetHSL(tint * 0.02, tint * 0.04, tint * 0.03);
    std.color.multiplyScalar(1.12);
  }
  const isLeaf = std.alphaTest > 0 || /leaves|twigs/i.test(source.name);
  if (isLeaf) {
    std.side = THREE.DoubleSide;
    std.alphaTest = Math.max(std.alphaTest, 0.45);
    std.onBeforeCompile = (shader) => {
      shader.uniforms.uWind = windUniform;
      shader.vertexShader = shader.vertexShader
        .replace("#include <common>", "#include <common>\nuniform float uWind;")
        .replace(
          "#include <begin_vertex>",
          `#include <begin_vertex>
          float sway = max(position.y, 0.0);
          transformed.x += sin(uWind * 0.9 + position.y * 1.7 + position.z) * 0.012 * sway;
          transformed.z += cos(uWind * 0.7 + position.x * 1.3) * 0.008 * sway;`,
        );
    };
    std.customProgramCacheKey = () => "d2s-leaf";
  }
  leafMaterials.set(key, std);
  return std;
}

interface PlantProps {
  kind: PlantKind;
  position?: [number, number, number];
  /** Target height in metres (±15 % from the seed). */
  height: number;
  rotationY?: number;
  seed?: number;
  castShadow?: boolean;
}

export function Plant({ kind, position = [0, 0, 0], height, rotationY, seed = 1, castShadow = true }: PlantProps) {
  const { scene } = useGLTF(url(kind), false, true);

  const { object, scale, rot } = useMemo(() => {
    const rnd = seeded(seed + kind.length * 0.37);
    const tint = rnd() * 2 - 1;
    const clone = scene.clone(true);
    clone.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.castShadow = castShadow;
      mesh.receiveShadow = true;
      mesh.material = Array.isArray(mesh.material)
        ? mesh.material.map((mm) => variantMaterial(mm, tint))
        : variantMaterial(mesh.material, tint);
    });
    const box = new THREE.Box3().setFromObject(scene);
    const h = Math.max(0.01, box.max.y - box.min.y);
    const s = (height / h) * (0.87 + rnd() * 0.26);
    return { object: clone, scale: s, rot: rotationY ?? rnd() * Math.PI * 2 };
  }, [scene, height, seed, kind, rotationY, castShadow]);

  return <primitive object={object} position={position} scale={scale} rotation-y={rot} />;
}

/** Drives the breeze once for all plants. */
export function Breeze() {
  const reducedMotion = useExperience((s) => s.reducedMotion);
  useFrame(({ clock }) => {
    windUniform.value = reducedMotion ? 0 : clock.elapsedTime;
  });
  return null;
}

const potGeometry = new THREE.LatheGeometry(
  [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(0.88, 0),
    new THREE.Vector2(0.94, 0.04),
    new THREE.Vector2(1, 0.9),
    new THREE.Vector2(1, 0.985),
    new THREE.Vector2(0.985, 1),
    new THREE.Vector2(0.93, 1),
    new THREE.Vector2(0.93, 0.96),
    new THREE.Vector2(0, 0.96),
  ],
  64,
);
const soilMaterial = new THREE.MeshStandardMaterial({ color: "#6f6458", roughness: 1 });

interface PlanterProps {
  position: [number, number, number];
  kind: PlantKind;
  /** Pot radius (or half width when square), metres. */
  radius?: number;
  potHeight?: number;
  /** Plant height above the pot. */
  plantHeight?: number;
  square?: boolean;
  seed?: number;
}

/** White satin planter + CC0 plant. */
export function Planter({ position, kind, radius = 0.4, potHeight = 0.8, plantHeight = 1.2, square = false, seed = 1 }: PlanterProps) {
  return (
    <group position={position}>
      {square ? (
        <mesh geometry={boxGeometryMeters(radius * 2, potHeight, radius * 2)} material={MATERIALS.stone} position-y={potHeight / 2} castShadow receiveShadow />
      ) : (
        <mesh geometry={potGeometry} material={MATERIALS.stone} scale={[radius, potHeight, radius]} castShadow receiveShadow />
      )}
      <mesh material={soilMaterial} rotation-x={-Math.PI / 2} position-y={potHeight * 0.965}>
        {square ? <planeGeometry args={[radius * 1.86, radius * 1.86]} /> : <circleGeometry args={[radius * 0.93, 32]} />}
      </mesh>
      <Plant kind={kind} position={[0, potHeight * 0.95, 0]} height={plantHeight} seed={seed} />
    </group>
  );
}

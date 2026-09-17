"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { MATERIALS } from "../materials";

/**
 * Pass-1 vegetation: readable silhouettes only (low-poly clusters).
 * Replaced by optimised CC0 plant models in the material pass, behind the same props.
 */

const leafBall = new THREE.IcosahedronGeometry(1, 3);
const potGeometry = new THREE.CylinderGeometry(1, 0.92, 1, 32);
const trunkGeometry = new THREE.CylinderGeometry(0.06, 0.1, 1, 8);

function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

interface PlanterProps {
  position: [number, number, number];
  /** Pot radius, metres. */
  radius?: number;
  potHeight?: number;
  /** Foliage height above the pot. */
  foliage?: number;
  square?: boolean;
  seed?: number;
}

export function Planter({ position, radius = 0.4, potHeight = 0.8, foliage = 1.1, square = false, seed = 1 }: PlanterProps) {
  const balls = useMemo(() => {
    const rnd = seeded(seed * 9973 + 7);
    return Array.from({ length: 7 }, (_, i) => {
      const a = (i / 7) * Math.PI * 2 + rnd();
      const r = radius * (0.35 + rnd() * 0.5);
      const s = radius * (0.55 + rnd() * 0.45) * (0.8 + foliage * 0.25);
      return {
        position: [Math.cos(a) * r, potHeight + foliage * (0.25 + rnd() * 0.6), Math.sin(a) * r] as [number, number, number],
        scale: [s, s * (1 + rnd() * 0.5), s] as [number, number, number],
        dark: rnd() > 0.55,
      };
    });
  }, [radius, potHeight, foliage, seed]);

  return (
    <group position={position}>
      {square ? (
        <mesh material={MATERIALS.plaster} position-y={potHeight / 2} scale={[radius * 2, potHeight, radius * 2]} castShadow receiveShadow>
          <boxGeometry />
        </mesh>
      ) : (
        <mesh geometry={potGeometry} material={MATERIALS.plaster} position-y={potHeight / 2} scale={[radius, potHeight, radius]} castShadow receiveShadow />
      )}
      {balls.map((b, i) => (
        <mesh
          key={i}
          geometry={leafBall}
          material={b.dark ? MATERIALS.foliageDark : MATERIALS.foliage}
          position={b.position}
          scale={b.scale}
          castShadow
        />
      ))}
    </group>
  );
}

export function Tree({ position, height = 5, spread = 1.8, seed = 3 }: { position: [number, number, number]; height?: number; spread?: number; seed?: number }) {
  const crowns = useMemo(() => {
    const rnd = seeded(seed * 7919 + 13);
    return Array.from({ length: 9 }, () => {
      const a = rnd() * Math.PI * 2;
      const r = spread * rnd() * 0.75;
      const s = spread * (0.45 + rnd() * 0.35);
      return {
        position: [Math.cos(a) * r, height * (0.62 + rnd() * 0.3), Math.sin(a) * r] as [number, number, number],
        scale: [s, s * 0.8, s] as [number, number, number],
        dark: rnd() > 0.5,
      };
    });
  }, [height, spread, seed]);

  return (
    <group position={position}>
      <mesh geometry={trunkGeometry} material={MATERIALS.trunk} position-y={height * 0.35} scale={[1.6, height * 0.7, 1.6]} castShadow />
      {crowns.map((c, i) => (
        <mesh key={i} geometry={leafBall} material={c.dark ? MATERIALS.foliageDark : MATERIALS.foliage} position={c.position} scale={c.scale} castShadow />
      ))}
    </group>
  );
}

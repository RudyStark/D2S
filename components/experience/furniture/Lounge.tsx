"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { MATERIALS } from "../materials";

const cache = new Map<string, RoundedBoxGeometry>();
function rounded(w: number, h: number, d: number, r = 0.1, segments = 4) {
  const key = `${w}|${h}|${d}|${r}`;
  let g = cache.get(key);
  if (!g) {
    g = new RoundedBoxGeometry(w, h, d, segments, r);
    cache.set(key, g);
  }
  return g;
}

interface SofaProps {
  position: [number, number, number];
  rotationY?: number;
  /** Overall width, metres. */
  width?: number;
}

/** Soft lounge sofa: rounded shell, seat and back cushions (references 03/04). */
export function Sofa({ position, rotationY = 0, width = 2.4 }: SofaProps) {
  const depth = 0.95;
  const armW = 0.24;
  const seats = Math.max(2, Math.round(width / 1.1));
  const cushionW = (width - armW * 2 - 0.06 * (seats + 1)) / seats;

  const cushions = useMemo(
    () =>
      Array.from({ length: seats }, (_, i) => -width / 2 + armW + 0.06 + cushionW / 2 + i * (cushionW + 0.06)),
    [seats, width, cushionW],
  );

  return (
    <group position={position} rotation-y={rotationY}>
      {/* Shell */}
      <mesh geometry={rounded(width, 0.36, depth, 0.1)} material={MATERIALS.fabric} position={[0, 0.18, 0]} castShadow receiveShadow />
      {/* Back */}
      <mesh geometry={rounded(width, 0.52, 0.22, 0.1)} material={MATERIALS.fabric} position={[0, 0.5, -depth / 2 + 0.11]} rotation-x={-0.06} castShadow receiveShadow />
      {/* Arms */}
      {[-1, 1].map((s) => (
        <mesh
          key={s}
          geometry={rounded(armW, 0.34, depth, 0.1)}
          material={MATERIALS.fabric}
          position={[s * (width / 2 - armW / 2), 0.45, 0]}
          castShadow
          receiveShadow
        />
      ))}
      {/* Seat cushions */}
      {cushions.map((x) => (
        <group key={x}>
          <mesh geometry={rounded(cushionW, 0.16, depth - 0.12, 0.06)} material={MATERIALS.fabricDark} position={[x, 0.44, 0.03]} castShadow receiveShadow />
          <mesh geometry={rounded(cushionW - 0.06, 0.4, 0.16, 0.07)} material={MATERIALS.fabricDark} position={[x, 0.72, -depth / 2 + 0.2]} rotation-x={-0.1} castShadow receiveShadow />
        </group>
      ))}
      {/* Feet */}
      {[-1, 1].map((sx) =>
        [-1, 1].map((sz) => (
          <mesh key={`${sx}${sz}`} material={MATERIALS.steelDark} position={[sx * (width / 2 - 0.2), 0.03, sz * (depth / 2 - 0.16)]} castShadow={false}>
            <cylinderGeometry args={[0.022, 0.022, 0.06, 10]} />
          </mesh>
        )),
      )}
    </group>
  );
}

/** Low round stone table with a stack of books. */
export function CoffeeTable({ position, rotationY = 0, radius = 0.52 }: { position: [number, number, number]; rotationY?: number; radius?: number }) {
  return (
    <group position={position} rotation-y={rotationY}>
      <mesh material={MATERIALS.stone} position={[0, 0.18, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[radius, radius * 0.92, 0.36, 48]} />
      </mesh>
      <mesh material={MATERIALS.stone} position={[0, 0.375, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[radius * 1.04, radius * 1.04, 0.05, 48]} />
      </mesh>
      {[0, 1, 2].map((i) => (
        <mesh
          key={i}
          geometry={rounded(0.4 - i * 0.04, 0.042, 0.29 - i * 0.03, 0.008, 2)}
          material={i === 1 ? MATERIALS.steelDark : MATERIALS.logo}
          position={[0.04 * i - 0.04, 0.42 + i * 0.045, 0]}
          rotation-y={0.18 * i}
          castShadow={false}
        />
      ))}
    </group>
  );
}

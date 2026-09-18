"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { MATERIALS } from "../materials";
import { WallType } from "./WallType";

interface SteleProps {
  position: [number, number, number];
  rotationY?: number;
  width?: number;
  height?: number;
  depth?: number;
  lines?: string[];
}

/** Freestanding stone stele with a rounded top ("BETTER PEOPLE / HIGHER POTENTIAL"). */
export function Stele({
  position,
  rotationY = 0,
  width = 1.2,
  height = 1.9,
  depth = 0.46,
  lines = ["BETTER", "PEOPLE", "HIGHER", "POTENTIAL"],
}: SteleProps) {
  const geometry = useMemo(() => {
    const shape = new THREE.Shape();
    const w = width / 2;
    shape.moveTo(-w, 0);
    shape.lineTo(w, 0);
    shape.lineTo(w, height - w);
    shape.absarc(0, height - w, w, 0, Math.PI, false);
    shape.lineTo(-w, 0);
    const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: 24 });
    g.translate(0, 0, -depth / 2);
    g.computeVertexNormals();
    return g;
  }, [width, height, depth]);

  return (
    <group position={position} rotation-y={rotationY}>
      <mesh geometry={geometry} material={MATERIALS.stone} castShadow receiveShadow />
      <WallType lines={lines} position={[-width / 2 + 0.12, height - 0.42, depth / 2 + 0.004]} size={0.1} />
    </group>
  );
}

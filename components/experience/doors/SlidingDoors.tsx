"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { beatEased } from "@/lib/experience/timeline";
import { frame } from "@/lib/experience/store";
import { WORLD } from "@/lib/experience/world";
import { Block } from "../architecture/primitives";
import { MATERIALS } from "../materials";

const { doorWidth, doorHeight } = WORLD.facade;
const LEAF_W = doorWidth / 2 + 0.02;
const LEAF_H = doorHeight - 0.03;
const TRAVEL = doorWidth / 2 - 0.04;
const RAIL = 0.055;

function DoorLeaf({ side }: { side: -1 | 1 }) {
  // Handle sits on the meeting edge (towards the centre line).
  const handleX = -side * (LEAF_W / 2 - 0.14);
  return (
    <group>
      <mesh material={MATERIALS.doorGlass} position={[0, LEAF_H / 2, 0]} renderOrder={3}>
        <boxGeometry args={[LEAF_W - RAIL, LEAF_H - RAIL, 0.018]} />
      </mesh>
      {/* Brushed steel frame */}
      <Block material={MATERIALS.steel} position={[0, LEAF_H - RAIL / 2, 0]} size={[LEAF_W, RAIL, 0.045]} castShadow={false} />
      <Block material={MATERIALS.steel} position={[0, RAIL, 0]} size={[LEAF_W, RAIL * 2, 0.045]} castShadow={false} />
      <Block material={MATERIALS.steel} position={[-LEAF_W / 2 + RAIL / 2, LEAF_H / 2, 0]} size={[RAIL, LEAF_H, 0.045]} castShadow={false} />
      <Block material={MATERIALS.steel} position={[LEAF_W / 2 - RAIL / 2, LEAF_H / 2, 0]} size={[RAIL, LEAF_H, 0.045]} castShadow={false} />
      {/* Vertical pull bar on both faces */}
      {[1, -1].map((face) => (
        <group key={face} position={[handleX, 1.15, face * 0.075]}>
          <mesh material={MATERIALS.steel} position={[0, 0.7, 0]}>
            <cylinderGeometry args={[0.018, 0.018, 1.4, 16]} />
          </mesh>
          <Block material={MATERIALS.steel} position={[0, 0.12, -face * 0.03]} size={[0.024, 0.024, 0.06]} castShadow={false} />
          <Block material={MATERIALS.steel} position={[0, 1.28, -face * 0.03]} size={[0.024, 0.024, 0.06]} castShadow={false} />
        </group>
      ))}
    </group>
  );
}

/**
 * Automatic sliding doors. Leaf travel is bound 1:1 to the "doors" beat,
 * so scrolling back closes them exactly as they opened.
 */
export function SlidingDoors({ z = 0.09 }: { z?: number }) {
  const left = useRef<THREE.Group>(null);
  const right = useRef<THREE.Group>(null);

  useFrame(() => {
    const t = beatEased(frame.progress, "doors");
    if (left.current) left.current.position.x = -LEAF_W / 2 - t * TRAVEL;
    if (right.current) right.current.position.x = LEAF_W / 2 + t * TRAVEL;
  });

  return (
    <group position-z={z} name="sliding-doors">
      <group ref={left} position-x={-LEAF_W / 2}>
        <DoorLeaf side={-1} />
      </group>
      <group ref={right} position-x={LEAF_W / 2}>
        <DoorLeaf side={1} />
      </group>
      {/* Floor track and head track */}
      <Block material={MATERIALS.steelDark} position={[0, 0.004, 0]} size={[doorWidth * 2, 0.008, 0.16]} castShadow={false} />
      <Block material={MATERIALS.steel} position={[0, doorHeight + 0.09, 0]} size={[doorWidth * 2 + 0.2, 0.18, 0.2]} />
    </group>
  );
}

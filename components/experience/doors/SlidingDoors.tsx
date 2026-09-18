"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { frame } from "@/lib/experience/store";
import { beatEased } from "@/lib/experience/timeline";
import { WORLD } from "@/lib/experience/world";
import { Block } from "../architecture/primitives";
import { MATERIALS } from "../materials";

const F = WORLD.facade;
const LEAF_W = F.halfOpening;
const LEAF_H = F.doorHeight - 0.02;
const TRAVEL = F.halfOpening - 0.05;
const RAIL = 0.05;

function DoorLeaf({ side }: { side: -1 | 1 }) {
  // Pull bar on the meeting edge (towards the centre line), both faces.
  const handleX = -side * (LEAF_W / 2 - 0.16);
  return (
    <group>
      <mesh material={MATERIALS.doorGlass} position={[0, LEAF_H / 2, 0]} renderOrder={4} castShadow={false}>
        <boxGeometry args={[LEAF_W - RAIL, LEAF_H - RAIL, 0.016]} />
      </mesh>
      <Block material={MATERIALS.steel} position={[0, LEAF_H - RAIL / 2, 0]} size={[LEAF_W, RAIL, 0.05]} castShadow={false} />
      <Block material={MATERIALS.steel} position={[0, RAIL, 0]} size={[LEAF_W, RAIL * 2, 0.05]} castShadow={false} />
      <Block material={MATERIALS.steel} position={[-LEAF_W / 2 + RAIL / 2, LEAF_H / 2, 0]} size={[RAIL, LEAF_H, 0.05]} castShadow={false} />
      <Block material={MATERIALS.steel} position={[LEAF_W / 2 - RAIL / 2, LEAF_H / 2, 0]} size={[RAIL, LEAF_H, 0.05]} castShadow={false} />
      {[1, -1].map((face) => (
        <group key={face} position={[handleX, 1.1, face * 0.08]}>
          <mesh material={MATERIALS.steel}>
            <cylinderGeometry args={[0.017, 0.017, 1.35, 16]} />
          </mesh>
          {[-0.62, 0.62].map((y) => (
            <Block key={y} material={MATERIALS.steel} position={[0, y, -face * 0.035]} size={[0.022, 0.022, 0.07]} castShadow={false} />
          ))}
        </group>
      ))}
    </group>
  );
}

/**
 * Automatic sliding doors, bound 1:1 to the "doors" beat (scrolling back closes them).
 * The leaves sit just behind the frame plane and slide into the side panels.
 */
export function SlidingDoors({ z = 0 }: { z?: number }) {
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
      {/* Head rail */}
      <Block material={MATERIALS.steel} position={[0, F.doorHeight + 0.06, 0.02]} size={[F.halfOpening * 2 + 0.3, 0.12, 0.22]} />
    </group>
  );
}

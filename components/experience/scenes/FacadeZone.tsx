"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { frame } from "@/lib/experience/store";
import { beat } from "@/lib/experience/timeline";
import { WORLD } from "@/lib/experience/world";
import { Block, InstancedBoxes, type BoxInstance } from "../architecture/primitives";
import { LogoMesh } from "../architecture/LogoMesh";
import { WallType } from "../architecture/WallType";
import { SlidingDoors } from "../doors/SlidingDoors";
import { MATERIALS } from "../materials";
import { Planter, Tree } from "../vegetation/Plants";

const F = WORLD.facade;
const GLASS_Z = -0.12;
const MULLION = 0.12;
const MULLION_DEPTH = 0.2;
const WING_END = WORLD.lobby.halfWidth;
const pillarX = (F.pillar.inner + F.pillar.outer) / 2;
const pillarW = F.pillar.outer - F.pillar.inner;
const pillarZ = F.pillar.front - F.pillar.depth / 2;

function useMullions(): BoxInstance[] {
  return useMemo(() => {
    const items: BoxInstance[] = [];
    const v = (x: number, y0: number, y1: number, z = GLASS_Z) =>
      items.push({ position: [x, (y0 + y1) / 2, z], size: [MULLION, y1 - y0, MULLION_DEPTH] });
    const h = (x0: number, x1: number, y: number, z = GLASS_Z, t = MULLION) =>
      items.push({ position: [(x0 + x1) / 2, y, z], size: [x1 - x0, t, MULLION_DEPTH] });

    // Entrance bay
    const hw = F.doorWidth / 2;
    for (const s of [-1, 1]) {
      v(s * hw, 0, F.glassHeight);
      v(s * (F.pillar.inner - MULLION / 2), 0, F.glassHeight);
      v(s * ((hw + F.pillar.inner) / 2), F.doorHeight, F.glassHeight);
    }
    v(0, F.doorHeight, F.glassHeight);
    h(-F.pillar.inner, F.pillar.inner, F.doorHeight + 0.1, GLASS_Z, 0.2);
    h(-F.pillar.inner, F.pillar.inner, F.transomY);
    h(-F.pillar.inner, F.pillar.inner, F.glassHeight);

    // Wings, set back behind the pillars
    const wz = -0.4;
    for (const s of [-1, 1]) {
      for (let x = F.pillar.outer + 1.6; x < WING_END; x += 1.6) v(s * x, 0, F.glassHeight, wz);
      h(s * F.pillar.outer, s * WING_END, 3.4, wz);
      h(s * F.pillar.outer, s * WING_END, F.transomY, wz);
      h(s * F.pillar.outer, s * WING_END, 0.06, wz, 0.12);
    }
    return items;
  }, []);
}

function GlassWall() {
  const mullions = useMullions();
  const hw = F.doorWidth / 2;
  const sideW = F.pillar.inner - hw;
  const wingW = WING_END - F.pillar.outer;
  return (
    <group name="glass-wall">
      {/* Fixed side lights beside the doors */}
      {[-1, 1].map((s) => (
        <mesh key={s} material={MATERIALS.glass} position={[s * (hw + sideW / 2), F.doorHeight / 2, GLASS_Z]} renderOrder={3}>
          <planeGeometry args={[sideW, F.doorHeight]} />
        </mesh>
      ))}
      {/* Upper glazing */}
      <mesh material={MATERIALS.glass} position={[0, (F.doorHeight + F.glassHeight) / 2, GLASS_Z]} renderOrder={3}>
        <planeGeometry args={[F.pillar.inner * 2, F.glassHeight - F.doorHeight]} />
      </mesh>
      {/* Wings */}
      {[-1, 1].map((s) => (
        <mesh key={`w${s}`} material={MATERIALS.glass} position={[s * (F.pillar.outer + wingW / 2), F.glassHeight / 2, -0.4]} renderOrder={3}>
          <planeGeometry args={[wingW, F.glassHeight]} />
        </mesh>
      ))}
      <InstancedBoxes items={mullions} material={MATERIALS.steel} castShadow />
    </group>
  );
}

function Pillars() {
  return (
    <group name="pillars">
      {[-1, 1].map((s) => (
        <Block key={s} material={MATERIALS.plaster} position={[s * pillarX, F.pillar.height / 2, pillarZ]} size={[pillarW, F.pillar.height, F.pillar.depth]} />
      ))}
      {/* Upper fascia tying the pillars together */}
      <Block
        material={MATERIALS.plaster}
        position={[0, (F.glassHeight + F.pillar.height) / 2, pillarZ]}
        size={[F.pillar.outer * 2, F.pillar.height - F.glassHeight, F.pillar.depth]}
      />
      {/* Building mass above and beside the wings */}
      <Block material={MATERIALS.plaster} position={[0, (F.glassHeight + 12) / 2, -1.2]} size={[WING_END * 2 + 2, 12 - F.glassHeight, 1.6]} />
      {[-1, 1].map((s) => (
        <Block key={`end${s}`} material={MATERIALS.plaster} position={[s * (WING_END + 0.8), 6, -0.2]} size={[1.6, 12, 2.4]} />
      ))}

      <WallType
        lines={["AUTOMATISER", "SIMPLIFIER", "ACCÉLÉRER", "GRANDIR"]}
        position={[-pillarX - 0.55, 5.35, F.pillar.front + 0.005]}
        size={0.14}
      />
      <WallType lines={["HUMAN", "IDEAS", "AI IMPACT"]} position={[pillarX - 0.5, 5.55, F.pillar.front + 0.005]} size={0.15} />
    </group>
  );
}

function Sign() {
  const s = F.sign;
  const cy = s.bottom + s.height / 2;
  return (
    <group name="sign" position={[0, cy, 0]}>
      {/* Backlit halo */}
      <mesh material={MATERIALS.coolLight} position={[0, 0, 0.02]}>
        <planeGeometry args={[s.width + 0.08, s.height + 0.08]} />
      </mesh>
      <Block material={MATERIALS.signFace} position={[0, 0, 0.04 + s.depth / 2]} size={[s.width, s.height, s.depth]} castShadow={false} />
      <group position={[0, 0.02, 0.04 + s.depth + 0.05]}>
        <LogoMesh width={s.logoWidth} depth={0.05} material={MATERIALS.logo} />
      </group>
    </group>
  );
}

function Pool() {
  const rim = useMemo(() => {
    const pts = [
      new THREE.Vector2(3.92, 0),
      new THREE.Vector2(3.92, 0.22),
      new THREE.Vector2(3.98, 0.26),
      new THREE.Vector2(4.18, 0.26),
      new THREE.Vector2(4.22, 0.22),
      new THREE.Vector2(4.22, 0),
    ];
    return new THREE.LatheGeometry(pts, 96);
  }, []);
  return (
    <group name="pool" position={[-7.3, 0, 10.4]}>
      <mesh geometry={rim} material={MATERIALS.stone} castShadow receiveShadow />
      <mesh material={MATERIALS.water} rotation-x={-Math.PI / 2} position-y={0.17} renderOrder={2}>
        <circleGeometry args={[3.92, 96]} />
      </mesh>
      <mesh material={MATERIALS.plasterWarm} rotation-x={-Math.PI / 2} position-y={0.02} receiveShadow>
        <circleGeometry args={[3.92, 64]} />
      </mesh>
    </group>
  );
}

function Monolith({ position, rotationY }: { position: [number, number, number]; rotationY: number }) {
  return (
    <group position={position} rotation-y={rotationY}>
      <Block material={MATERIALS.stone} position={[0, 0.85, 0]} size={[1.2, 1.7, 0.5]} />
      <WallType lines={["BETTER", "PEOPLE", "HIGHER", "POTENTIAL"]} position={[-0.42, 1.44, 0.252]} size={0.1} />
    </group>
  );
}

function WelcomeBlock() {
  return (
    <group position={[-3.42, 0, 6.3]} rotation-y={0.08}>
      <Block material={MATERIALS.stone} position={[0, 0.52, 0]} size={[1.15, 1.04, 1.15]} />
      <WallType lines={["BONJOUR", "BIENVENUE", "CHEZ D2S STUDIO"]} position={[-0.44, 0.84, 0.577]} size={0.058} />
      <Planter position={[0, 1.04, 0]} radius={0.44} potHeight={0.02} foliage={1.2} seed={21} />
    </group>
  );
}

/**
 * Exterior + façade. Everything here is fully 3D; the plaza side is hidden once
 * the camera is well inside the lobby (saves draw calls, no visual change).
 */
export function FacadeZone() {
  const exterior = useRef<THREE.Group>(null);

  useFrame(() => {
    if (exterior.current) exterior.current.visible = beat(frame.progress, "exteriorFade") < 1;
  });

  return (
    <group name="zone-facade">
      <GlassWall />
      <Pillars />
      <Sign />
      <SlidingDoors z={0.12} />

      <group ref={exterior} name="plaza">
        <Pool />
        <Monolith position={[3.15, 0, 5.2]} rotationY={-0.1} />
        <WelcomeBlock />

        <Planter position={[-2.25, 0, 1.3]} radius={0.42} potHeight={0.78} foliage={1.2} seed={1} />
        <Planter position={[2.25, 0, 1.3]} radius={0.42} potHeight={0.78} foliage={1.2} seed={2} />
        <Planter position={[-5.9, 0, 2.3]} radius={0.52} potHeight={0.95} foliage={1.6} seed={3} />
        <Planter position={[5.95, 0, 2.2]} radius={0.52} potHeight={0.95} foliage={1.6} seed={4} />
        <Planter position={[2.1, 0, 3.5]} radius={0.36} potHeight={0.7} foliage={1.0} seed={5} />
        <Planter position={[-6.9, 0, 5.3]} radius={0.7} potHeight={0.7} foliage={1.5} square seed={6} />
        <Planter position={[4.6, 0, 7.6]} radius={0.5} potHeight={0.8} foliage={2.4} seed={7} />

        <Tree position={[-8.2, 0, 3.2]} height={6.4} spread={2.1} seed={1} />
        <Tree position={[-8.8, 0, 5.4]} height={6.2} spread={2.2} seed={9} />
        <Tree position={[8.6, 0, 3.6]} height={6.0} spread={2.0} seed={2} />
        <Tree position={[-11.8, 0, 7.4]} height={7.2} spread={2.4} seed={3} />
        <Tree position={[12.2, 0, 8.2]} height={7.6} spread={2.5} seed={4} />
        <Tree position={[-16, 0, 2.2]} height={8} spread={2.8} seed={5} />
        <Tree position={[16.5, 0, 2.8]} height={8.2} spread={2.8} seed={6} />
        <Tree position={[-21, 0, 12]} height={9} spread={3.2} seed={7} />
        <Tree position={[22, 0, 13]} height={9} spread={3.2} seed={8} />
      </group>
    </group>
  );
}

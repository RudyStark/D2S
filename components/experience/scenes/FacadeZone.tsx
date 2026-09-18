"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { frame } from "@/lib/experience/store";
import { beat } from "@/lib/experience/timeline";
import { WORLD } from "@/lib/experience/world";
import { LogoMesh } from "../architecture/LogoMesh";
import { Stele } from "../architecture/Stele";
import { Block, InstancedBoxes, type BoxInstance } from "../architecture/primitives";
import { WallType } from "../architecture/WallType";
import { SlidingDoors } from "../doors/SlidingDoors";
import { MATERIALS } from "../materials";
import { Planter, Plant } from "../vegetation/Plants";
import { WaterSurface } from "../water/WaterSurface";

const F = WORLD.facade;
const P = WORLD.pool;
const GLASS_Z = -0.06;
const POST_X = F.halfOpening + F.post.width / 2;
const POST_Z = F.post.front + F.post.depth / 2;
const PILLAR_Z = F.pillar.front - F.pillar.depth / 2;

/** Entrance bay: steel posts, head transom, glass above, and the backlit sign. */
function EntranceBay() {
  const s = F.sign;
  const signY = s.bottom + s.height / 2;
  const signFront = s.depth;

  // Soft light spill around the backlit panel (radial alpha, additive).
  const signHalo = useMemo(() => {
    const size = 256;
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext("2d")!;
    const g = ctx.createRadialGradient(size / 2, size / 2, size * 0.18, size / 2, size / 2, size / 2);
    g.addColorStop(0, "rgba(255,248,236,0.55)");
    g.addColorStop(0.55, "rgba(255,246,232,0.18)");
    g.addColorStop(1, "rgba(255,246,232,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    const map = new THREE.CanvasTexture(canvas);
    return new THREE.MeshBasicMaterial({ map, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
  }, []);

  const signShape = useMemo(() => {
    const shape = new THREE.Shape();
    const w = s.width / 2;
    const h = s.height / 2;
    const r = s.radius;
    shape.moveTo(-w + r, -h);
    shape.lineTo(w - r, -h);
    shape.quadraticCurveTo(w, -h, w, -h + r);
    shape.lineTo(w, h - r);
    shape.quadraticCurveTo(w, h, w - r, h);
    shape.lineTo(-w + r, h);
    shape.quadraticCurveTo(-w, h, -w, h - r);
    shape.lineTo(-w, -h + r);
    shape.quadraticCurveTo(-w, -h, -w + r, -h);
    const geo = new THREE.ExtrudeGeometry(shape, { depth: s.depth, bevelEnabled: true, bevelSize: 0.012, bevelThickness: 0.012, bevelSegments: 2, curveSegments: 12 });
    geo.computeVertexNormals();
    return geo;
  }, [s.width, s.height, s.radius, s.depth]);

  return (
    <group name="entrance-bay">
      {/* Glass above the transom */}
      <mesh material={MATERIALS.glass} position={[0, (F.transom.top + F.glassHeight) / 2, GLASS_Z]} renderOrder={3}>
        <planeGeometry args={[F.halfOpening * 2 + F.post.width * 2, F.glassHeight - F.transom.top]} />
      </mesh>

      {/* Steel posts and head transom */}
      {[-1, 1].map((side) => (
        <Block
          key={side}
          material={MATERIALS.steel}
          position={[side * POST_X, F.glassHeight / 2, POST_Z - 0.1]}
          size={[F.post.width, F.glassHeight, F.post.depth]}
        />
      ))}
      <Block
        material={MATERIALS.steel}
        position={[0, (F.transom.bottom + F.transom.top) / 2, POST_Z - 0.16]}
        size={[F.halfOpening * 2 + F.post.width * 2, F.transom.top - F.transom.bottom, F.post.depth]}
      />
      {/* Floor threshold */}
      <Block material={MATERIALS.steelDark} position={[0, 0.005, 0]} size={[F.halfOpening * 2, 0.01, 0.34]} castShadow={false} />

      {/* Backlit sign box */}
      <group position={[0, signY, s.front]}>
        <mesh material={signHalo} position={[0, 0, -0.02]} renderOrder={1}>
          <planeGeometry args={[s.width + 1.1, s.height + 1.1]} />
        </mesh>
        <mesh geometry={signShape} material={MATERIALS.signFace} castShadow={false} receiveShadow />
        <group position={[0, -0.09, signFront + 0.04]}>
          <LogoMesh width={s.logoWidth} depth={0.055} scaleY={s.logoScaleY} material={MATERIALS.logo} />
        </group>
      </group>
    </group>
  );
}

/** Piers, glazed wings and the white panels that carry the engraved type. */
function Envelope() {
  const mullions = useMemo(() => {
    const items: BoxInstance[] = [];
    const wz = -0.4;
    const v = (x: number, y0: number, y1: number, z: number) => items.push({ position: [x, (y0 + y1) / 2, z], size: [0.1, y1 - y0, 0.18] });
    const h = (x0: number, x1: number, y: number, z: number, t = 0.1) => items.push({ position: [(x0 + x1) / 2, y, z], size: [x1 - x0, t, 0.18] });
    for (const s of [-1, 1]) {
      const inner = s < 0 ? F.leftPillar.from : F.rightPillar.to;
      for (let x = Math.abs(inner) + 1.7; x < F.wingEnd; x += 1.7) v(s * x, 0, F.glassHeight, wz);
      h(s * Math.abs(inner), s * F.wingEnd, 3.5, wz);
      h(s * Math.abs(inner), s * F.wingEnd, F.glassHeight - 0.05, wz, 0.14);
      h(s * Math.abs(inner), s * F.wingEnd, 0.07, wz, 0.14);
    }
    // Panel / glass joints beside the entrance
    v(F.leftPanel.from, 0, F.glassHeight, GLASS_Z);
    v(F.leftPanel.to, F.leftPanel.height, F.glassHeight, GLASS_Z);
    v(F.rightGlass.from, 0, F.glassHeight, GLASS_Z);
    v(F.rightGlass.to, 0, F.glassHeight, GLASS_Z);
    h(F.leftPanel.from, F.leftPanel.to, F.leftPanel.height, GLASS_Z);
    return items;
  }, []);

  const leftPanelW = F.leftPanel.to - F.leftPanel.from;
  const rightGlassW = F.rightGlass.to - F.rightGlass.from;

  return (
    <group name="envelope">
      {/* Piers */}
      <Block
        material={MATERIALS.plaster}
        position={[(F.leftPillar.from + F.leftPillar.to) / 2, F.pillar.height / 2, PILLAR_Z]}
        size={[F.leftPillar.to - F.leftPillar.from, F.pillar.height, F.pillar.depth]}
      />
      <Block
        material={MATERIALS.plaster}
        position={[(F.rightPillar.from + F.rightPillar.to) / 2, F.pillar.height / 2, PILLAR_Z]}
        size={[F.rightPillar.to - F.rightPillar.from, F.pillar.height, F.pillar.depth]}
      />

      {/* White panel with the engraved words, glass above it */}
      <Block
        material={MATERIALS.plaster}
        position={[(F.leftPanel.from + F.leftPanel.to) / 2, F.leftPanel.height / 2, 0.02]}
        size={[leftPanelW, F.leftPanel.height, 0.42]}
      />
      <mesh material={MATERIALS.glass} position={[(F.leftPanel.from + F.leftPanel.to) / 2, (F.leftPanel.height + F.glassHeight) / 2, GLASS_Z]} renderOrder={3}>
        <planeGeometry args={[leftPanelW, F.glassHeight - F.leftPanel.height]} />
      </mesh>
      <mesh material={MATERIALS.glass} position={[(F.rightGlass.from + F.rightGlass.to) / 2, F.glassHeight / 2, GLASS_Z]} renderOrder={3}>
        <planeGeometry args={[rightGlassW, F.glassHeight]} />
      </mesh>

      {/* Glazed wings */}
      {[-1, 1].map((s) => {
        const inner = s < 0 ? -F.leftPillar.from : F.rightPillar.to;
        const w = F.wingEnd - inner;
        return (
          <mesh key={s} material={MATERIALS.glass} position={[s * (inner + w / 2), F.glassHeight / 2, -0.4]} renderOrder={3}>
            <planeGeometry args={[w, F.glassHeight]} />
          </mesh>
        );
      })}
      <InstancedBoxes items={mullions} material={MATERIALS.steel} castShadow />

      {/* Building mass above the glazing */}
      <Block material={MATERIALS.plaster} position={[0, (F.glassHeight + F.parapet) / 2, -0.9]} size={[F.wingEnd * 2 + 1.6, F.parapet - F.glassHeight, 1.8]} />
      {[-1, 1].map((s) => (
        <Block key={`end${s}`} material={MATERIALS.plaster} position={[s * (F.wingEnd + 0.8), F.parapet / 2, -0.2]} size={[1.6, F.parapet, 2.6]} />
      ))}

      <WallType
        lines={["AUTOMATISER", "SIMPLIFIER", "ACCÉLÉRER", "GRANDIR"]}
        position={[-3.17, 3.88, 0.235]}
        size={0.135}
      />
      <WallType lines={["HUMAN", "IDEAS", "AI IMPACT"]} position={[2.78, 4.14, F.pillar.front + 0.005]} size={0.108} />
    </group>
  );
}

/** Circular basin: closed geometry (outer wall, coping, inner wall, floor) + live water. */
function Pool() {
  const profile = useMemo(
    () =>
      [
        [0, 0.015],
        [P.innerR, 0.015],
        [P.innerR, P.rim - 0.03],
        [P.innerR + 0.08, P.rim],
        [P.outerR - 0.08, P.rim],
        [P.outerR, P.rim - 0.03],
        [P.outerR, 0],
      ].map(([x, y]) => new THREE.Vector2(x, y)),
    [],
  );
  const geometry = useMemo(() => new THREE.LatheGeometry(profile, 160), [profile]);
  const material = useMemo(() => {
    const m = MATERIALS.stone.clone();
    m.side = THREE.DoubleSide;
    return m;
  }, []);

  return (
    <group name="pool" position={[P.center[0], 0, P.center[1]]}>
      <mesh geometry={geometry} material={material} castShadow receiveShadow />
      <WaterSurface radius={P.innerR - 0.02} y={P.water} />
    </group>
  );
}

function WelcomeBlock() {
  return (
    <group position={[-3.52, 0, 0.55]} rotation-y={0.06}>
      <Block material={MATERIALS.stone} position={[0, 0.52, 0]} size={[1.15, 1.04, 1.1]} />
      <WallType lines={["BONJOUR", "BIENVENUE", "CHEZ D2S STUDIO"]} position={[-0.46, 0.86, 0.556]} size={0.058} dash={false} />
      <Plant kind="shrub" position={[0, 1.04, 0]} height={0.55} seed={21} />
    </group>
  );
}

/**
 * Exterior + façade, reconstructed from 01/02-home references.
 * The plaza is hidden once the camera is well inside the lobby (draw calls, no visual change).
 */
export function FacadeZone() {
  const exterior = useRef<THREE.Group>(null);

  useFrame(() => {
    if (exterior.current) exterior.current.visible = beat(frame.progress, "exteriorFade") < 1;
  });

  return (
    <group name="zone-facade">
      <Envelope />
      <EntranceBay />
      <SlidingDoors />

      <group ref={exterior} name="plaza">
        <Pool />
        <Stele position={[3.9, 0, 0.9]} rotationY={-0.14} />
        <WelcomeBlock />

        {/* Planters along the façade */}
        <Planter position={[-2.86, 0, 1.55]} kind="tropical" radius={0.42} potHeight={0.78} plantHeight={1.15} seed={3} />
        <Planter position={[2.86, 0, 1.55]} kind="tropical" radius={0.42} potHeight={0.78} plantHeight={1.2} seed={4} />
        <Planter position={[2.25, 0, 3.5]} kind="ficus" radius={0.5} potHeight={0.88} plantHeight={1.9} seed={5} />
        <Planter position={[-4.75, 0, 3.3]} kind="shrub" radius={0.62} potHeight={0.62} plantHeight={0.7} square seed={6} />
        <Planter position={[4.9, 0, 4.2]} kind="pachira_a" radius={0.55} potHeight={0.8} plantHeight={2.1} seed={7} />

        {/* Garden */}
        <Plant kind="olive_a" position={[-7.4, 0, 4.6]} height={6.2} seed={11} />
        <Plant kind="olive_b" position={[-9.8, 0, 8.4]} height={5.2} seed={12} />
        <Plant kind="olive_c" position={[8.6, 0, 5.4]} height={5.6} seed={13} />
        <Plant kind="olive_a" position={[12.4, 0, 9.2]} height={6.6} seed={14} />
        <Plant kind="olive_b" position={[-13.5, 0, 2.4]} height={5.8} seed={15} />
        <Plant kind="olive_c" position={[15.5, 0, 2.2]} height={6} seed={16} />
        <Plant kind="shrub" position={[-3.5, 0, 6.6]} height={0.5} seed={17} />
        <Plant kind="shrub" position={[3.1, 0, 8.4]} height={0.45} seed={18} />
        <Plant kind="shrub" position={[6.8, 0, 6.9]} height={0.55} seed={19} />
      </group>
    </group>
  );
}

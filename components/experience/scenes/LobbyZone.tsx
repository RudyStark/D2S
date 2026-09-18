"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { WORLD } from "@/lib/experience/world";
import { Block, FloorBlock, InstancedBoxes, useArcGeometry, type BoxInstance } from "../architecture/primitives";
import { LogoMesh } from "../architecture/LogoMesh";
import { Stele } from "../architecture/Stele";
import { WallType } from "../architecture/WallType";
import { MATERIALS } from "../materials";
import { Sofa, CoffeeTable } from "../furniture/Lounge";
import { Plant, Planter } from "../vegetation/Plants";

const L = WORLD.lobby;
const HW = L.halfWidth;
const BACK = -L.depth;
const SLAB_TOP = 8.6;

function Shell() {
  const spots = useMemo(() => {
    const items: BoxInstance[] = [];
    for (let z = -2.5; z > BACK + 1; z -= 3.2) {
      for (const x of [-10.5, -4.2, 4.2, 10.5]) {
        if (Math.hypot(x, z - L.drum.centerZ) < 5) continue;
        items.push({ position: [x, L.ceiling - 0.01, z], size: [0.22, 0.02, 0.22] });
      }
    }
    return items;
  }, []);

  const sideMullions = useMemo(() => {
    const items: BoxInstance[] = [];
    for (const s of [-1, 1]) {
      for (let z = -1.2; z > BACK; z -= 2.4) items.push({ position: [s * HW, L.ceiling / 2, z], size: [0.2, L.ceiling, 0.1] });
      items.push({ position: [s * HW, 3.2, BACK / 2], size: [0.2, 0.1, -BACK] });
    }
    return items;
  }, []);

  const coves = useMemo<BoxInstance[]>(
    () => [
      { position: [-HW + 0.7, L.ceiling - 0.05, BACK / 2], size: [0.16, 0.06, -BACK - 1] },
      { position: [HW - 0.7, L.ceiling - 0.05, BACK / 2], size: [0.16, 0.06, -BACK - 1] },
      { position: [-4.6, L.ceiling - 0.05, -7.5], size: [0.14, 0.06, 9] },
      { position: [4.6, L.ceiling - 0.05, -7.5], size: [0.14, 0.06, 9] },
      { position: [0, L.ceiling - 0.05, -1.4], size: [HW * 2 - 2.4, 0.06, 0.16] },
    ],
    [],
  );

  return (
    <group name="lobby-shell">
      {/* Ceiling slab (casts the sun's shadow: sunlight only reaches the first metres) */}
      <Block material={MATERIALS.ceiling} position={[0, (L.ceiling + SLAB_TOP) / 2, (BACK - 0.5) / 2]} size={[HW * 2, SLAB_TOP - L.ceiling, -BACK - 0.5]} castShadow receiveShadow={false} />
      {/* Glazed side walls onto the garden: daylight reaches deep into the lobby. */}
      {[-1, 1].map((s) => (
        <group key={s}>
          <mesh material={MATERIALS.glass} position={[s * HW, L.ceiling / 2, BACK / 2 - 0.6]} rotation-y={Math.PI / 2} renderOrder={3}>
            <planeGeometry args={[-BACK - 1.2, L.ceiling]} />
          </mesh>
          <Block material={MATERIALS.plasterWarm} position={[s * HW, 0.06, BACK / 2]} size={[0.3, 0.12, -BACK]} castShadow={false} />
        </group>
      ))}
      <InstancedBoxes items={sideMullions} material={MATERIALS.steel} castShadow />
      <Block material={MATERIALS.plasterWarm} position={[0, L.ceiling / 2, BACK - 0.2]} size={[HW * 2, L.ceiling, 0.4]} />
      <InstancedBoxes items={spots} material={MATERIALS.coolLight} />
      <InstancedBoxes items={coves} material={MATERIALS.coveLight} />
    </group>
  );
}

function Columns() {
  return (
    <group name="lobby-columns">
      {[-1, 1].map((s) => (
        <group key={s}>
          <FloorBlock material={MATERIALS.plaster} position={[s * 8.4, 0, -6.8]} size={[1.0, L.ceiling, 0.9]} />
          <FloorBlock material={MATERIALS.plaster} position={[s * 8.2, 0, -15.4]} size={[2.3, L.ceiling, 0.9]} />
          <FloorBlock material={MATERIALS.plaster} position={[s * 8.4, 0, -24]} size={[1.0, L.ceiling, 0.9]} />
        </group>
      ))}
      {/* Engraved pilasters, as in design/references/04-lobby-clean.png */}
      <WallType lines={["AUTOMATISER", "SIMPLIFIER", "ACCÉLÉRER", "GRANDIR"]} position={[-8.95, 5.35, -14.945]} size={0.15} />
      <WallType lines={["HUMAN", "IDEAS", "AI IMPACT"]} position={[7.55, 5.55, -14.945]} size={0.18} />
    </group>
  );
}

function Reception() {
  const { desk, drum } = L;
  const body = useArcGeometry(desk.innerR, desk.outerR, desk.halfAngle, desk.height - 0.1);
  const plinth = useArcGeometry(desk.innerR + 0.12, desk.outerR - 0.12, desk.halfAngle - 0.015, 0.1);
  const top = useArcGeometry(desk.innerR - 0.07, desk.outerR + 0.06, desk.halfAngle + 0.014, 0.05);
  const glow = useArcGeometry(desk.outerR - 0.12, desk.outerR + 0.005, desk.halfAngle - 0.01, 0.05);
  const spill = useArcGeometry(desk.outerR - 0.1, desk.outerR + 1.5, desk.halfAngle + 0.03, 0.004);
  const reveal = useArcGeometry(desk.innerR - 0.02, desk.outerR + 0.02, desk.halfAngle + 0.006, 0.05);
  const platform = useArcGeometry(drum.radius, desk.innerR, desk.halfAngle + 0.25, 0.45);
  const drumFront = drum.centerZ + drum.radius;
  const floorGlow = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: "#ffcf9a",
        transparent: true,
        opacity: 0.5,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      }),
    [],
  );

  return (
    <group name="reception">
      {/* Feature drum */}
      <mesh material={MATERIALS.lacquer} position={[0, drum.height / 2, drum.centerZ]} castShadow receiveShadow>
        <cylinderGeometry args={[drum.radius, drum.radius, drum.height, 96]} />
      </mesh>
      {/* Ceiling recess + warm cove around the drum */}
      <mesh material={MATERIALS.plasterWarm} position={[0, L.ceiling - 0.14, drum.centerZ]} rotation-x={Math.PI / 2}>
        <torusGeometry args={[drum.radius + 0.62, 0.3, 8, 96]} />
      </mesh>
      <mesh material={MATERIALS.coveLight} position={[0, L.ceiling - 0.1, drum.centerZ]} rotation-x={Math.PI / 2}>
        <torusGeometry args={[drum.radius + 0.34, 0.055, 10, 128]} />
      </mesh>
      <group position={[0, 5.72, drumFront + 0.05]}>
        <LogoMesh width={2.05} depth={0.05} bendRadius={drum.radius + 0.05} material={MATERIALS.logo} />
      </group>
      {/* Curved type: position is the drum axis, the geometry wraps at curveRadius. */}
      <WallType
        lines={["DES AGENTS IA", "POUR UN MONDE", "PLUS AMBITIEUX."]}
        position={[0, 5.02, drum.centerZ]}
        size={0.16}
        align="center"
        dash={false}
        curveRadius={drum.radius + 0.012}
      />

      {/* Curved desk */}
      <group position={[0, 0, desk.centerZ]}>
        {/* White lacquer shell on a recessed, back-lit plinth */}
        <mesh geometry={body} material={MATERIALS.lacquer} position-y={0.1} castShadow receiveShadow />
        <mesh geometry={plinth} material={MATERIALS.plasterWarm} receiveShadow />
        <mesh geometry={reveal} material={MATERIALS.steelDark} position-y={desk.height - 0.055} />
        <mesh geometry={top} material={MATERIALS.stone} position-y={desk.height} castShadow receiveShadow />
        {/* Warm light line under the counter and its spill on the floor */}
        <mesh geometry={glow} material={MATERIALS.coveLight} position-y={0.04} />
        <mesh geometry={spill} material={floorGlow} position-y={0.002} renderOrder={1} />
      </group>

      {/* Laptop, lid facing the visitor */}
      <group position={[0.62, desk.height + 0.045, desk.centerZ + desk.innerR + 0.18]} rotation-y={0.12}>
        <Block material={MATERIALS.steel} position={[0, 0.008, 0]} size={[0.36, 0.016, 0.25]} castShadow={false} />
        <group position={[0, 0.016, 0.12]} rotation-x={0.28}>
          <Block material={MATERIALS.steel} position={[0, 0.12, 0]} size={[0.36, 0.24, 0.012]} castShadow={false} />
        </group>
      </group>
      <Block material={MATERIALS.steelDark} position={[-0.9, desk.height + 0.145, desk.centerZ + desk.innerR + 0.2]} size={[0.14, 0.2, 0.1]} castShadow={false} />
      {/* Raised floor behind the desk */}
      <mesh geometry={platform} material={MATERIALS.plasterWarm} position={[0, 0, desk.centerZ]} receiveShadow />
    </group>
  );
}

function Lounge() {
  return (
    <group name="lounge">
      <Sofa position={[-5.3, 0, -8.9]} rotationY={0.95} width={2.5} />
      <Sofa position={[-6.6, 0, -12.8]} rotationY={0.5} width={2.2} />
      <Sofa position={[5.6, 0, -6.6]} rotationY={-0.95} width={2.5} />
      <CoffeeTable position={[-3.5, 0, -6.9]} />
      <Stele position={[4.7, 0, -11.4]} rotationY={-0.3} />
    </group>
  );
}

function Garden() {
  const kinds = ["olive_a", "olive_b", "olive_c"] as const;
  return (
    <group name="garden">
      {[-1, 1].map((s) =>
        [-4, -10, -16, -22, -28].map((z, i) => (
          <Plant
            key={`${s}${z}`}
            kind={kinds[(i + (s > 0 ? 1 : 0)) % kinds.length]}
            position={[s * (16.5 + (i % 2) * 2.4), 0, z]}
            height={5.4 + (i % 3) * 0.8}
            seed={30 + i * 2 + (s > 0 ? 1 : 0)}
          />
        )),
      )}
    </group>
  );
}

function Offices() {
  const partitions = useMemo<BoxInstance[]>(() => {
    const items: BoxInstance[] = [];
    for (const s of [-1, 1]) {
      for (let x = 4.6; x < HW; x += 1.4) items.push({ position: [s * x, L.ceiling / 2, -25.2], size: [0.05, L.ceiling, 0.08] });
    }
    return items;
  }, []);
  return (
    <group name="offices-glimpse">
      {[-1, 1].map((s) => (
        <group key={s}>
          <mesh material={MATERIALS.glass} position={[s * (4.4 + (HW - 4.4) / 2), L.ceiling / 2, -25.2]} renderOrder={3}>
            <planeGeometry args={[HW - 4.4, L.ceiling]} />
          </mesh>
          {[0, 1, 2].map((i) => (
            <group key={i} position={[s * (6.2 + i * 2.2), 0, -27.4]}>
              <Block material={MATERIALS.plaster} position={[0, 0.74, 0]} size={[1.6, 0.04, 0.8]} castShadow={false} />
              <Block material={MATERIALS.steelDark} position={[0, 0.37, 0]} size={[0.06, 0.74, 0.6]} castShadow={false} />
              <Block material={MATERIALS.screen} position={[0, 1.02, -0.25]} size={[0.6, 0.36, 0.03]} castShadow={false} />
              <Block material={MATERIALS.steelDark} position={[0, 0.48, 0.7]} size={[0.5, 0.9, 0.5]} castShadow={false} />
            </group>
          ))}
        </group>
      ))}
      <InstancedBoxes items={partitions} material={MATERIALS.steel} />
    </group>
  );
}

/** Reception lobby, reconstructed from design/references/04-lobby-clean.png. */
export function LobbyZone() {
  return (
    <group name="zone-lobby">
      <Shell />
      <Columns />
      <Reception />
      <Lounge />
      <Offices />
      <Garden />

      <Planter position={[-4.1, 0, -15.3]} kind="tropical" radius={0.46} potHeight={0.85} plantHeight={1.4} seed={11} />
      <Planter position={[4.1, 0, -15.3]} kind="tropical" radius={0.46} potHeight={0.85} plantHeight={1.5} seed={12} />
      <Planter position={[-5.9, 0, -18.6]} kind="pachira_a" radius={0.55} potHeight={1} plantHeight={2.3} seed={13} />
      <Planter position={[5.9, 0, -18.6]} kind="pachira_b" radius={0.55} potHeight={1} plantHeight={2.2} seed={14} />
      <Planter position={[-9.8, 0, -8.8]} kind="ficus" radius={0.6} potHeight={0.7} plantHeight={2.1} square seed={17} />
      <Planter position={[9.9, 0, -9.0]} kind="ficus" radius={0.6} potHeight={0.7} plantHeight={2} square seed={18} />
      <Planter position={[-6.9, 0, -5.4]} kind="tropical" radius={0.44} potHeight={0.85} plantHeight={1.3} seed={19} />
      <Planter position={[7.2, 0, -12.8]} kind="pachira_a" radius={0.5} potHeight={0.9} plantHeight={2} seed={20} />
    </group>
  );
}

export const LOBBY_LIGHTS: { position: THREE.Vector3Tuple; intensity: number }[] = [
  { position: [0, 5.2, -3.2], intensity: 40 },
  { position: [0, 6.4, -14.2], intensity: 60 },
  { position: [0, 2.6, -13.2], intensity: 18 },
  { position: [-6.5, 6.2, -8.5], intensity: 34 },
  { position: [6.5, 6.2, -8.5], intensity: 34 },
  { position: [-6, 6.2, -20], intensity: 26 },
  { position: [6, 6.2, -20], intensity: 26 },
];

"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { frame } from "@/lib/experience/store";
import { beat } from "@/lib/experience/timeline";
import { WORLD } from "@/lib/experience/world";
import { LogoMesh } from "../architecture/LogoMesh";
import { SignHalo } from "../architecture/SignHalo";
import { Block, InstancedBoxes, type BoxInstance } from "../architecture/primitives";
import { SlidingDoors } from "../doors/SlidingDoors";
import { MATERIALS } from "../materials";
import { Planter, Plant } from "../vegetation/Plants";
import { PoolFloor, WaterSurface } from "../water/WaterSurface";

const F = WORLD.facade;
const P = WORLD.pool;
/** Dark ground under the timber ring: the 2 mm board joints read as dark reveals, not as floor showing through. */
const jointShadow = new THREE.MeshStandardMaterial({ color: "#1c140e", roughness: 1 });
const GLASS_Z = -0.06;
const POST_X = F.halfOpening + F.post.width / 2;
const POST_Z = F.post.front + F.post.depth / 2;
const PILLAR_Z = F.pillar.front - F.pillar.depth / 2;

function roundedRect(w: number, h: number, r: number) {
  const shape = new THREE.Shape();
  const x = w / 2;
  const y = h / 2;
  shape.moveTo(-x + r, -y);
  shape.lineTo(x - r, -y);
  shape.quadraticCurveTo(x, -y, x, -y + r);
  shape.lineTo(x, y - r);
  shape.quadraticCurveTo(x, y, x - r, y);
  shape.lineTo(-x + r, y);
  shape.quadraticCurveTo(-x, y, -x, y - r);
  shape.lineTo(-x, -y + r);
  shape.quadraticCurveTo(-x, -y, -x + r, -y);
  return shape;
}

/** Soft spill of the perimeter backlight on the glass behind: follows the panel outline, no cloud. */
function signSpillMaterial(width: number, height: number, margin: number) {
  const ppm = 120;
  const cw = Math.round((width + margin * 2) * ppm);
  const ch = Math.round((height + margin * 2) * ppm);
  const canvas = document.createElement("canvas");
  canvas.width = cw;
  canvas.height = ch;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, cw, ch);
  ctx.filter = `blur(${Math.round(margin * ppm * 0.38)}px)`;
  ctx.fillStyle = "#fff";
  const inset = margin * ppm * 0.72;
  ctx.beginPath();
  ctx.roundRect(inset, inset, cw - inset * 2, ch - inset * 2, 0.14 * ppm);
  ctx.fill();
  const alphaMap = new THREE.CanvasTexture(canvas);
  return new THREE.MeshBasicMaterial({
    color: new THREE.Color("#fff6ea").multiplyScalar(0.55),
    alphaMap,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    toneMapped: false,
  });
}

const stonePlanterGeometry = new RoundedBoxGeometry(1.15, 1.04, 1.1, 3, 0.02);

const postGeometry = new RoundedBoxGeometry(F.post.width, F.glassHeight, F.post.depth, 2, 0.014);
const transomGeometry = new RoundedBoxGeometry(F.halfOpening * 2 + F.post.width * 2, F.transom.top - F.transom.bottom, F.post.depth, 2, 0.012);

/** Entrance bay: satin-steel posts, head transom, glass above, and the backlit sign. */
function EntranceBay() {
  const s = F.sign;
  const signY = s.bottom + s.height / 2;
  const spillMargin = 0.34;
  const signSpill = useMemo(() => signSpillMaterial(s.width, s.height, spillMargin), [s.width, s.height]);

  const bevel = 0.012;
  const signBox = useMemo(() => {
    const geo = new THREE.ExtrudeGeometry(roundedRect(s.width, s.height, s.radius), {
      depth: s.depth,
      bevelEnabled: true,
      bevelSize: bevel,
      bevelThickness: bevel,
      bevelSegments: 3,
      curveSegments: 12,
    });
    geo.computeVertexNormals();
    return geo;
  }, [s.width, s.height, s.radius, s.depth]);
  // LED line just behind the panel edge: only its outer 2 cm show around the box.
  const backlight = useMemo(() => {
    const outer = roundedRect(s.width + 0.05, s.height + 0.05, s.radius + 0.025);
    outer.holes.push(roundedRect(s.width - 0.2, s.height - 0.2, s.radius) as unknown as THREE.Path);
    return new THREE.ShapeGeometry(outer, 12);
  }, [s.width, s.height, s.radius]);

  return (
    <group name="entrance-bay">
      {/* Glass above the transom */}
      <mesh material={MATERIALS.facadeGlass} position={[0, (F.transom.top + F.glassHeight) / 2, GLASS_Z]} renderOrder={3}>
        <planeGeometry args={[F.halfOpening * 2 + F.post.width * 2, F.glassHeight - F.transom.top]} />
      </mesh>

      {/* Satin-steel posts and head transom, softly radiused edges (vertical highlights) */}
      {[-1, 1].map((side) => (
        <mesh
          key={side}
          geometry={postGeometry}
          material={MATERIALS.steel}
          position={[side * POST_X, F.glassHeight / 2, POST_Z - 0.1]}
          castShadow
          receiveShadow
        />
      ))}
      <mesh
        geometry={transomGeometry}
        material={MATERIALS.steel}
        position={[0, (F.transom.bottom + F.transom.top) / 2, POST_Z - 0.16]}
        castShadow
        receiveShadow
      />
      {/* Door threshold: flush satin-steel plate */}
      <Block material={MATERIALS.steel} position={[0, 0.004, 0.02]} size={[F.halfOpening * 2 + 0.2, 0.008, 0.3]} castShadow={false} />

      {/*
        Sign box: satin solid-surface face, LED line behind the edge, faint spill on the glass.
        Halo-lit stand-off letters (reverse channel): LEDs behind the letters wash the face around each
        glyph. No sun shadow on the face: at 3 cm per shadow texel the letters' shadows were jagged.
      */}
      <group position={[0, signY, s.front]}>
        <mesh material={signSpill} position={[0, 0, -(s.front - GLASS_Z) + 0.02]} renderOrder={1}>
          <planeGeometry args={[s.width + spillMargin * 2, s.height + spillMargin * 2]} />
        </mesh>
        <mesh geometry={backlight} material={MATERIALS.signBacklight} position={[0, 0, -bevel - 0.004]} />
        <mesh geometry={signBox} material={MATERIALS.signFace} castShadow />
        <group position={[0, -0.05, s.depth + bevel + 0.002]}>
          <SignHalo width={s.logoWidth} scaleY={s.logoScaleY} />
        </group>
        {/* Stand-off letters: 1.5 cm gap in front of the face, the halo light spills out of it */}
        <group position={[0, -0.05, s.depth + bevel + 0.015 + 0.06]}>
          <LogoMesh width={s.logoWidth} depth={0.06} bevel={0.005} strokeDepth={0.03} scaleY={s.logoScaleY} material={MATERIALS.logoSign} />
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
    const v = (x: number, y0: number, y1: number, z: number) => items.push({ position: [x, (y0 + y1) / 2, z], size: [0.06, y1 - y0, 0.12] });
    const h = (x0: number, x1: number, y: number, z: number, t = 0.06) => items.push({ position: [(x0 + x1) / 2, y, z], size: [x1 - x0, t, 0.12] });
    for (const s of [-1, 1]) {
      const inner = s < 0 ? F.leftPillar.from : F.rightPillar.to;
      for (let x = Math.abs(inner) + 1.7; x < F.wingEnd; x += 1.7) v(s * x, 0, F.glassHeight, wz);
      h(s * Math.abs(inner), s * F.wingEnd, 3.5, wz);
      h(s * Math.abs(inner), s * F.wingEnd, F.glassHeight - 0.05, wz, 0.1);
      h(s * Math.abs(inner), s * F.wingEnd, 0.05, wz, 0.1);
    }
    // Panel / glass joints beside the entrance
    v(F.leftPanel.from, 0, F.glassHeight, GLASS_Z);
    v(F.rightGlass.to, 0, F.glassHeight, GLASS_Z);
    // Transom line of the side bays, aligned with the door head.
    h(F.leftPanel.from, -POST_X, F.transom.top - 0.03, GLASS_Z);
    h(POST_X, F.rightGlass.to, F.transom.top - 0.03, GLASS_Z);
    // Bottom frames of the side bays.
    h(F.leftPanel.from, -POST_X, 0.03, GLASS_Z);
    h(POST_X, F.rightGlass.to, 0.03, GLASS_Z);
    return items;
  }, []);

  // Side bays run from their mullion to the door post (no gap).
  const leftPanelW = -POST_X - F.leftPanel.from;
  const rightGlassW = F.rightGlass.to - POST_X;

  return (
    <group name="envelope">
      {/* Piers */}
      <Block
        material={MATERIALS.facadePlaster}
        position={[(F.leftPillar.from + F.leftPillar.to) / 2, F.pillar.height / 2, PILLAR_Z]}
        size={[F.leftPillar.to - F.leftPillar.from, F.pillar.height, F.pillar.depth]}
      />
      <Block
        material={MATERIALS.facadePlaster}
        position={[(F.rightPillar.from + F.rightPillar.to) / 2, F.pillar.height / 2, PILLAR_Z]}
        size={[F.rightPillar.to - F.rightPillar.from, F.pillar.height, F.pillar.depth]}
      />

      {/* Shadow gap where the piers meet the paving */}
      {[F.leftPillar, F.rightPillar].map((pier, i) => (
        <Block
          key={`gap${i}`}
          material={MATERIALS.shadowGap}
          position={[(pier.from + pier.to) / 2, 0.012, F.pillar.front + 0.002]}
          size={[pier.to - pier.from + 0.004, 0.024, 0.01]}
          castShadow={false}
          receiveShadow={false}
        />
      ))}

      {/* Glazed bay left of the entrance (both references): the words are applied on the glass */}
      <mesh material={MATERIALS.facadeGlass} position={[(F.leftPanel.from - POST_X) / 2, F.glassHeight / 2, GLASS_Z]} renderOrder={3}>
        <planeGeometry args={[leftPanelW, F.glassHeight]} />
      </mesh>
      <mesh material={MATERIALS.facadeGlass} position={[(POST_X + F.rightGlass.to) / 2, F.glassHeight / 2, GLASS_Z]} renderOrder={3}>
        <planeGeometry args={[rightGlassW, F.glassHeight]} />
      </mesh>

      {/* Glazed wings */}
      {[-1, 1].map((s) => {
        const inner = s < 0 ? -F.leftPillar.from : F.rightPillar.to;
        const w = F.wingEnd - inner;
        return (
          <mesh key={s} material={MATERIALS.facadeGlass} position={[s * (inner + w / 2), F.glassHeight / 2, -0.4]} renderOrder={3}>
            <planeGeometry args={[w, F.glassHeight]} />
          </mesh>
        );
      })}
      <InstancedBoxes items={mullions} material={MATERIALS.steel} castShadow />

      {/* Building mass above the glazing */}
      <Block material={MATERIALS.facadePlaster} position={[0, (F.glassHeight + F.parapet) / 2, -0.9]} size={[F.wingEnd * 2 + 1.6, F.parapet - F.glassHeight, 1.8]} />
      {[-1, 1].map((s) => (
        <Block key={`end${s}`} material={MATERIALS.facadePlaster} position={[s * (F.wingEnd + 0.8), F.parapet / 2, -0.2]} size={[1.6, F.parapet, 2.6]} />
      ))}
    </group>
  );
}

/** Circular basin: closed geometry (outer wall, coping, inner wall, floor) + live water. */
/** Lathe with UVs in metres: u along the profile, v around the axis (at each point's own radius). */
function latheMetres(points: THREE.Vector2[], segments: number, phiStart = 0, phiLength = Math.PI * 2, vOffset = 0, uOffset = 0) {
  const g = new THREE.LatheGeometry(points, segments, phiStart, phiLength);
  const lengths = [0];
  for (let j = 1; j < points.length; j++) lengths.push(lengths[j - 1] + points[j].distanceTo(points[j - 1]));
  const uv = g.attributes.uv as THREE.BufferAttribute;
  for (let i = 0; i <= segments; i++)
    for (let j = 0; j < points.length; j++)
      uv.setXY(i * points.length + j, lengths[j] + uOffset, (phiStart + (i / segments) * phiLength) * points[j].x + vOffset);
  uv.needsUpdate = true;
  return g;
}

/** Quarter arc of `n` points around (cx, cy), from angle a0 to a1 (radians). */
function arc(cx: number, cy: number, r: number, a0: number, a1: number, n = 5) {
  return Array.from({ length: n + 1 }, (_, k) => {
    const a = a0 + ((a1 - a0) * k) / n;
    return new THREE.Vector2(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
  });
}

/**
 * Timber coping: solid oiled hardwood cap, 2.5 cm overhang above the water (5 mm shadow line below),
 * 8 mm radiused edges, clad down to the paving. 18 bent boards with real 2 mm joints; each board has its
 * own grain offset and a slight tone of its own, the grain follows the curve.
 */
function useWoodCoping() {
  return useMemo(() => {
    const top = P.rim;
    const under = 0.185;
    const xo = P.outerR + 0.008;
    const xi = P.innerR - 0.025;
    const r = 0.008;
    const r2 = 0.004;
    // Outside → up → over the top → down the inner lip → underside (normals face outwards).
    const profile = [
      new THREE.Vector2(xo, 0),
      ...arc(xo - r, top - r, r, 0, Math.PI / 2),
      ...arc(xi + r, top - r, r, Math.PI / 2, Math.PI),
      ...arc(xi + r2, under + r2, r2, Math.PI, Math.PI * 1.5, 3),
      new THREE.Vector2(P.innerR, under),
    ];
    const boards = 18;
    const gap = 0.002 / P.outerR;
    const step = (Math.PI * 2) / boards;
    let seed = 11;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
    const parts = Array.from({ length: boards }, (_, i) => {
      const g = latheMetres(profile, 10, i * step + gap / 2, step - gap, rnd() * 1.83, rnd() * 1.83);
      const tone = 0.93 + rnd() * 0.12;
      const warm = (rnd() - 0.5) * 0.04;
      const colors = new Float32Array(g.attributes.position.count * 3);
      for (let k = 0; k < colors.length; k += 3) {
        colors[k] = tone + warm;
        colors[k + 1] = tone;
        colors[k + 2] = tone - warm;
      }
      g.setAttribute("color", new THREE.BufferAttribute(colors, 3));
      return g;
    });
    const merged = mergeGeometries(parts, false)!;
    parts.forEach((p) => p.dispose());
    return merged;
  }, []);
}

function Pool() {
  // Stone basin under the timber: floor and inner wall (below the coping's shadow line).
  const basin = useMemo(
    () =>
      latheMetres(
        [new THREE.Vector2(0, 0.015), new THREE.Vector2(P.innerR, 0.015), new THREE.Vector2(P.innerR, 0.185)],
        160,
      ),
    [],
  );
  const coping = useWoodCoping();
  const basinMaterial = useMemo(() => {
    const m = MATERIALS.deskStone.clone();
    m.side = THREE.DoubleSide;
    return m;
  }, []);

  return (
    <group name="pool" position={[P.center[0], 0, P.center[1]]}>
      <mesh geometry={basin} material={basinMaterial} />
      {/* No received sun shadow: 20 cm from the p=0 camera, the shadow-map texels read as a knit pattern. */}
      <mesh geometry={coping} material={MATERIALS.wood} castShadow />
      <mesh material={jointShadow} rotation-x={-Math.PI / 2} position-y={0.002}>
        <ringGeometry args={[P.innerR - 0.03, P.outerR + 0.006, 160]} />
      </mesh>
      <PoolFloor radius={P.innerR - 0.005} y={0.018} />
      {/* The water runs into the coping chamfer: no gap to see the basin floor through. */}
      <WaterSurface radius={P.innerR + 0.01} y={P.water} />
    </group>
  );
}

const planterCorners = Array.from({ length: 8 }, (_, i) => new THREE.Vector3((i & 1 ? 0.5 : -0.5) * 1.15, i & 2 ? 1.04 : 0, (i & 4 ? 0.5 : -0.5) * 1.1));
const corner = new THREE.Vector3();

/**
 * Black stone planter block left of the glazed entrance, like every planter (no signage).
 * It sits where the hero veil fades out: its screen rect is published so the veil is cut around it
 * (a dark volume under a white gradient reads as grey smoke).
 */
function StonePlanter() {
  const group = useRef<THREE.Group>(null);
  useFrame(({ camera, size }) => {
    const g = group.current;
    if (!g) return;
    let left = Infinity;
    let right = -Infinity;
    let top = Infinity;
    let bottom = -Infinity;
    let inFront = true;
    for (const c of planterCorners) {
      corner.copy(c).applyMatrix4(g.matrixWorld).project(camera);
      if (corner.z > 1) inFront = false;
      const x = (corner.x * 0.5 + 0.5) * size.width;
      const y = (-corner.y * 0.5 + 0.5) * size.height;
      left = Math.min(left, x);
      right = Math.max(right, x);
      top = Math.min(top, y);
      bottom = Math.max(bottom, y);
    }
    frame.rects.heroPlanter = { left, top, right, bottom, visible: inFront && g.visible };
  });
  return (
    <group ref={group} position={[-3.52, 0, 0.55]} rotation-y={0.06}>
      <mesh geometry={stonePlanterGeometry} material={MATERIALS.planterStone} position={[0, 0.52, 0]} castShadow receiveShadow />
      <Plant kind="tropical" position={[0.12, 1.04, -0.2]} height={0.8} seed={21} />
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
        <StonePlanter />

        {/*
          Planters: tropicals stay against the glazing only. The zone behind the hero copy is kept
          calm; both agents get air between them and the greenery (01-home-final). The stone planter
          block carries its own tropical.
        */}
        <Planter position={[2.75, 0, 0.75]} kind="tropical" radius={0.4} potHeight={0.74} plantHeight={1.05} seed={4} />

        {/* Mediterranean garden: slender olives framing the edges, low shrubs */}
        <Plant kind="olive_a" position={[-8.8, 0, 3.6]} height={6} seed={11} />
        <Plant kind="olive_b" position={[-9.8, 0, 8.4]} height={5.2} seed={12} />
        <Plant kind="olive_c" position={[4.9, 0, 1.2]} height={5.4} seed={13} />
        <Plant kind="olive_a" position={[12.4, 0, 9.2]} height={6.6} seed={14} />
        <Plant kind="olive_b" position={[-13.5, 0, 2.4]} height={5.8} seed={15} />
        <Plant kind="olive_c" position={[15.5, 0, 2.2]} height={6} seed={16} />
        <Plant kind="shrub" position={[3.1, 0, 8.4]} height={0.45} seed={18} />
        <Plant kind="shrub" position={[6.8, 0, 6.9]} height={0.55} seed={19} />
      </group>
    </group>
  );
}

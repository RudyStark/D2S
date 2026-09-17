"use client";

import { Environment, Lightformer } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { QUALITY } from "@/lib/experience/quality";
import { frame, useExperience } from "@/lib/experience/store";
import { beatEased } from "@/lib/experience/timeline";
import { lerp } from "@/lib/math";
import { LOBBY_LIGHTS } from "../scenes/LobbyZone";
import { SkyDome } from "../scenes/Surroundings";

const TREE_BLOBS: [number, number, number, number][] = [
  [-30, 6, 18, 7], [-18, 5, 30, 6], [0, 5, 40, 7], [20, 6, 32, 6], [32, 5, 16, 7], [-36, 4, -6, 6], [36, 4, -8, 6],
];

const SUN_OFFSET = new THREE.Vector3(-15, 21, 17);
const SKY_DAY = new THREE.Color("#dcebff");
const SKY_WARM = new THREE.Color("#fff7ef");
const GROUND_DAY = new THREE.Color("#efe9e1");
const GROUND_WARM = new THREE.Color("#f5ede4");

/**
 * Morning daylight outside, warmer cove lighting inside.
 * The "lightShift" beat cross-fades both moods as the camera crosses the threshold.
 */
export function Lighting() {
  const quality = useExperience((s) => s.quality);
  const settings = QUALITY[quality];
  const sun = useRef<THREE.DirectionalLight>(null);
  const hemi = useRef<THREE.HemisphereLight>(null);
  const interior = useRef<THREE.Group>(null);
  const target = useMemo(() => new THREE.Object3D(), []);

  useLayoutEffect(() => {
    const light = sun.current;
    if (!light) return;
    target.position.set(0, 0, -8);
    light.target = target;
    light.position.copy(target.position).add(SUN_OFFSET);
    const cam = light.shadow.camera;
    cam.left = -30;
    cam.right = 30;
    cam.top = 30;
    cam.bottom = -30;
    cam.near = 1;
    cam.far = 110;
    cam.updateProjectionMatrix();
    light.shadow.needsUpdate = true;
  }, [target, settings.shadowMapSize]);

  useFrame(() => {
    const k = beatEased(frame.progress, "lightShift");
    if (sun.current) sun.current.intensity = lerp(2.9, 2.7, k);
    if (hemi.current) {
      hemi.current.intensity = lerp(1.05, 1.2, k);
      hemi.current.color.copy(SKY_DAY).lerp(SKY_WARM, k);
      hemi.current.groundColor.copy(GROUND_DAY).lerp(GROUND_WARM, k);
    }
    interior.current?.children.forEach((child, i) => {
      (child as THREE.PointLight).intensity = LOBBY_LIGHTS[i].intensity * lerp(0.45, 1, k);
    });
  });

  return (
    <>
      <primitive object={target} />
      <hemisphereLight ref={hemi} args={[SKY_DAY, GROUND_DAY, 1.05]} />
      <directionalLight
        ref={sun}
        color="#fff0dc"
        intensity={2.9}
        castShadow={settings.shadows}
        shadow-mapSize={[settings.shadowMapSize, settings.shadowMapSize]}
        shadow-bias={-0.0003}
        shadow-normalBias={0.035}
        shadow-radius={4}
      />
      <group ref={interior}>
        {LOBBY_LIGHTS.map((l, i) => (
          <pointLight key={i} position={l.position} color="#ffe9d2" intensity={l.intensity} distance={22} decay={2} />
        ))}
      </group>

      {/* Procedural environment (no HDRI download): glass and steel reflect a blue sky, a warm ground and tree masses. */}
      <Environment frames={1} resolution={256} background={false} environmentIntensity={0.8}>
        <SkyDome radius={90} />
        <mesh rotation-x={-Math.PI / 2} position-y={-0.5}>
          <circleGeometry args={[90, 32]} />
          <meshBasicMaterial color="#e9e4dc" />
        </mesh>
        {TREE_BLOBS.map(([x, y, z, r], i) => (
          <mesh key={i} position={[x, y, z]} scale={[r, r * 0.8, r]}>
            <sphereGeometry args={[1, 12, 8]} />
            <meshBasicMaterial color="#5f7a55" />
          </mesh>
        ))}
        <Lightformer form="rect" intensity={1.6} color="#ffffff" position={[0, 30, 0]} rotation-x={Math.PI / 2} scale={[30, 30, 1]} />
        <Lightformer form="rect" intensity={1.2} color="#fff1dd" position={[-40, 14, 30]} rotation-y={Math.PI / 3} scale={[24, 10, 1]} />
      </Environment>
    </>
  );
}

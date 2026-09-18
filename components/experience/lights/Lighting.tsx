"use client";

import { Environment } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { QUALITY } from "@/lib/experience/quality";
import { frame, useExperience } from "@/lib/experience/store";
import { beatEased } from "@/lib/experience/timeline";
import { lerp } from "@/lib/math";
import { LOBBY_LIGHTS } from "../scenes/LobbyZone";

const SUN_OFFSET = new THREE.Vector3(-15, 21, 17);
const SKY_DAY = new THREE.Color("#e6f0ff");
const SKY_WARM = new THREE.Color("#fffaf4");
const GROUND_DAY = new THREE.Color("#f4f1ec");
const GROUND_WARM = new THREE.Color("#f7f2ec");

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
    if (sun.current) sun.current.intensity = lerp(3.5, 2.9, k);
    if (hemi.current) {
      hemi.current.intensity = lerp(1.35, 2.1, k);
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
        color="#fff2e0"
        intensity={3.5}
        castShadow={settings.shadows}
        shadow-mapSize={[settings.shadowMapSize, settings.shadowMapSize]}
        shadow-bias={-0.0003}
        shadow-normalBias={0.035}
        shadow-radius={4}
      />
      <group ref={interior}>
        {LOBBY_LIGHTS.map((l, i) => (
          <pointLight key={i} position={l.position} color="#fff0e0" intensity={l.intensity} distance={22} decay={2} />
        ))}
      </group>

      {/*
        CC0 HDRI (Poly Haven, borghese_gardens 1k): blue sky, Mediterranean trees and a warm ground —
        it is what the glass, the steel and the water reflect. Background stays our gradient sky.
      */}
      <Environment files="/hdri/borghese_gardens_1k.hdr" environmentIntensity={0.55} environmentRotation={[0, 2.4, 0]} />
    </>
  );
}

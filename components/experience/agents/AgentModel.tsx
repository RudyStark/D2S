"use client";

import { useAnimations, useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { clone as cloneSkinned } from "three/examples/jsm/utils/SkeletonUtils.js";
import { useExperience } from "@/lib/experience/store";
import { AgentGroundShadow } from "./AgentGroundShadow";

interface AgentModelProps {
  url: string;
  height: number;
  idle: boolean;
  castShadow?: boolean;
}

/**
 * Production agent: GLB normalised to the slot height, feet on the ground.
 * Rigged models play their "idle" clip; static sculpts (AI-generated, no skeleton) get a subtle
 * procedural breathing instead. Characters cast the sun's shadow but do not receive it: at this
 * scale the shadow-map texels (2–3 cm) would crawl over the clothes as acne.
 */
export function AgentModel({ url, height, idle, castShadow = true }: AgentModelProps) {
  const { scene, animations } = useGLTF(url, true, true);
  const root = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  const reducedMotion = useExperience((s) => s.reducedMotion);
  const phase = useMemo(() => Math.random() * Math.PI * 2, []);

  const model = useMemo(() => {
    const copy = cloneSkinned(scene);
    const box = new THREE.Box3().setFromObject(copy);
    const size = box.getSize(new THREE.Vector3());
    const scale = size.y > 0 ? height / size.y : 1;
    copy.scale.setScalar(scale);
    copy.position.set(-((box.min.x + box.max.x) / 2) * scale, -box.min.y * scale, -((box.min.z + box.max.z) / 2) * scale);
    let width = size.x * scale;
    copy.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.castShadow = castShadow;
      mesh.receiveShadow = false;
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      for (const m of mats) {
        const map = (m as THREE.MeshStandardMaterial).map;
        if (map) map.anisotropy = 8;
        // Closed, watertight sculpts: back faces are never seen (the source flags them double-sided).
        m.side = THREE.FrontSide;
      }
    });
    width = Math.min(width, height * 0.5);
    return { object: copy, width };
  }, [scene, height, castShadow]);

  const { actions, names } = useAnimations(animations, root);
  const rigged = names.length > 0;

  useFrame(({ clock }) => {
    const b = body.current;
    if (!b || rigged || !idle || reducedMotion) return;
    // Breathing and a slow weight shift: sub-percent, read as life, never as motion.
    const t = clock.elapsedTime + phase;
    b.scale.set(1 - Math.sin(t * 1.35) * 0.0012, 1 + Math.sin(t * 1.35) * 0.0035, 1);
    b.rotation.y = Math.sin(t * 0.37) * 0.012;
  });

  useEffect(() => {
    if (!idle || reducedMotion) return;
    const name = names.find((n) => /idle/i.test(n)) ?? names[0];
    const action = name ? actions[name] : undefined;
    action?.reset().fadeIn(0.4).play();
    return () => {
      action?.fadeOut(0.3);
    };
  }, [actions, names, idle, reducedMotion]);

  return (
    <group ref={root}>
      <group ref={body}>
        <primitive object={model.object} />
      </group>
      <AgentGroundShadow width={model.width} />
    </group>
  );
}

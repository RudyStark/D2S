"use client";

import { useAnimations, useGLTF } from "@react-three/drei";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { clone as cloneSkinned } from "three/examples/jsm/utils/SkeletonUtils.js";
import { useExperience } from "@/lib/experience/store";

interface AgentModelProps {
  url: string;
  height: number;
  idle: boolean;
}

/** Production agent: rigged GLB, normalised to the slot height, feet on the ground. */
export function AgentModel({ url, height, idle }: AgentModelProps) {
  const { scene, animations } = useGLTF(url, true, true);
  const root = useRef<THREE.Group>(null);
  const reducedMotion = useExperience((s) => s.reducedMotion);

  const model = useMemo(() => {
    const copy = cloneSkinned(scene);
    const box = new THREE.Box3().setFromObject(copy);
    const size = box.getSize(new THREE.Vector3());
    const scale = size.y > 0 ? height / size.y : 1;
    copy.scale.setScalar(scale);
    copy.position.set(-((box.min.x + box.max.x) / 2) * scale, -box.min.y * scale, -((box.min.z + box.max.z) / 2) * scale);
    copy.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) {
        o.castShadow = true;
        o.receiveShadow = true;
      }
    });
    return copy;
  }, [scene, height]);

  const { actions, names } = useAnimations(animations, root);

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
      <primitive object={model} />
    </group>
  );
}

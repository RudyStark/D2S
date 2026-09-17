"use client";

import { Html, Line } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three";
import { buildCameraPath, CAMERA_KEYS, createCameraSample } from "@/lib/experience/cameraPath";
import { useExperience } from "@/lib/experience/store";

/** ?debug3d=1 — camera path and keyframes drawn in the world. */
export function DebugScene() {
  const profile = useExperience((s) => s.profile);
  const keys = CAMERA_KEYS[profile];

  const points = useMemo(() => {
    const path = buildCameraPath(keys);
    const s = createCameraSample();
    return Array.from({ length: 200 }, (_, i) => {
      path.sample(i / 199, s);
      return new THREE.Vector3(s.x, 0.02, s.z);
    });
  }, [keys]);

  return (
    <group>
      <Line points={points} color="#1570f0" lineWidth={2} />
      {keys.map((k) => (
        <group key={k.p} position={[k.pos[0], 0.02, k.pos[2]]}>
          <mesh>
            <sphereGeometry args={[0.06, 12, 8]} />
            <meshBasicMaterial color="#ff4d6d" />
          </mesh>
          <Html center distanceFactor={10} style={{ pointerEvents: "none" }}>
            <span style={{ font: "600 10px/1 monospace", color: "#ff4d6d", whiteSpace: "nowrap" }}>p {k.p.toFixed(2)}</span>
          </Html>
        </group>
      ))}
    </group>
  );
}

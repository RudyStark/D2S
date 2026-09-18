"use client";

import { MeshReflectorMaterial } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three";
import { QUALITY } from "@/lib/experience/quality";
import { useExperience } from "@/lib/experience/store";
import { WORLD } from "@/lib/experience/world";
import { createFloorMaps, MATERIALS } from "../materials";

const skyVertex = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = normalize(position);
    vec4 p = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * p;
    gl_Position.z = gl_Position.w; // always at the far plane
  }
`;

const skyFragment = /* glsl */ `
  uniform vec3 uZenith;
  uniform vec3 uHorizon;
  uniform vec3 uGlow;
  varying vec3 vDir;
  void main() {
    float h = clamp(vDir.y, 0.0, 1.0);
    vec3 col = mix(uHorizon, uZenith, pow(h, 0.55));
    // Warm morning glow towards the sun side (front-left).
    float sun = pow(max(dot(normalize(vDir), normalize(vec3(-0.55, 0.35, 0.75))), 0.0), 6.0);
    col = mix(col, uGlow, sun * 0.35);
    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
  }
`;

export function SkyDome({ radius = 180 }: { radius?: number }) {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: skyVertex,
        fragmentShader: skyFragment,
        uniforms: {
          uZenith: { value: new THREE.Color("#8fbaf0") },
          uHorizon: { value: new THREE.Color("#eef4fb") },
          uGlow: { value: new THREE.Color("#fff3df") },
        },
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
      }),
    [],
  );
  return (
    <mesh material={material} renderOrder={-1} frustumCulled={false}>
      <sphereGeometry args={[radius, 32, 16]} />
    </mesh>
  );
}

/** Gradient sky dome + continuous polished floor shared by every zone. */
export function Surroundings() {
  const reflections = useExperience((s) => QUALITY[s.quality].reflections);
  const { halfWidth, depth } = WORLD.plaza;
  const maps = useMemo(() => createFloorMaps(halfWidth * 2, depth + 40), [halfWidth, depth]);
  return (
    <>
      <SkyDome />
      {/* One floor for plaza and lobby: the threshold is continuous. */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0, (depth - 40) / 2]} receiveShadow name="ground">
        <planeGeometry args={[halfWidth * 2, depth + 40]} />
        {reflections ? (
          <MeshReflectorMaterial
            {...maps}
            color="#f7f7f6"
            roughness={0.26}
            metalness={0}
            normalScale={new THREE.Vector2(0.14, 0.14)}
            envMapIntensity={0.9}
            resolution={1024}
            blur={[520, 180]}
            mixBlur={1.1}
            mixStrength={0.42}
            mixContrast={1}
            depthScale={1.1}
            minDepthThreshold={0.25}
            maxDepthThreshold={1.5}
            reflectorOffset={0.004}
            mirror={0}
          />
        ) : (
          <primitive object={MATERIALS.floor} attach="material" />
        )}
      </mesh>
    </>
  );
}

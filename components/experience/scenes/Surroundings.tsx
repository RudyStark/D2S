"use client";

import { MeshReflectorMaterial } from "@react-three/drei";
import { useCallback, useMemo } from "react";
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

/**
 * The floor is one plane from the plaza to the lobby. Its albedo and `mirror` blend are tuned
 * for the interior (reflections must read against a slightly darker stone); outside, in full
 * sun, that would turn the paving grey. The plaza side (z > 0) gets a brighter albedo and a
 * purely additive reflection, blending across the threshold.
 */
const PLAZA_ALBEDO_GAIN = 1.3;

function patchFloorZones(material: THREE.MeshStandardMaterial | null) {
  if (!material || material.userData.zonePatched) return;
  material.userData.zonePatched = true;
  const base = material.onBeforeCompile.bind(material);
  material.onBeforeCompile = (shader, renderer) => {
    base(shader, renderer);
    shader.vertexShader = `varying float vFloorZ;\n${shader.vertexShader}`.replace(
      "#include <begin_vertex>",
      "#include <begin_vertex>\n  vFloorZ = (modelMatrix * vec4(position, 1.0)).z;",
    );
    shader.fragmentShader = `varying float vFloorZ;\n${shader.fragmentShader}`.replace(
      "#include <map_fragment>",
      `#include <map_fragment>
      float plazaK = smoothstep(-0.2, 1.8, vFloorZ);
      diffuseColor.rgb *= mix(1.0, ${PLAZA_ALBEDO_GAIN.toFixed(2)}, plazaK);`,
    );
    // drei's reflector blend (MeshReflectorMaterial.js): no mirror term on the plaza.
    shader.fragmentShader = shader.fragmentShader.replace(
      "((1.0 - min(1.0, mirror)) + newMerge.rgb * mixStrength)",
      "((1.0 - min(1.0, mirror * (1.0 - plazaK))) + newMerge.rgb * mixStrength)",
    );
  };
  material.customProgramCacheKey = () => "floor-zones";
  material.needsUpdate = true;
}

/** Gradient sky dome + continuous polished floor shared by every zone. */
export function Surroundings() {
  const reflections = useExperience((s) => QUALITY[s.quality].reflections);
  const { halfWidth, depth } = WORLD.plaza;
  const maps = useMemo(() => createFloorMaps(halfWidth * 2, depth + 40), [halfWidth, depth]);
  const floorRef = useCallback((m: THREE.MeshStandardMaterial | null) => patchFloorZones(m), []);
  return (
    <>
      <SkyDome />
      {/* One floor for plaza and lobby: the threshold is continuous. */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0, (depth - 40) / 2]} receiveShadow name="ground">
        <planeGeometry args={[halfWidth * 2, depth + 40]} />
        {reflections ? (
          <MeshReflectorMaterial
            ref={floorRef}
            {...maps}
            color="#c8cacb"
            roughness={0.2}
            metalness={0}
            resolution={1024}
            blur={[300, 90]}
            mixBlur={6}
            mixStrength={0.95}
            mixContrast={1}
            depthScale={0.9}
            minDepthThreshold={0.4}
            maxDepthThreshold={1.25}
            reflectorOffset={0.004}
            mirror={0.42}
          />
        ) : (
          <primitive object={MATERIALS.floor} attach="material" />
        )}
      </mesh>
    </>
  );
}

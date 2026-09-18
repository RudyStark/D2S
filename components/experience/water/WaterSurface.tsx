"use client";

import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useMemo } from "react";
import * as THREE from "three";
import { useExperience } from "@/lib/experience/store";

interface WaterSurfaceProps {
  radius: number;
  /** Height of the water plane, metres. */
  y: number;
}

/**
 * Calm architectural basin water.
 * Physical material (Fresnel + environment reflections) with a slowly animated
 * normal field built from a few low-amplitude sines, plus a shallow → deep tint.
 */
export function WaterSurface({ radius, y }: WaterSurfaceProps) {
  const reducedMotion = useExperience((s) => s.reducedMotion);

  const material = useMemo(() => {
    const m = new THREE.MeshPhysicalMaterial({
      color: "#7fb4d2",
      roughness: 0.04,
      metalness: 0,
      ior: 1.333,
      specularIntensity: 1,
      envMapIntensity: 1.35,
      clearcoat: 0.6,
      clearcoatRoughness: 0.05,
      transparent: true,
      opacity: 0.93,
    });
    const uniforms = {
      uTime: { value: 0 },
      uRadius: { value: radius },
      uShallow: { value: new THREE.Color("#a9d2e2") },
      uDeep: { value: new THREE.Color("#3f86ae") },
    };
    m.userData.uniforms = uniforms;
    m.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, uniforms);
      shader.vertexShader = shader.vertexShader
        .replace("#include <common>", "#include <common>\nvarying vec3 vWaterWorld;\nvarying vec2 vWaterLocal;")
        .replace(
          "#include <worldpos_vertex>",
          "#include <worldpos_vertex>\nvWaterWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;\nvWaterLocal = position.xy;",
        );
      shader.fragmentShader = shader.fragmentShader
        .replace(
          "#include <common>",
          `#include <common>
          uniform float uTime;
          uniform float uRadius;
          uniform vec3 uShallow;
          uniform vec3 uDeep;
          varying vec3 vWaterWorld;
          varying vec2 vWaterLocal;
          vec2 waterSlope(vec2 p, float t) {
            vec2 g = vec2(0.0);
            g += vec2(cos(p.x * 1.6 + t * 0.55), cos(p.y * 1.2 - t * 0.45)) * 0.028;
            g += vec2(cos(p.x * 3.7 - p.y * 2.3 + t * 1.05), cos(p.y * 4.1 + p.x * 1.4 + t * 0.85)) * 0.016;
            g += vec2(cos((p.x + p.y) * 8.5 + t * 1.6), cos((p.x - p.y) * 7.6 - t * 1.35)) * 0.008;
            g += vec2(cos(p.x * 17.0 - t * 2.1), cos(p.y * 15.0 + t * 1.9)) * 0.0035;
            return g;
          }`,
        )
        .replace(
          "#include <color_fragment>",
          `#include <color_fragment>
          float rim = clamp(length(vWaterLocal) / uRadius, 0.0, 1.0);
          diffuseColor.rgb *= mix(uDeep, uShallow, smoothstep(0.35, 1.0, rim));`,
        )
        .replace(
          "#include <normal_fragment_maps>",
          `#include <normal_fragment_maps>
          vec2 wg = waterSlope(vWaterWorld.xz, uTime);
          vec3 waterN = normalize(vec3(-wg.x, 1.0, -wg.y));
          normal = normalize((viewMatrix * vec4(waterN, 0.0)).xyz);`,
        )
        .replace(
          "#include <emissivemap_fragment>",
          `#include <emissivemap_fragment>
          float glint = pow(max(0.0, sin(vWaterWorld.x * 6.0 + uTime * 0.9) * sin(vWaterWorld.z * 5.0 - uTime * 0.7)), 12.0);
          totalEmissiveRadiance += vec3(0.05, 0.07, 0.08) * glint;`,
        );
    };
    return m;
  }, [radius]);

  useLayoutEffect(() => () => material.dispose(), [material]);

  useFrame(({ clock }) => {
    const u = material.userData.uniforms as { uTime: { value: number } };
    // Reduced motion: frozen, still reads as water.
    u.uTime.value = reducedMotion ? 4.0 : clock.elapsedTime;
  });

  return (
    <mesh material={material} rotation-x={-Math.PI / 2} position-y={y} renderOrder={2} receiveShadow>
      <circleGeometry args={[radius, 128]} />
    </mesh>
  );
}

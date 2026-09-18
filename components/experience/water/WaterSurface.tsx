"use client";

import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useMemo } from "react";
import * as THREE from "three";
import { Reflector } from "three/examples/jsm/objects/Reflector.js";
import { QUALITY } from "@/lib/experience/quality";
import { useExperience } from "@/lib/experience/store";

/**
 * Architectural basin water, art-directed on design/references/01-home-final.png:
 * a clear, shallow pool whose surface is mostly a broken mirror of the sunlit façade and the sky,
 * with sparse sparkles, a turquoise body and a pale floor crossed by moving caustics.
 *
 *  - Reflection: a real planar reflection (three's Reflector, high tier) distorted by procedural
 *    ripples. Its render only runs when the water is on screen. Other tiers use an analytic sky.
 *  - Transparency: Schlick Fresnel; premultiplied output so the floor shows through (1 − F)·T.
 *  - Floor: <PoolFloor/> adds animated caustics (own Worley-edge network, no third-party shader).
 */

const shared = /* glsl */ `
  float wHash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float wNoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(wHash(i), wHash(i + vec2(1.0, 0.0)), u.x), mix(wHash(i + vec2(0.0, 1.0)), wHash(i + vec2(1.0, 1.0)), u.x), u.y);
  }
`;

const waterVertex = /* glsl */ `
  uniform mat4 textureMatrix;
  varying vec4 vReflUv;
  varying vec3 vWorld;
  varying vec2 vLocal;
  void main() {
    vReflUv = textureMatrix * vec4(position, 1.0);
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorld = world.xyz;
    vLocal = position.xy;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

const waterFragment = /* glsl */ `
  uniform sampler2D tDiffuse;
  uniform vec3 color;
  uniform float uHasReflection;
  uniform float uTime;
  uniform float uRadius;
  uniform float uAmp;
  uniform float uDistort;
  uniform float uGlint;
  uniform float uSkyVeil;
  uniform vec3 uGlintDir;
  uniform vec3 uGlintColor;
  uniform vec3 uScatter;
  uniform vec3 uZenith;
  uniform vec3 uHorizon;
  varying vec4 vReflUv;
  varying vec3 vWorld;
  varying vec2 vLocal;
  ${shared}

  // Gentle swell + two octaves of drifting chop (small, dense wavelets as in the reference).
  float waterHeight(vec2 p, float t) {
    p *= 1.7;
    float h = 0.0;
    h += sin(dot(p, vec2(0.8, 0.6)) * 2.1 + t * 0.9) * 0.5;
    h += sin(dot(p, vec2(-0.5, 0.86)) * 3.3 - t * 1.1) * 0.3;
    h += sin(dot(p, vec2(0.95, -0.3)) * 5.7 + t * 1.5) * 0.18;
    h += (wNoise(p * 6.0 + vec2(t * 0.35, -t * 0.2)) - 0.5) * 0.35;
    h += (wNoise(p * 13.0 - vec2(t * 0.5, t * 0.3)) - 0.5) * 0.16;
    return h;
  }

  void main() {
    vec2 p = vWorld.xz;
    float e = 0.015;
    float h0 = waterHeight(p, uTime);
    vec3 N = normalize(vec3(
      (h0 - waterHeight(p + vec2(e, 0.0), uTime)) / e * uAmp,
      1.0,
      (h0 - waterHeight(p + vec2(0.0, e), uTime)) / e * uAmp
    ));
    vec3 V = normalize(cameraPosition - vWorld);
    float NdV = clamp(dot(N, V), 0.0, 1.0);
    float F = 0.02 + 0.98 * pow(1.0 - NdV, 5.0);
    vec3 R = reflect(-V, N);

    vec3 sky = mix(uHorizon, uZenith, pow(clamp(R.y, 0.0, 1.0), 0.55));
    vec3 refl = sky;
    if (uHasReflection > 0.5) {
      vec4 uv = vReflUv;
      // Ripples stretch reflections along the view direction (vertical streaks on screen).
      uv.xy += vec2(N.x * 0.35, N.z * 1.25) * uDistort * uv.w;
      // A share of sky keeps the mirror luminous: dark foliage reads as soft shapes, not mud.
      refl = mix(texture2DProj(tDiffuse, uv).rgb, sky, uSkyVeil);
    }

    // Sun sparkles on the steeper ripple facets, twinkling as the chop drifts.
    float twinkle = smoothstep(0.55, 0.9, wNoise(p * 9.0 + vec2(uTime * 1.3, -uTime * 0.9)));
    float glint = pow(max(dot(R, uGlintDir), 0.0), 900.0) * uGlint * (0.35 + twinkle);

    // Clear shallow water: transmittance drops at grazing angles; the body scatters turquoise.
    float T = mix(0.8, 0.4, 1.0 - NdV);
    float body = (1.0 - F) * (1.0 - T);
    float rim = smoothstep(0.55, 1.0, length(vLocal) / uRadius);
    vec3 scatter = uScatter * mix(0.8, 1.1, rim);

    vec3 col = refl * F + scatter * body + uGlintColor * glint;
    float alpha = clamp(F + body, 0.0, 1.0);
    gl_FragColor = vec4(col, alpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

const color = (hex: string) => new THREE.Color(hex);

function waterShader(radius: number) {
  return {
    name: "D2SWater",
    uniforms: {
      tDiffuse: { value: null as THREE.Texture | null },
      color: { value: color("#ffffff") },
      textureMatrix: { value: new THREE.Matrix4() },
      uHasReflection: { value: 0 },
      uTime: { value: 0 },
      uRadius: { value: radius },
      uAmp: { value: 0.06 },
      uDistort: { value: 0.06 },
      uGlint: { value: 70 },
      uSkyVeil: { value: 0.3 },
      uGlintDir: { value: new THREE.Vector3(-0.62, 0.16, -0.77).normalize() },
      uGlintColor: { value: color("#fff4e2") },
      uScatter: { value: color("#62c6de") },
      uZenith: { value: color("#8fbaf0") },
      uHorizon: { value: color("#eef4fb") },
    },
    vertexShader: waterVertex,
    fragmentShader: waterFragment,
  };
}

function configure(material: THREE.ShaderMaterial) {
  material.transparent = true;
  material.premultipliedAlpha = true;
  material.depthWrite = false;
}

interface WaterSurfaceProps {
  radius: number;
  /** Height of the water plane, metres. */
  y: number;
}

export function WaterSurface({ radius, y }: WaterSurfaceProps) {
  const reducedMotion = useExperience((s) => s.reducedMotion);
  const reflections = useExperience((s) => QUALITY[s.quality].reflections);

  const water = useMemo(() => {
    const geometry = new THREE.CircleGeometry(radius, 128);
    if (reflections && typeof window !== "undefined") {
      const scale = Math.min(1.5, window.devicePixelRatio || 1) * 0.6;
      const reflector = new Reflector(geometry, {
        shader: waterShader(radius),
        textureWidth: Math.min(1400, Math.round(window.innerWidth * scale)),
        textureHeight: Math.min(900, Math.round(window.innerHeight * scale)),
        clipBias: 0.003,
        multisample: 0,
      });
      const material = reflector.material as THREE.ShaderMaterial;
      material.uniforms.uHasReflection.value = 1;
      configure(material);
      return reflector as THREE.Mesh;
    }
    const material = new THREE.ShaderMaterial(waterShader(radius));
    configure(material);
    return new THREE.Mesh(geometry, material);
  }, [radius, reflections]);

  useLayoutEffect(
    () => () => {
      water.geometry.dispose();
      if (water instanceof Reflector) water.dispose();
      else (water.material as THREE.Material).dispose();
    },
    [water],
  );

  useFrame(({ clock }) => {
    const u = (water.material as THREE.ShaderMaterial).uniforms;
    // Reduced motion: frozen, still reads as water.
    u.uTime.value = reducedMotion ? 4.0 : clock.elapsedTime;
  });

  return <primitive object={water} rotation-x={-Math.PI / 2} position-y={y} renderOrder={2} />;
}

const causticsGlsl = /* glsl */ `
  vec2 cHash(vec2 p) {
    p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
    return fract(sin(p) * 43758.5453);
  }
  // Distance between the two nearest moving cell points: 0 on the cell borders.
  float cellEdge(vec2 p, float t) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    float d1 = 8.0;
    float d2 = 8.0;
    for (int y = -1; y <= 1; y++) {
      for (int x = -1; x <= 1; x++) {
        vec2 g = vec2(float(x), float(y));
        vec2 o = 0.5 + 0.42 * sin(t + 6.2831 * cHash(i + g));
        float d = length(g + o - f);
        if (d < d1) { d2 = d1; d1 = d; } else if (d < d2) { d2 = d; }
      }
    }
    return d2 - d1;
  }
  float caustics(vec2 p, float t) {
    p *= 2.6;
    p += 0.35 * vec2(sin(p.y * 1.3 + t * 0.7), cos(p.x * 1.1 - t * 0.6));
    float c = exp(-cellEdge(p, t * 0.8) * 9.0) + 0.6 * exp(-cellEdge(p * 1.6 + 7.3, t * 1.1 + 2.0) * 11.0);
    return c * c;
  }
`;

/** Pale basin floor seen through the water, crossed by sunlit caustics. */
export function PoolFloor({ radius, y }: WaterSurfaceProps) {
  const reducedMotion = useExperience((s) => s.reducedMotion);
  const material = useMemo(() => {
    const m = new THREE.MeshStandardMaterial({ color: "#c2e3ea", roughness: 0.85, metalness: 0 });
    const uniforms = { uTime: { value: 0 }, uCaustic: { value: 0.5 } };
    m.userData.uniforms = uniforms;
    m.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, uniforms);
      shader.vertexShader = `varying vec3 vCausticWorld;\n${shader.vertexShader}`.replace(
        "#include <begin_vertex>",
        "#include <begin_vertex>\n  vCausticWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;",
      );
      shader.fragmentShader = `uniform float uTime;\nuniform float uCaustic;\nvarying vec3 vCausticWorld;\n${causticsGlsl}\n${shader.fragmentShader}`.replace(
        "#include <emissivemap_fragment>",
        `#include <emissivemap_fragment>
        totalEmissiveRadiance += vec3(1.0, 0.97, 0.9) * caustics(vCausticWorld.xz, uTime) * uCaustic;`,
      );
    };
    m.customProgramCacheKey = () => "pool-caustics";
    return m;
  }, []);

  useLayoutEffect(() => () => material.dispose(), [material]);

  useFrame(({ clock }) => {
    const u = material.userData.uniforms as { uTime: { value: number } };
    u.uTime.value = reducedMotion ? 4.0 : clock.elapsedTime;
  });

  return (
    <mesh material={material} rotation-x={-Math.PI / 2} position-y={y} receiveShadow>
      <circleGeometry args={[radius, 96]} />
    </mesh>
  );
}

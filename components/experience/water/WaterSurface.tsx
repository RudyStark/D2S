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
  uniform float uFresnelMin;
  uniform float uFresnelScale;
  uniform float uGlintSharp;
  uniform vec2 uTransmit;
  uniform vec2 uStreak;
  uniform float uFreq;
  uniform float uSwell;
  uniform vec3 uGlintDir;
  uniform vec3 uGlintColor;
  uniform vec3 uScatter;
  uniform vec3 uZenith;
  uniform vec3 uHorizon;
  varying vec4 vReflUv;
  varying vec3 vWorld;
  varying vec2 vLocal;
  ${shared}

  mat2 wRot(float a) {
    float c = cos(a);
    float s = sin(a);
    return mat2(c, -s, s, c);
  }

  // Two weak, oblique, non-harmonic swells + three octaves of wind chop on rotated drifting
  // domains: no axis-aligned or periodic pattern the eye can lock onto (no bands).
  float waterHeight(vec2 p, float t) {
    p *= uFreq;
    float h = 0.0;
    h += sin(dot(p, vec2(0.62, 0.78)) * 1.15 + t * 0.55) * 0.22 * uSwell;
    h += sin(dot(p, vec2(-0.83, 0.55)) * 1.9 - t * 0.7) * 0.14 * uSwell;
    h += (wNoise(wRot(0.6) * p * 3.4 + vec2(t * 0.28, -t * 0.17)) - 0.5) * 0.42;
    h += (wNoise(wRot(-1.1) * p * 7.3 - vec2(t * 0.41, t * 0.23)) - 0.5) * 0.24;
    h += (wNoise(wRot(2.3) * p * 15.1 + vec2(-t * 0.6, t * 0.35)) - 0.5) * 0.11;
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
    float F = mix((0.02 + 0.98 * pow(1.0 - NdV, 5.0)) * uFresnelScale, 1.0, uFresnelMin);
    vec3 R = reflect(-V, N);

    // The veil samples the sky a little higher than the mirror direction: the pool keeps a clear blue.
    vec3 sky = mix(uHorizon, uZenith, pow(clamp(R.y + 0.28, 0.0, 1.0), 0.55));
    // Without a reflector (low tier), stand in for the pale façade it would mirror: the look stays close.
    vec3 refl = mix(vec3(0.9, 0.92, 0.94), sky, uSkyVeil);
    if (uHasReflection > 0.5) {
      vec4 uv = vReflUv;
      // Ripples stretch reflections along the view direction (vertical streaks on screen).
      uv.xy += vec2(N.x * uStreak.x, N.z * uStreak.y) * uDistort * uv.w;
      // A share of sky keeps the mirror luminous: dark foliage reads as soft shapes, not mud.
      refl = mix(texture2DProj(tDiffuse, uv).rgb, sky, uSkyVeil);
    }

    // Sun sparkles on the steeper ripple facets, twinkling as the chop drifts.
    float twinkle = smoothstep(0.55, 0.9, wNoise(p * 9.0 + vec2(uTime * 1.3, -uTime * 0.9)));
    float glint = pow(max(dot(R, uGlintDir), 0.0), uGlintSharp) * uGlint * (0.35 + twinkle) * mix(0.45, 1.0, uHasReflection);

    // Clear shallow water: transmittance drops at grazing angles; the body scatters turquoise.
    float T = mix(uTransmit.x, uTransmit.y, 1.0 - NdV);
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

/**
 * Water moods, selectable with ?water=1|2|3 to compare (0 = the default).
 *  0 référence — matched on 01-home-final: saturated sky blue, dense small ripples, reflections broken
 *    into vertical white streaks (measured: blue − red ≈ +40, median L ≈ 195, highlights ≈ 250).
 *  1 miroir — almost still, strong clean reflections of the façade and the sky (architectural).
 *  2 lagon  — very transparent, floor and caustics visible, light turquoise.
 *  3 vivant — livelier ripples and more sun sparkles (closest to the motion in 01-home-final).
 */
interface WaterPreset {
  amp: number;
  distort: number;
  glint: number;
  skyVeil: number;
  scatter: string;
  /** Minimum reflectance (0 = physical Fresnel). */
  fresnelMin: number;
  /** Fresnel scale (< 1 = stylised extra transparency at grazing angles). */
  fresnelScale: number;
  /** Sparkle sharpness (higher = smaller, rarer points). */
  glintSharp: number;
  /** Reflection distortion across / along the view (along = vertical streaks on screen). */
  streak: [number, number];
  /** Sky seen in the water (zenith, horizon). */
  sky: [string, string];
  /** Ripple frequency multiplier and weight of the long swell (0 = chop only). */
  freq: number;
  swell: number;
  /** Transmittance facing / grazing. */
  transmit: [number, number];
  speed: number;
  floor: string;
  caustic: number;
}

const WATER_PRESETS: Record<string, WaterPreset> = {
  "0": { amp: 0.05, distort: 0.075, streak: [0.22, 1.9], freq: 2.6, swell: 0.35, glint: 36, glintSharp: 520, skyVeil: 0.52, sky: ["#3386d4", "#a8cdee"], scatter: "#3f86ba", fresnelMin: 0.08, fresnelScale: 1, transmit: [0.62, 0.3], speed: 1, floor: "#c8dbe5", caustic: 0.3 },
  "1": { amp: 0.006, distort: 0.01, streak: [0.35, 1.25], sky: ["#8fbaf0", "#eef4fb"], freq: 1, swell: 1, glint: 3, glintSharp: 1400, skyVeil: 0.12, scatter: "#9fc3cc", fresnelMin: 0.5, fresnelScale: 1, transmit: [0.6, 0.25], speed: 0.45, floor: "#dde3e2", caustic: 0.08 },
  "2": { amp: 0.028, distort: 0.035, streak: [0.35, 1.25], sky: ["#8fbaf0", "#eef4fb"], freq: 1, swell: 1, glint: 8, glintSharp: 900, skyVeil: 0.3, scatter: "#2fb6cf", fresnelMin: 0, fresnelScale: 0.42, transmit: [0.9, 0.55], speed: 0.85, floor: "#b9e6ec", caustic: 0.95 },
  "3": { amp: 0.12, distort: 0.12, streak: [0.35, 1.25], sky: ["#8fbaf0", "#eef4fb"], freq: 1, swell: 1, glint: 90, glintSharp: 420, skyVeil: 0.34, scatter: "#86c0d2", fresnelMin: 0.04, fresnelScale: 1, transmit: [0.78, 0.38], speed: 1.45, floor: "#dfe5e3", caustic: 0.4 },
};

function waterPreset(): WaterPreset {
  if (typeof window === "undefined") return WATER_PRESETS["0"];
  return WATER_PRESETS[new URLSearchParams(window.location.search).get("water") ?? "0"] ?? WATER_PRESETS["0"];
}

function waterShader(radius: number) {
  const w = waterPreset();
  return {
    name: "D2SWater",
    uniforms: {
      tDiffuse: { value: null as THREE.Texture | null },
      color: { value: color("#ffffff") },
      textureMatrix: { value: new THREE.Matrix4() },
      uHasReflection: { value: 0 },
      uTime: { value: 0 },
      uRadius: { value: radius },
      uAmp: { value: w.amp },
      uDistort: { value: w.distort },
      uGlint: { value: w.glint },
      uSkyVeil: { value: w.skyVeil },
      uFresnelMin: { value: w.fresnelMin },
      uFresnelScale: { value: w.fresnelScale },
      uGlintSharp: { value: w.glintSharp },
      uTransmit: { value: new THREE.Vector2(...w.transmit) },
      uGlintDir: { value: new THREE.Vector3(-0.62, 0.16, -0.77).normalize() },
      uGlintColor: { value: color("#fff4e2") },
      uScatter: { value: color(w.scatter) },
      uZenith: { value: color(w.sky[0]) },
      uHorizon: { value: color(w.sky[1]) },
      uStreak: { value: new THREE.Vector2(...w.streak) },
      uFreq: { value: w.freq },
      uSwell: { value: w.swell },
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
  const reflectionScale = useExperience((s) => QUALITY[s.quality].waterReflectionScale);
  const speed = useMemo(() => waterPreset().speed, []);

  const water = useMemo(() => {
    const geometry = new THREE.CircleGeometry(radius, 128);
    if (reflections && typeof window !== "undefined") {
      const scale = Math.min(1.5, window.devicePixelRatio || 1) * reflectionScale;
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
  }, [radius, reflections, reflectionScale]);

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
    u.uTime.value = reducedMotion ? 4.0 : clock.elapsedTime * speed;
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

/** Pale stone basin floor seen through the water, crossed by soft sunlit caustics. */
export function PoolFloor({ radius, y }: WaterSurfaceProps) {
  const reducedMotion = useExperience((s) => s.reducedMotion);
  const material = useMemo(() => {
    // Pale stone; the water adds the tint.
    const w = waterPreset();
    const m = new THREE.MeshStandardMaterial({ color: w.floor, roughness: 0.85, metalness: 0 });
    const uniforms = { uTime: { value: 0 }, uCaustic: { value: w.caustic } };
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

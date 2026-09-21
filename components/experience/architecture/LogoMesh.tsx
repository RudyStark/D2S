"use client";

import { useFrame, useLoader } from "@react-three/fiber";
import { useLayoutEffect, useMemo } from "react";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader.js";
import { TessellateModifier } from "three/examples/jsm/modifiers/TessellateModifier.js";
import { LOGO_SRC } from "@/lib/brand";
import { useExperience } from "@/lib/experience/store";

interface LogoMeshProps {
  /** Final width in metres. */
  width: number;
  /** Relief of the D2S mark, metres. The body extends backwards (−Z) from the origin plane. */
  depth?: number;
  /** Wrap the logo around a vertical cylinder of this radius (curved walls). */
  bendRadius?: number;
  /** Vertical stretch (reference signage is slightly taller than the source artwork). */
  scaleY?: number;
  /** Rounded edge on the extruded mark, metres (catches a thin highlight on the letter edges). */
  bevel?: number;
  /** Give the stroked lettering (STUDIO) a real thickness instead of a flat ribbon, metres. */
  strokeDepth?: number;
  castShadow?: boolean;
  material: THREE.Material;
  /**
   * Give the "AI" (path id="ai" in the brand SVG) its own living material, like the header logo: brand
   * blue, a glow that breathes and a light that sweeps across the glyph.
   */
  accent?: boolean;
  src?: string;
}

/** Same rhythm as the header logo (components/ui/Logo.module.css). */
const GLOW_PERIOD = 4.5;
const SWEEP_PERIOD = 5.5;
const SWEEP_DURATION = 1.6;

/**
 * Material of the 3D "AI": brand gradient (bright blue top-left → deep blue), emissive glow that breathes,
 * and a white band sweeping along the glyph (local x, normalised on the glyph's own box).
 */
function useAccentMaterial(box: THREE.Box3 | null) {
  const reducedMotion = useExperience((s) => s.reducedMotion);
  const material = useMemo(() => {
    const m = new THREE.MeshStandardMaterial({
      color: "#1c6cff",
      roughness: 0.32,
      metalness: 0.15,
      emissive: "#0e5ef0",
      emissiveIntensity: 1,
    });
    const uniforms = {
      uGlow: { value: 0.6 },
      uSweep: { value: -1 },
      uBoxMin: { value: new THREE.Vector2() },
      uBoxSize: { value: new THREE.Vector2(1, 1) },
    };
    m.userData.uniforms = uniforms;
    m.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, uniforms);
      shader.vertexShader = `varying vec2 vLocal;\n${shader.vertexShader}`.replace(
        "#include <begin_vertex>",
        "#include <begin_vertex>\n  vLocal = position.xy;",
      );
      shader.fragmentShader = `uniform float uGlow;\nuniform float uSweep;\nuniform vec2 uBoxMin;\nuniform vec2 uBoxSize;\nvarying vec2 vLocal;\n${shader.fragmentShader}`
        .replace(
          "#include <color_fragment>",
          `#include <color_fragment>
        vec2 uvAi = clamp((vLocal - uBoxMin) / uBoxSize, 0.0, 1.0);
        // Brand gradient: bright blue at the top-left, deep blue at the bottom-right.
        diffuseColor.rgb = mix(vec3(0.02, 0.3, 0.95), vec3(0.012, 0.06, 0.32), clamp(0.55 * (1.0 - uvAi.y) + 0.45 * uvAi.x, 0.0, 1.0));`,
        )
        .replace(
          "#include <emissivemap_fragment>",
          `#include <emissivemap_fragment>
        totalEmissiveRadiance *= uGlow;
        float sweepD = uvAi.x - uSweep + 0.35 * (uvAi.y - 0.5);
        totalEmissiveRadiance += vec3(0.75, 0.88, 1.0) * 1.8 * exp(-sweepD * sweepD / 0.006);`,
        );
    };
    m.customProgramCacheKey = () => "logo-ai-accent";
    return m;
  }, []);

  useLayoutEffect(() => {
    if (!box) return;
    const u = material.userData.uniforms;
    u.uBoxMin.value.set(box.min.x, box.min.y);
    u.uBoxSize.value.set(Math.max(1e-4, box.max.x - box.min.x), Math.max(1e-4, box.max.y - box.min.y));
  }, [box, material]);

  useLayoutEffect(() => () => material.dispose(), [material]);

  // Priority 0: a positive priority would stop R3F's own rendering on the tiers without a composer.
  useFrame(({ clock }) => {
    const u = material.userData.uniforms;
    if (reducedMotion) {
      u.uGlow.value = 0.4;
      u.uSweep.value = -2;
      return;
    }
    const t = clock.elapsedTime;
    u.uGlow.value = 0.28 + 0.32 * (0.5 - 0.5 * Math.cos((t / GLOW_PERIOD) * Math.PI * 2));
    const k = (t % SWEEP_PERIOD) / SWEEP_DURATION;
    u.uSweep.value = k < 1 ? -0.35 + 1.7 * (k * k * (3 - 2 * k)) : -2;
  });

  return material;
}

type SvgStyle = { fill?: string; stroke?: string } & Parameters<typeof SVGLoader.pointsToStroke>[1];

function normalizeGeometry(g: THREE.BufferGeometry) {
  const out = g.index ? g.toNonIndexed() : g;
  if (!out.attributes.normal) out.computeVertexNormals();
  for (const key of Object.keys(out.attributes)) {
    if (key !== "position" && key !== "normal") out.deleteAttribute(key);
  }
  return out;
}

/**
 * Thickens a flat ribbon (triangles in the z = 0 plane, final space) backwards by `depth`:
 * front faces turned to +Z, a mirrored back, and side walls along the boundary edges.
 */
function thickenRibbon(g: THREE.BufferGeometry, depth: number) {
  const src = g.attributes.position as THREE.BufferAttribute;
  const tris: THREE.Vector3[][] = [];
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const c = new THREE.Vector3();
  for (let i = 0; i < src.count; i += 3) {
    a.fromBufferAttribute(src, i);
    b.fromBufferAttribute(src, i + 1);
    c.fromBufferAttribute(src, i + 2);
    const nz = (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
    if (Math.abs(nz) < 1e-12) continue;
    tris.push(nz > 0 ? [a.clone(), b.clone(), c.clone()] : [a.clone(), c.clone(), b.clone()]);
  }
  const key = (v: THREE.Vector3) => `${v.x.toFixed(5)},${v.y.toFixed(5)}`;
  const edges = new Map<string, { from: THREE.Vector3; to: THREE.Vector3; n: number }>();
  for (const t of tris) {
    for (let e = 0; e < 3; e++) {
      const p = t[e];
      const q = t[(e + 1) % 3];
      const k = [key(p), key(q)].sort().join("|");
      const hit = edges.get(k);
      if (hit) hit.n++;
      else edges.set(k, { from: p, to: q, n: 1 });
    }
  }
  const out: number[] = [];
  const push = (...vs: THREE.Vector3[]) => vs.forEach((v) => out.push(v.x, v.y, v.z));
  const back = (v: THREE.Vector3) => new THREE.Vector3(v.x, v.y, v.z - depth);
  for (const [p, q, r] of tris) {
    push(p, q, r);
    push(back(p), back(r), back(q));
  }
  for (const { from, to, n } of edges.values()) {
    if (n !== 1) continue;
    // Interior lies left of from→to (CCW front): the wall faces right, outwards.
    push(from, back(to), to);
    push(from, back(from), back(to));
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(out, 3));
  geo.computeVertexNormals();
  return geo;
}

/**
 * The brand logo in 3D, built from the same SVG file as the header.
 * Filled paths are extruded; stroke-only paths become ribbons, optionally thickened. With `accent`, the
 * "AI" is split off and gets its own animated brand-blue material.
 */
export function LogoMesh({
  width,
  depth = 0.05,
  bendRadius,
  scaleY = 1,
  bevel = 0,
  strokeDepth = 0,
  castShadow = false,
  material,
  accent = false,
  src = LOGO_SRC,
}: LogoMeshProps) {
  const svg = useLoader(SVGLoader, src);

  const { geometry, accentGeometry } = useMemo(() => {
    const parts: THREE.BufferGeometry[] = [];
    const accentParts: THREE.BufferGeometry[] = [];
    const box = new THREE.Box2();
    for (const path of svg.paths) {
      for (const sub of path.subPaths) for (const pt of sub.getPoints()) box.expandByPoint(pt);
    }
    const svgWidth = box.max.x - box.min.x || 1;
    const s = width / svgWidth;
    const bevelUnits = bevel / s;
    const depthUnits = Math.max(0.001, depth / s - bevelUnits * 2);
    const cx = (box.min.x + box.max.x) / 2;
    const cy = (box.min.y + box.max.y) / 2;
    // Centre, flip SVG's Y-down, push the relief backwards (det > 0: winding preserved).
    const place = (g: THREE.BufferGeometry) => {
      g.translate(-cx, -cy, bevelUnits);
      g.scale(s, -s * scaleY, -s);
      return g;
    };

    for (const path of svg.paths) {
      const style = (path.userData?.style ?? {}) as SvgStyle;
      const node = path.userData?.node as Element | undefined;
      const target = accent && node?.getAttribute("id") === "ai" ? accentParts : parts;
      const filled = !!style.fill && style.fill !== "none";
      if (filled) {
        for (const shape of path.toShapes()) {
          const extruded = new THREE.ExtrudeGeometry(shape, {
            depth: depthUnits,
            bevelEnabled: bevelUnits > 0,
            bevelSize: bevelUnits,
            bevelThickness: bevelUnits,
            bevelSegments: 3,
            curveSegments: 12,
          });
          target.push(place(normalizeGeometry(extruded)));
        }
      }
      // Stroke-only lettering becomes a ribbon; a hairline stroke on a filled shape is a 2D finish only.
      if (!filled && style.stroke && style.stroke !== "none") {
        for (const sub of path.subPaths) {
          const stroke = SVGLoader.pointsToStroke(sub.getPoints(24), style);
          if (!stroke) continue;
          const ribbon = normalizeGeometry(stroke);
          ribbon.translate(-cx, -cy, 0);
          if (strokeDepth > 0) {
            ribbon.scale(s, -s * scaleY, 1);
            parts.push(thickenRibbon(ribbon, strokeDepth));
          } else {
            // Unchanged flat ribbon (same transform as the extruded mark: winding preserved).
            parts.push(ribbon.scale(s, -s * scaleY, -s));
          }
        }
      }
    }

    const finish = (list: THREE.BufferGeometry[]) => {
      if (!list.length) return null;
      let merged = mergeGeometries(list, false)!;
      list.forEach((p) => p.dispose());
      if (bendRadius) {
        // Long cap/stroke triangles would cut through the curve: subdivide first.
        const tessellated = new TessellateModifier(0.04, 8).modify(merged);
        merged.dispose();
        merged = tessellated;
        const pos = merged.attributes.position as THREE.BufferAttribute;
        const nor = merged.attributes.normal as THREE.BufferAttribute;
        for (let i = 0; i < pos.count; i++) {
          const x = pos.getX(i);
          const z = pos.getZ(i);
          const r = bendRadius + z;
          const theta = x / bendRadius;
          const c = Math.cos(theta);
          const sn = Math.sin(theta);
          pos.setXYZ(i, r * sn, pos.getY(i), r * c - bendRadius);
          // Rotate the normal with the surface so caps stay smoothly shaded.
          const nx = nor.getX(i);
          const nz = nor.getZ(i);
          nor.setXYZ(i, nx * c + nz * sn, nor.getY(i), -nx * sn + nz * c);
        }
      }
      merged.computeBoundingSphere();
      merged.computeBoundingBox();
      return merged;
    };

    return { geometry: finish(parts)!, accentGeometry: finish(accentParts) };
  }, [svg, width, depth, bendRadius, scaleY, bevel, strokeDepth, accent]);

  const accentMaterial = useAccentMaterial(accentGeometry?.boundingBox ?? null);

  useLayoutEffect(
    () => () => {
      geometry.dispose();
      accentGeometry?.dispose();
    },
    [geometry, accentGeometry],
  );

  return (
    <group>
      <mesh geometry={geometry} material={material} castShadow={castShadow} receiveShadow={false} />
      {accentGeometry && <mesh geometry={accentGeometry} material={accentMaterial} castShadow={castShadow} receiveShadow={false} />}
    </group>
  );
}

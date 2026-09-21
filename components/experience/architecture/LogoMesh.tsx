"use client";

import { useLoader } from "@react-three/fiber";
import { useLayoutEffect, useMemo } from "react";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader.js";
import { TessellateModifier } from "three/examples/jsm/modifiers/TessellateModifier.js";
import { LOGO_SRC } from "@/lib/brand";

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
  src?: string;
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
 * Filled paths (D2S) are extruded; stroked paths (STUDIO) become ribbons, optionally thickened.
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
  src = LOGO_SRC,
}: LogoMeshProps) {
  const svg = useLoader(SVGLoader, src);

  const geometry = useMemo(() => {
    const parts: THREE.BufferGeometry[] = [];
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
      if (style.fill && style.fill !== "none") {
        for (const shape of path.toShapes()) {
          const extruded = new THREE.ExtrudeGeometry(shape, {
            depth: depthUnits,
            bevelEnabled: bevelUnits > 0,
            bevelSize: bevelUnits,
            bevelThickness: bevelUnits,
            bevelSegments: 3,
            curveSegments: 12,
          });
          parts.push(place(normalizeGeometry(extruded)));
        }
      }
      if (style.stroke && style.stroke !== "none") {
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

    let merged = mergeGeometries(parts, false)!;
    parts.forEach((p) => p.dispose());

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
    return merged;
  }, [svg, width, depth, bendRadius, scaleY, bevel, strokeDepth]);

  useLayoutEffect(() => () => geometry.dispose(), [geometry]);

  return <mesh geometry={geometry} material={material} castShadow={castShadow} receiveShadow={false} />;
}

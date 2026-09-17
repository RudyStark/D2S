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
 * The brand logo in 3D, built from the same SVG file as the header.
 * Filled paths (D2S) are extruded; stroked paths (STUDIO) become flat ribbons.
 */
export function LogoMesh({ width, depth = 0.05, bendRadius, material, src = LOGO_SRC }: LogoMeshProps) {
  const svg = useLoader(SVGLoader, src);

  const geometry = useMemo(() => {
    const parts: THREE.BufferGeometry[] = [];
    const box = new THREE.Box2();
    for (const path of svg.paths) {
      for (const sub of path.subPaths) for (const pt of sub.getPoints()) box.expandByPoint(pt);
    }
    const svgWidth = box.max.x - box.min.x || 1;
    const s = width / svgWidth;
    const depthUnits = depth / s;

    for (const path of svg.paths) {
      const style = (path.userData?.style ?? {}) as SvgStyle;
      if (style.fill && style.fill !== "none") {
        for (const shape of path.toShapes()) {
          parts.push(normalizeGeometry(new THREE.ExtrudeGeometry(shape, { depth: depthUnits, bevelEnabled: false, curveSegments: 12 })));
        }
      }
      if (style.stroke && style.stroke !== "none") {
        for (const sub of path.subPaths) {
          const stroke = SVGLoader.pointsToStroke(sub.getPoints(24), style);
          if (stroke) parts.push(normalizeGeometry(stroke));
        }
      }
    }

    let merged = mergeGeometries(parts, false)!;
    parts.forEach((p) => p.dispose());
    // Centre, flip SVG's Y-down, push the relief backwards (det > 0: winding preserved).
    const cx = (box.min.x + box.max.x) / 2;
    const cy = (box.min.y + box.max.y) / 2;
    merged.translate(-cx, -cy, 0);
    merged.scale(s, -s, -s);

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
  }, [svg, width, depth, bendRadius]);

  useLayoutEffect(() => () => geometry.dispose(), [geometry]);

  return <mesh geometry={geometry} material={material} castShadow={false} receiveShadow={false} />;
}

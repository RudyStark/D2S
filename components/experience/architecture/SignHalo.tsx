"use client";

import { useLoader } from "@react-three/fiber";
import { useLayoutEffect, useMemo } from "react";
import * as THREE from "three";
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader.js";
import { LOGO_SRC, LOGO_VIEWBOX } from "@/lib/brand";

interface SignHaloProps {
  /** Same width / scaleY as the LogoMesh it sits behind. */
  width: number;
  scaleY?: number;
  /** Peak brightness of the halo (HDR, additive on the panel face). */
  intensity?: number;
  color?: string;
  /** Wrap onto a vertical cylinder of this radius (same convention as LogoMesh's bendRadius). */
  bendRadius?: number;
}

/** Pixels per metre of the halo mask (it is blurred: resolution only needs to hold the letter shapes). */
const PPM = 520;
/** Halo reach around the letters, metres. */
const MARGIN = 0.18;

/**
 * Halo lighting (reverse channel letters): LEDs behind stand-off letters wash the panel face with a
 * soft white light that follows each glyph's outline. The letters themselves stay dark in front of it.
 * Built from the same SVG as the letters, rasterised and blurred once (two falloffs: a tight rim and a
 * wide bloom), drawn additively on the face, just under the letters.
 */
export function SignHalo({ width, scaleY = 1, intensity = 2.6, color = "#fff7ee", bendRadius }: SignHaloProps) {
  const svg = useLoader(SVGLoader, LOGO_SRC);
  // Through TextureLoader (tracked by the site loader); its `.image` is the decoded SVG. Distinct URL:
  // THREE.Cache already holds LOGO_SRC as *text* (SVGLoader), and the image loader would get that string.
  const logoTexture = useLoader(THREE.TextureLoader, `${LOGO_SRC}?raster`);

  const { material, geometry } = useMemo(() => {
    // LogoMesh centres the path points' bounding box and scales it to `width`: reproduce that mapping.
    const box = new THREE.Box2();
    for (const path of svg.paths) for (const sub of path.subPaths) for (const pt of sub.getPoints()) box.expandByPoint(pt);
    const s = width / (box.max.x - box.min.x || 1);
    const cx = (box.min.x + box.max.x) / 2;
    const cy = (box.min.y + box.max.y) / 2;
    const vbW = LOGO_VIEWBOX.width * s;
    const vbH = LOGO_VIEWBOX.height * s * scaleY;
    const planeWidth = vbW + MARGIN * 2;
    const planeHeight = vbH + MARGIN * 2;

    const cw = Math.round(planeWidth * PPM);
    const ch = Math.round(planeHeight * PPM);
    const mx = MARGIN * PPM;

    // White glyph silhouettes.
    const shape = document.createElement("canvas");
    shape.width = cw;
    shape.height = ch;
    const sctx = shape.getContext("2d")!;
    sctx.drawImage(logoTexture.image as HTMLImageElement, mx, mx, cw - mx * 2, ch - mx * 2);
    sctx.globalCompositeOperation = "source-in";
    sctx.fillStyle = "#fff";
    sctx.fillRect(0, 0, cw, ch);

    // Greyscale mask (alphaMap reads the green channel): wide bloom + tight rim.
    const mask = document.createElement("canvas");
    mask.width = cw;
    mask.height = ch;
    const ctx = mask.getContext("2d")!;
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, cw, ch);
    ctx.globalCompositeOperation = "lighter";
    ctx.filter = `blur(${Math.round(0.065 * PPM)}px)`;
    ctx.globalAlpha = 0.8;
    ctx.drawImage(shape, 0, 0);
    ctx.filter = `blur(${Math.round(0.02 * PPM)}px)`;
    ctx.globalAlpha = 0.9;
    ctx.drawImage(shape, 0, 0);
    ctx.filter = "none";
    ctx.globalAlpha = 1;

    const alphaMap = new THREE.CanvasTexture(mask);
    alphaMap.colorSpace = THREE.NoColorSpace;
    const material = new THREE.MeshBasicMaterial({
      color: new THREE.Color(color).multiplyScalar(intensity),
      alphaMap,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
    });
    // viewBox centre relative to the point-box centre (the mesh origin), SVG y down → scene y up. The
    // viewBox may not start at 0,0 (the brand file starts at 60,318): its origin is part of the centre.
    const offsetX = (LOGO_VIEWBOX.x + LOGO_VIEWBOX.width / 2 - cx) * s;
    const offsetY = -(LOGO_VIEWBOX.y + LOGO_VIEWBOX.height / 2 - cy) * s * scaleY;
    const geometry = new THREE.PlaneGeometry(planeWidth, planeHeight, bendRadius ? 64 : 1, 1);
    geometry.translate(offsetX, offsetY, 0);
    if (bendRadius) {
      // Same bend as LogoMesh: x becomes an arc length on the cylinder, the origin stays on its front.
      const pos = geometry.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < pos.count; i++) {
        const theta = pos.getX(i) / bendRadius;
        pos.setXYZ(i, bendRadius * Math.sin(theta), pos.getY(i), bendRadius * Math.cos(theta) - bendRadius);
      }
      geometry.computeVertexNormals();
    }
    return { material, geometry };
  }, [svg, logoTexture, width, scaleY, intensity, color, bendRadius]);

  useLayoutEffect(
    () => () => {
      material.alphaMap?.dispose();
      material.dispose();
      geometry.dispose();
    },
    [material, geometry],
  );

  return <mesh geometry={geometry} material={material} renderOrder={1} />;
}

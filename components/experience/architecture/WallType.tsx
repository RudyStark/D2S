"use client";

import { use, useLayoutEffect, useMemo } from "react";
import * as THREE from "three";
import { COLORS } from "@/lib/brand";

const FONTS = { 500: "/fonts/montserrat-500.woff", 600: "/fonts/montserrat-600.woff" } as const;
const FAMILY = "D2SWallType";
/** Canvas resolution, pixels per metre. */
const PPM = 1100;

let fontPromise: Promise<void> | null = null;
function loadFont() {
  if (!fontPromise) {
    fontPromise = Promise.all(
      Object.entries(FONTS).map(([weight, url]) =>
        new FontFace(FAMILY, `url(${url})`, { weight }).load().then((face) => {
          document.fonts.add(face);
        }),
      ),
    )
      .then(() => undefined)
      .catch(() => undefined);
  }
  return fontPromise;
}

interface WallTypeProps {
  lines: string[];
  position: [number, number, number];
  rotationY?: number;
  /** Cap-height-ish size, metres. */
  size?: number;
  color?: string;
  /** Short accent dash under the block, like the engraved signage in the references. */
  dash?: boolean;
  align?: "left" | "center";
  /** Wrap onto a vertical cylinder (convex), radius in metres; position is then the cylinder axis at the text top. */
  curveRadius?: number;
  tracking?: number;
  lineHeight?: number;
  weight?: 500 | 600;
}

/**
 * Engraved-style signage drawn into a canvas texture.
 * Rendered in the opaque pass (custom blending) so it stays visible through transmissive glass.
 * `position` is the top-left (or top-centre) corner of the text block.
 */
export function WallType({
  lines,
  position,
  rotationY = 0,
  size = 0.16,
  color = COLORS.wallType,
  dash = true,
  align = "left",
  curveRadius,
  tracking = 0.28,
  lineHeight = 2.05,
  weight = 500,
}: WallTypeProps) {
  use(loadFont());

  const { texture, width, height } = useMemo(() => {
    const px = size * PPM;
    const pitch = px * lineHeight;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;
    const font = `${weight} ${px}px ${FAMILY}, Montserrat, sans-serif`;
    ctx.font = font;
    ctx.letterSpacing = `${tracking * px}px`;
    const measure = (l: string) => ctx.measureText(l).width - tracking * px;
    const widths = lines.map(measure);
    // Centred text is centred optically: trailing punctuation (",", ".") hangs outside the block,
    // otherwise it pushes the words to the left. The canvas stays symmetric around that optical axis.
    const optical = lines.map((l) => measure(l.replace(/[.,;:!?…]+$/u, "")));
    const half = Math.max(...optical.map((o, i) => Math.max(o / 2, widths[i] - o / 2)));
    const textW = align === "left" ? Math.max(...widths) : half * 2;
    const dashH = dash ? px * 1.2 : 0;
    const pad = Math.ceil(px * 0.25);
    canvas.width = Math.ceil(textW + pad * 2);
    canvas.height = Math.ceil(pitch * (lines.length - 1) + px * 1.25 + dashH + pad * 2);
    ctx.font = font;
    ctx.letterSpacing = `${tracking * px}px`;
    ctx.fillStyle = color;
    ctx.textBaseline = "alphabetic";
    lines.forEach((line, i) => {
      const x = align === "left" ? pad : pad + half - optical[i] / 2;
      ctx.fillText(line, x, pad + px + i * pitch);
    });
    if (dash) {
      ctx.globalAlpha = 0.8;
      const y = pad + px + (lines.length - 1) * pitch + px * 0.9;
      ctx.fillRect(align === "left" ? pad : pad + textW / 2 - px * 0.9, y, px * 1.8, Math.max(2, px * 0.09));
    }
    const t = new THREE.CanvasTexture(canvas);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    return { texture: t, width: canvas.width / PPM, height: canvas.height / PPM, pad: pad / PPM };
  }, [lines, size, color, dash, align, tracking, lineHeight, weight]);

  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: texture,
        roughness: 0.6,
        transparent: false,
        blending: THREE.CustomBlending,
        blendSrc: THREE.SrcAlphaFactor,
        blendDst: THREE.OneMinusSrcAlphaFactor,
        // Keep the buffer's alpha at 1: with the colour factors applied to alpha too, text edges wrote
        // alpha < 1 into the composer buffer and the post chain turned them into a light fringe.
        blendSrcAlpha: THREE.OneFactor,
        blendDstAlpha: THREE.OneMinusSrcAlphaFactor,
        depthWrite: false,
        alphaTest: 0.01,
        polygonOffset: true,
        polygonOffsetFactor: -2,
      }),
    [texture],
  );

  const geometry = useMemo(() => {
    if (curveRadius) {
      const theta = width / curveRadius;
      const g = new THREE.CylinderGeometry(curveRadius, curveRadius, height, 64, 1, true, -theta / 2, theta);
      g.translate(0, -height / 2, 0);
      return g;
    }
    const g = new THREE.PlaneGeometry(width, height);
    const pad = size * 0.25;
    // Anchor at the top-left (or top-centre) of the text, compensating the canvas padding.
    g.translate(align === "left" ? width / 2 - pad : 0, -height / 2 + pad, 0);
    return g;
  }, [width, height, curveRadius, align, size]);

  useLayoutEffect(
    () => () => {
      texture.dispose();
      material.dispose();
      geometry.dispose();
    },
    [texture, material, geometry],
  );

  return (
    <mesh position={position} rotation-y={rotationY} geometry={geometry} material={material} renderOrder={1} receiveShadow />
  );
}

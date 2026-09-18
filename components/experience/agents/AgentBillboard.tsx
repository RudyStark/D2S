"use client";

import { useTexture } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useExperience } from "@/lib/experience/store";
import { getRadialTexture, MATERIALS } from "../materials";
import type { AgentDefinition } from "./agents.config";

interface AgentBillboardProps {
  agent: AgentDefinition;
  height: number;
  idle: boolean;
}

/**
 * Temporary 2.5D agent: pre-rendered cut-out on a plane, pivot at the feet.
 * Unlit on purpose (the character is already lit in its render); receives a soft
 * contact shadow and casts an alpha-tested silhouette shadow.
 */
export function AgentBillboard({ agent, height, idle }: AgentBillboardProps) {
  const texture = useTexture(agent.image);
  const mesh = useRef<THREE.Mesh>(null);
  const reducedMotion = useExperience((s) => s.reducedMotion);
  const width = height * agent.aspect;
  const phase = useMemo(() => Math.random() * Math.PI * 2, []);

  useLayoutEffect(() => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;
    // Premultiplied upload keeps mip levels free of white/dark fringes around the cut-out.
    texture.premultiplyAlpha = true;
    texture.needsUpdate = true;
  }, [texture]);

  const geometry = useMemo(() => {
    const g = new THREE.PlaneGeometry(width, height);
    g.translate(0, height / 2, 0);
    return g;
  }, [width, height]);

  const material = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        map: texture,
        // Drawn in the opaque pass (custom premultiplied blending) so the agents stay
        // visible through transmissive glass, with soft edges and no halo.
        transparent: false,
        blending: THREE.CustomBlending,
        blendSrc: THREE.OneFactor,
        blendDst: THREE.OneMinusSrcAlphaFactor,
        alphaTest: 0.02,
        depthWrite: true,
        toneMapped: false,
        side: THREE.DoubleSide,
      }),
    [texture],
  );

  const depthMaterial = useMemo(
    () =>
      new THREE.MeshDepthMaterial({
        depthPacking: THREE.RGBADepthPacking,
        map: texture,
        alphaTest: 0.5,
      }),
    [texture],
  );

  const shadowMaterial = useMemo(() => {
    const m = MATERIALS.shadow.clone();
    m.alphaMap = getRadialTexture();
    m.map = null;
    return m;
  }, []);

  useLayoutEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
      depthMaterial.dispose();
      shadowMaterial.dispose();
    },
    [geometry, material, depthMaterial, shadowMaterial],
  );

  useFrame(({ clock }) => {
    const m = mesh.current;
    if (!m || !idle || reducedMotion) return;
    // Breathing: sub-percent vertical scale from the feet, never a visible deformation.
    const t = clock.elapsedTime * 1.35 + phase;
    m.scale.y = 1 + Math.sin(t) * 0.0035;
    m.scale.x = 1 - Math.sin(t) * 0.0012;
  });

  return (
    <group>
      <mesh
        ref={mesh}
        geometry={geometry}
        material={material}
        customDepthMaterial={depthMaterial}
        castShadow
        renderOrder={2}
      />
      <mesh rotation-x={-Math.PI / 2} position-y={0.004} material={shadowMaterial} renderOrder={1}>
        <planeGeometry args={[width * 1.25, width * 0.62]} />
      </mesh>
    </group>
  );
}

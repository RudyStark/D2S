"use client";

import { useLayoutEffect, useMemo } from "react";
import { MATERIALS } from "../materials";
import { getSpillTexture } from "../textures";

interface AgentGroundShadowProps {
  /** Footprint reference width, metres (≈ shoulder width). */
  width: number;
  /** Faint directional shadow away from the sun (for agents that cast no shadow-map shadow). */
  cast?: boolean;
}

/**
 * Soft grounding decals shared by every agent renderer: a tight contact under the shoes and a wide
 * occlusion, plus an optional faint directional shadow. Never a hard disc.
 */
export function AgentGroundShadow({ width, cast = false }: AgentGroundShadowProps) {
  const shadows = useMemo(() => {
    const make = (opacity: number) => {
      const m = MATERIALS.shadow.clone();
      m.alphaMap = getSpillTexture();
      m.opacity = opacity;
      return m;
    };
    return { contact: make(0.4), soft: make(0.14), cast: make(0.08) };
  }, []);

  useLayoutEffect(() => () => Object.values(shadows).forEach((m) => m.dispose()), [shadows]);

  return (
    <group>
      {cast && (
        <mesh rotation-x={-Math.PI / 2} position={[width * 0.26, 0.002, -width * 0.16]} material={shadows.cast} renderOrder={1}>
          <planeGeometry args={[width * 0.95, width * 0.42]} />
        </mesh>
      )}
      <mesh rotation-x={-Math.PI / 2} position-y={0.003} material={shadows.soft} renderOrder={1}>
        <planeGeometry args={[width * 1.3, width * 0.55]} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position-y={0.004} material={shadows.contact} renderOrder={1}>
        <planeGeometry args={[width * 0.6, width * 0.2]} />
      </mesh>
    </group>
  );
}

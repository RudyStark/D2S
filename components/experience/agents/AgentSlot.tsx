"use client";

import { useFrame } from "@react-three/fiber";
import { Suspense, useMemo, useRef } from "react";
import * as THREE from "three";
import type { AgentFacing } from "@/lib/experience/casting";
import { frame } from "@/lib/experience/store";
import { AgentBillboard } from "./AgentBillboard";
import { AgentModel } from "./AgentModel";
import { AGENTS, type AgentType } from "./agents.config";

export interface AgentSlotProps {
  type: AgentType;
  position: [number, number, number];
  rotationY?: number;
  /** Rendered height in metres. */
  height?: number;
  facing?: AgentFacing;
  /** 0–1, how much the agent turns towards the camera (Y axis only). */
  follow?: number;
  /** Publishes the head's screen position under this id for DOM overlays. */
  anchor?: string;
  idle?: boolean;
}

const head = new THREE.Vector3();
const ndc = new THREE.Vector3();

/**
 * Stable entry point for an agent in the world.
 * Renders the rigged GLB when public/models/agents/<type>.glb exists, the 2.5D cut-out otherwise.
 * Position, facing and screen anchoring live here so both renderers behave identically.
 */
export function AgentSlot({
  type,
  position,
  rotationY = 0,
  height = 1.68,
  facing = "camera",
  follow = 0.3,
  anchor,
  idle = true,
}: AgentSlotProps) {
  const group = useRef<THREE.Group>(null);
  const agent = AGENTS[type];
  const base = useMemo(() => new THREE.Vector3(...position), [position]);

  useFrame(({ camera, size }) => {
    const g = group.current;
    if (!g) return;

    if (facing === "camera" && follow > 0) {
      const toCamera = Math.atan2(camera.position.x - base.x, camera.position.z - base.z);
      let delta = toCamera - rotationY;
      delta = Math.atan2(Math.sin(delta), Math.cos(delta));
      g.rotation.y = rotationY + delta * follow;
    }

    if (anchor) {
      head.set(0, height * 0.9, 0).applyMatrix4(g.matrixWorld);
      ndc.copy(head).project(camera);
      const inFront = ndc.z > -1 && ndc.z < 1;
      frame.anchors[anchor] = {
        x: (ndc.x * 0.5 + 0.5) * size.width,
        y: (-ndc.y * 0.5 + 0.5) * size.height,
        visible: inFront && Math.abs(ndc.x) < 1.1 && Math.abs(ndc.y) < 1.1,
      };
    }
  });

  return (
    <group ref={group} position={position} rotation-y={rotationY} name={`agent-${type}`}>
      {agent.model ? (
        // Rigged models may be heavy: they stream in on their own without blocking the world.
        <Suspense fallback={null}>
          <AgentModel url={agent.model} height={height} idle={idle} />
        </Suspense>
      ) : (
        <AgentBillboard agent={agent} height={height} idle={idle} />
      )}
    </group>
  );
}

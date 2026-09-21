"use client";

import { useThree } from "@react-three/fiber";
import { useEffect } from "react";
import { CASTING } from "@/lib/experience/casting";
import { useExperience } from "@/lib/experience/store";
import { AgentSlot } from "./agents/AgentSlot";
import { FacadeZone } from "./scenes/FacadeZone";
import { LobbyZone } from "./scenes/LobbyZone";
import { Surroundings } from "./scenes/Surroundings";
import { Breeze } from "./vegetation/Plants";

/**
 * The continuous world. Zones are laid out along −Z and share one floor, one sky and one light rig.
 * Next rooms (services, agents…) are added here as new zones + camera keys, without touching these.
 */
/** Capture/debug only: exposes the scene graph to QA scripts (window.__d2s.three). */
function ExposeScene() {
  const scene = useThree((s) => s.scene);
  const gl = useThree((s) => s.gl);
  const camera = useThree((s) => s.camera);
  useEffect(() => {
    const w = window as unknown as { __d2s?: Record<string, unknown> };
    if (w.__d2s) w.__d2s.three = { scene, gl, camera };
  }, [scene, gl, camera]);
  return null;
}

export function World() {
  const debugMaterials = useExperience((s) => s.debugMaterials);
  const debug = useExperience((s) => s.debug);
  return (
    <>
      {(debug || (typeof window !== "undefined" && new URLSearchParams(window.location.search).has("capture"))) && <ExposeScene />}
      <Surroundings />
      <Breeze />
      <FacadeZone />
      <LobbyZone />
      {!debugMaterials &&
        CASTING.map(({ zone, ...placement }) => (
          // Indoors the ceiling slab already shades the floor: a sun shadow would be invisible, only its cost remains.
          <AgentSlot key={`${zone}-${placement.type}`} {...placement} castShadow={zone === "facade"} />
        ))}
    </>
  );
}

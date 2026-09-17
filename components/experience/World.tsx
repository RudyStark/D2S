"use client";

import { CASTING } from "@/lib/experience/casting";
import { AgentSlot } from "./agents/AgentSlot";
import { FacadeZone } from "./scenes/FacadeZone";
import { LobbyZone } from "./scenes/LobbyZone";
import { Surroundings } from "./scenes/Surroundings";

/**
 * The continuous world. Zones are laid out along −Z and share one floor, one sky and one light rig.
 * Next rooms (services, agents…) are added here as new zones + camera keys, without touching these.
 */
export function World() {
  return (
    <>
      <Surroundings />
      <FacadeZone />
      <LobbyZone />
      {CASTING.map(({ zone, ...placement }) => (
        <AgentSlot key={`${zone}-${placement.type}`} {...placement} />
      ))}
    </>
  );
}

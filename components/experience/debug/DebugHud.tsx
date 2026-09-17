"use client";

import { useRef } from "react";
import { useFrameUpdate } from "@/hooks/useFrameUpdate";
import { CAMERA_KEYS } from "@/lib/experience/cameraPath";
import { scrollToProgress } from "@/lib/experience/director";
import { frame, useExperience } from "@/lib/experience/store";
import { BEATS, beat, STOPS, type Beat } from "@/lib/experience/timeline";

const BEAT_NAMES = Object.keys(BEATS) as Beat[];

/** ?debug3d=1 — progress, camera, FPS, beats and keyframes. Loaded on demand only. */
export function DebugHud() {
  const text = useRef<HTMLPreElement>(null);
  const bars = useRef<HTMLDivElement>(null);
  const profile = useExperience((s) => s.profile);
  const quality = useExperience((s) => s.quality);

  useFrameUpdate((f) => {
    if (text.current) {
      const c = f.camera;
      text.current.textContent =
        `fps       ${f.fps}\n` +
        `target    ${f.target.toFixed(4)}\n` +
        `progress  ${f.progress.toFixed(4)}${f.forced !== null ? "  (forced)" : ""}\n` +
        `camera    ${c.x.toFixed(2)}, ${c.y.toFixed(2)}, ${c.z.toFixed(2)}\n` +
        `fov       ${c.fov.toFixed(1)}°   veil ${c.veil.toFixed(2)}\n` +
        `anchor    ${f.anchors.reception ? `${Math.round(f.anchors.reception.x)}, ${Math.round(f.anchors.reception.y)} ${f.anchors.reception.visible ? "✓" : "–"}` : "–"}`;
    }
    bars.current?.querySelectorAll<HTMLElement>("[data-beat]").forEach((el) => {
      el.style.setProperty("--v", String(beat(f.progress, el.dataset.beat as Beat)));
    });
  });

  const keys = CAMERA_KEYS[profile];

  return (
    <aside
      aria-label="Debug 3D"
      style={{
        position: "fixed",
        left: 16,
        bottom: 16,
        zIndex: 100,
        width: 300,
        padding: 12,
        borderRadius: 10,
        background: "rgb(8 12 30 / 0.86)",
        color: "#dfe6ff",
        font: "11px/1.45 ui-monospace, SFMono-Regular, Menlo, monospace",
        backdropFilter: "blur(6px)",
      }}
    >
      <div style={{ marginBottom: 6, color: "#8fb1ff" }}>
        debug3d · {profile} · {quality}
      </div>
      <pre ref={text} style={{ margin: 0, whiteSpace: "pre" }} />
      <div ref={bars} style={{ display: "grid", gap: 3, margin: "8px 0" }}>
        {BEAT_NAMES.map((name) => (
          <div key={name} data-beat={name} style={{ display: "grid", gridTemplateColumns: "92px 1fr", alignItems: "center", gap: 6 }}>
            <span style={{ opacity: 0.7 }}>{name}</span>
            <span style={{ height: 4, borderRadius: 2, background: "rgb(255 255 255 / 0.12)", overflow: "hidden" }}>
              <span style={{ display: "block", height: "100%", width: "calc(var(--v, 0) * 100%)", background: "#4d8dff" }} />
            </span>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
        {STOPS.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => {
              frame.forced = null;
              scrollToProgress(s.p);
            }}
            style={{ font: "inherit", padding: "2px 6px", borderRadius: 4, border: "1px solid #3b4d80", background: "#141c3d", color: "inherit", cursor: "pointer" }}
          >
            {s.label} {s.p}
          </button>
        ))}
      </div>
      <div style={{ marginTop: 6, opacity: 0.6 }}>keys: {keys.map((k) => k.p.toFixed(2)).join(" · ")}</div>
    </aside>
  );
}

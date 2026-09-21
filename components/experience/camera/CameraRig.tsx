"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { buildCameraPath, CAMERA_KEYS, createCameraSample } from "@/lib/experience/cameraPath";
import { FOCUS_PULL, focusPullCurve } from "@/lib/experience/focusPull";
import { beat } from "@/lib/experience/timeline";
import { frame, useExperience } from "@/lib/experience/store";
import { damp } from "@/lib/math";

const DEG = Math.PI / 180;
const euler = new THREE.Euler(0, 0, 0, "YXZ");

/**
 * Drives the camera from the smoothed scroll progress.
 * Path sampling is exact (monotone cubic per channel); a light second-order damping on
 * the final transform adds physical inertia, plus a barely-there organic drift.
 */
export function CameraRig() {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const profile = useExperience((s) => s.profile);
  const reducedMotion = useExperience((s) => s.reducedMotion);
  const path = useMemo(() => buildCameraPath(CAMERA_KEYS[profile]), [profile]);
  const target = useMemo(createCameraSample, []);
  const current = useMemo(createCameraSample, []);

  const state = useMemo(() => ({ primed: false }), []);

  useEffect(() => {
    camera.near = 0.05;
    camera.far = 220;
    state.primed = false;
  }, [camera, path, state]);

  useFrame(({ size }, delta) => {
    const dt = Math.min(delta, 0.1);
    const p = frame.progress;
    path.sample(p, target);
    if (!state.primed || frame.snap) {
      Object.assign(current, target);
      state.primed = true;
      frame.snap = false;
    }

    // Inertia on top of the scroll smoothing; tighter when reduced motion is requested.
    const k = reducedMotion ? 30 : 9;
    const kRot = reducedMotion ? 30 : 7;
    current.x = damp(current.x, target.x, k, dt);
    current.y = damp(current.y, target.y, k, dt);
    current.z = damp(current.z, target.z, k, dt);
    current.yaw = damp(current.yaw, target.yaw, kRot, dt);
    current.pitch = damp(current.pitch, target.pitch, kRot, dt);
    current.roll = damp(current.roll, target.roll, kRot, dt);
    current.fov = damp(current.fov, target.fov, k, dt);
    current.shiftY = damp(current.shiftY, target.shiftY, k, dt);
    current.veil = target.veil;

    // Organic micro-drift, strongest while the visitor is standing still at the façade or the desk.
    let dx = 0;
    let dy = 0;
    let dyaw = 0;
    if (!reducedMotion) {
      const t = frame.time;
      const still = 1 - beat(p, "approach") + beat(p, "settle");
      const a = 0.35 + 0.65 * Math.min(1, still);
      dx = (Math.sin(t * 0.21) * 0.6 + Math.sin(t * 0.13 + 1.7) * 0.4) * 0.012 * a;
      dy = (Math.sin(t * 0.17 + 0.6) * 0.5 + Math.sin(t * 0.29) * 0.5) * 0.008 * a;
      dyaw = Math.sin(t * 0.11 + 2.1) * 0.06 * a;
    }

    // Desktop lobby → services: the camera keeps drifting towards the desk while the page rises over it.
    const move = profile === "desktop" && !reducedMotion ? focusPullCurve(frame.services).move : 0;

    camera.position.set(current.x + dx, current.y + dy + FOCUS_PULL.rise * move, current.z - FOCUS_PULL.dolly * move);
    euler.set(current.pitch * DEG, (current.yaw + dyaw) * DEG, current.roll * DEG);
    camera.quaternion.setFromEuler(euler);

    camera.fov = current.fov - FOCUS_PULL.tighten * move;
    const w = size.width;
    const h = size.height;
    camera.aspect = w / h;
    // Tilt-shift: slide the frustum instead of pitching → vertical lines stay vertical.
    camera.setViewOffset(w, h, 0, -current.shiftY * h, w, h);
    camera.updateProjectionMatrix();

    frame.camera.x = camera.position.x;
    frame.camera.y = camera.position.y;
    frame.camera.z = camera.position.z;
    frame.camera.fov = current.fov;
    frame.camera.veil = current.veil;
  });

  return null;
}

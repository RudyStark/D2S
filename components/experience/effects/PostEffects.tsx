"use client";

import { Bloom, DepthOfField, EffectComposer, EffectGroup, N8AO, SMAA, ToneMapping } from "@react-three/postprocessing";
import { useFrame, useThree } from "@react-three/fiber";
import { ToneMappingMode, type DepthOfFieldEffect, type EffectPass } from "postprocessing";
import { useEffect, useLayoutEffect, useRef } from "react";
import * as THREE from "three";
import { FOCUS_PULL, focusPullCurve } from "@/lib/experience/focusPull";
import { QUALITY } from "@/lib/experience/quality";
import { frame, useExperience } from "@/lib/experience/store";
import { lerp } from "@/lib/math";

const subject = new THREE.Vector3(...FOCUS_PULL.subject);

/**
 * Depth of field of the lobby → services focus pull (desktop). Its pass only runs during the
 * transition; it is also enabled for the first frames (the warm-up under the site loader) so its
 * shaders are compiled before the visitor ever scrolls there.
 */
function useFocusPull(active: boolean) {
  const pass = useRef<EffectPass>(null);
  const dof = useRef<DepthOfFieldEffect>(null);
  const warmup = useRef(4);
  const setFocusPull = useExperience((s) => s.setFocusPull);

  useEffect(() => {
    setFocusPull(active);
    return () => setFocusPull(false);
  }, [active, setFocusPull]);

  /*
   * Priority 0 on purpose. Any useFrame with a priority > 0 tells R3F that the app renders by itself: on the
   * tiers without post-processing (quality "low") there is no composer to do it, and the canvas stays blank.
   * The depth of field then reads the camera of the current frame anyway, since the rig also runs at 0.
   */
  useFrame(({ camera }) => {
    const p = pass.current;
    const fx = dof.current;
    if (!p || !fx) return;
    const s = frame.services;
    const warming = warmup.current > 0;
    if (warming) warmup.current--;
    p.enabled = s > 0.002 || warming;
    if (!p.enabled) return;
    const { soften, rack } = focusPullCurve(s);
    const coc = fx.cocMaterial;
    coc.focusDistance = lerp(camera.position.distanceTo(subject), FOCUS_PULL.nearDistance, rack);
    coc.focusRange = lerp(FOCUS_PULL.range, FOCUS_PULL.nearRange, rack);
    fx.bokehScale = FOCUS_PULL.bokeh * (0.5 * soften + 0.5 * rack);
  });

  return { pass, dof };
}

/**
 * Subtle finishing: contact-scale AO for volume separation, a whisper of bloom on
 * light strips only, neutral tone mapping to keep whites white.
 * The buffer is HDR: sunlit plaster easily exceeds 1.0, so the bloom threshold sits well above
 * any lit surface and only the (very bright) emissive strips reach it.
 */
export function PostEffects() {
  const quality = useExperience((s) => s.quality);
  const settings = QUALITY[quality];
  const gl = useThree((s) => s.gl);
  const debugMaterials = useExperience((s) => s.debugMaterials);
  const profile = useExperience((s) => s.profile);
  const focusPull = settings.postprocessing && profile === "desktop" && !debugMaterials;
  const { pass, dof } = useFocusPull(focusPull);

  useLayoutEffect(() => {
    gl.toneMapping = settings.postprocessing ? THREE.NoToneMapping : THREE.NeutralToneMapping;
    gl.toneMappingExposure = 1;
  }, [gl, settings.postprocessing]);

  if (!settings.postprocessing) return null;
  /*
   * Retina already halves the stair steps: 2 samples there, the tier's full count on 1× screens. Above
   * ~2.5 Mpx the multisampled HDR buffers alone weigh hundreds of megabytes — that is how a GPU ends up
   * dropping the context and leaving a blank canvas, so the sample count comes down with the buffer size.
   */
  const buffer = gl.domElement.width * gl.domElement.height;
  const msaa = gl.getPixelRatio() >= 1.75 || buffer > 2_500_000 ? Math.min(2, settings.msaa) : settings.msaa;

  return (
    <EffectComposer multisampling={msaa} enableNormalPass={false}>
      {settings.ambientOcclusion ? (
        <N8AO
          // The pass gamma-corrects by default; inside the composer that would double the sRGB encode (washed-out frame).
          ref={(pass: { configuration: { gammaCorrection: boolean } } | null) => {
            if (pass) pass.configuration.gammaCorrection = false;
          }}
          aoRadius={0.55}
          distanceFalloff={0.4}
          intensity={1.4}
          quality="medium"
          halfRes
          color="#3a3f55"
        />
      ) : (
        <></>
      )}
      {focusPull ? (
        <EffectGroup ref={pass}>
          <DepthOfField ref={dof} focusDistance={12} focusRange={FOCUS_PULL.range} bokehScale={0} resolutionScale={0.5} />
        </EffectGroup>
      ) : (
        <></>
      )}
      {settings.bloom && !debugMaterials ? <Bloom mipmapBlur luminanceThreshold={1.8} luminanceSmoothing={0.35} intensity={0.16} radius={0.55} /> : <></>}
      <ToneMapping mode={ToneMappingMode.NEUTRAL} />
      <SMAA />
    </EffectComposer>
  );
}

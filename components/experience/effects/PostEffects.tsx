"use client";

import { Bloom, EffectComposer, N8AO, SMAA, ToneMapping } from "@react-three/postprocessing";
import { useThree } from "@react-three/fiber";
import { ToneMappingMode } from "postprocessing";
import { useLayoutEffect } from "react";
import * as THREE from "three";
import { QUALITY } from "@/lib/experience/quality";
import { useExperience } from "@/lib/experience/store";

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

  useLayoutEffect(() => {
    gl.toneMapping = settings.postprocessing ? THREE.NoToneMapping : THREE.NeutralToneMapping;
    gl.toneMappingExposure = 1;
  }, [gl, settings.postprocessing]);

  if (!settings.postprocessing) return null;

  return (
    <EffectComposer multisampling={0} enableNormalPass={false}>
      {settings.ambientOcclusion ? (
        <N8AO
          // The pass gamma-corrects by default; inside the composer that would double the sRGB encode (washed-out frame).
          ref={(pass: { configuration: { gammaCorrection: boolean } } | null) => {
            if (pass) pass.configuration.gammaCorrection = false;
          }}
          aoRadius={1.1}
          distanceFalloff={0.9}
          intensity={1.6}
          quality="medium"
          halfRes
          color="#3a3f55"
        />
      ) : (
        <></>
      )}
      {settings.bloom ? <Bloom mipmapBlur luminanceThreshold={4} luminanceSmoothing={0.3} intensity={0.22} radius={0.6} /> : <></>}
      <ToneMapping mode={ToneMappingMode.NEUTRAL} />
      <SMAA />
    </EffectComposer>
  );
}

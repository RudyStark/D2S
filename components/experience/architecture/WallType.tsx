"use client";

import { Text } from "@react-three/drei";
import { COLORS } from "@/lib/brand";

export const WALL_FONT = "/fonts/montserrat-500.woff";

interface WallTypeProps {
  lines: string[];
  position: [number, number, number];
  rotationY?: number;
  /** Cap height-ish size, metres. */
  size?: number;
  color?: string;
  /** Short accent dash under the block, like the engraved signage in the references. */
  dash?: boolean;
  align?: "left" | "center";
  curveRadius?: number;
  opacity?: number;
}

/** Engraved-style signage: wide-tracked capitals, SDF text (stays crisp at any distance). */
export function WallType({
  lines,
  position,
  rotationY = 0,
  size = 0.16,
  color = COLORS.wallType,
  dash = true,
  align = "left",
  curveRadius,
  opacity = 1,
}: WallTypeProps) {
  const lineHeight = 2.05;
  const blockHeight = lines.length * size * lineHeight;
  return (
    <group position={position} rotation-y={rotationY}>
      <Text
        font={WALL_FONT}
        fontSize={size}
        letterSpacing={0.28}
        lineHeight={lineHeight}
        anchorX={align}
        anchorY="top"
        textAlign={align}
        color={color}
        fillOpacity={opacity}
        // troika-three-text supports curveRadius; drei's typings don't expose it.
        {...({ curveRadius } as object)}
        renderOrder={1}
      >
        {lines.join("\n")}
      </Text>
      {dash && (
        <mesh position={[align === "left" ? size * 0.9 : 0, -blockHeight - size * 0.35, 0.001]}>
          <planeGeometry args={[size * 1.8, size * 0.1]} />
          <meshBasicMaterial color={COLORS.wallType} transparent opacity={0.8 * opacity} />
        </mesh>
      )}
    </group>
  );
}

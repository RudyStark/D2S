"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";

type Vec3 = [number, number, number];

interface BlockProps {
  /** Centre position. */
  position: Vec3;
  size: Vec3;
  material: THREE.Material;
  rotationY?: number;
  castShadow?: boolean;
  receiveShadow?: boolean;
  name?: string;
}

const unitBox = new THREE.BoxGeometry(1, 1, 1);

/** Axis-aligned box that shares one unit geometry (scaled per instance). */
export function Block({ position, size, material, rotationY = 0, castShadow = true, receiveShadow = true, name }: BlockProps) {
  return (
    <mesh
      name={name}
      geometry={unitBox}
      material={material}
      position={position}
      scale={size}
      rotation-y={rotationY}
      castShadow={castShadow}
      receiveShadow={receiveShadow}
    />
  );
}

/** Box resting on the floor: position is the centre of its footprint. */
export function FloorBlock({ position, size, ...rest }: BlockProps) {
  return <Block {...rest} size={size} position={[position[0], position[1] + size[1] / 2, position[2]]} />;
}

export interface BoxInstance {
  position: Vec3;
  size: Vec3;
  rotationY?: number;
}

/** Many boxes, one draw call (mullions, ceiling spots, slats…). */
export function InstancedBoxes({
  items,
  material,
  castShadow = false,
  receiveShadow = false,
  geometry = unitBox,
}: {
  items: BoxInstance[];
  material: THREE.Material;
  castShadow?: boolean;
  receiveShadow?: boolean;
  geometry?: THREE.BufferGeometry;
}) {
  const ref = useRef<THREE.InstancedMesh>(null);

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();
    items.forEach((item, i) => {
      e.set(0, item.rotationY ?? 0, 0);
      q.setFromEuler(e);
      m.compose(new THREE.Vector3(...item.position), q, new THREE.Vector3(...item.size));
      mesh.setMatrixAt(i, m);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [items]);

  return (
    <instancedMesh
      ref={ref}
      args={[geometry, material, items.length]}
      castShadow={castShadow}
      receiveShadow={receiveShadow}
      frustumCulled={false}
    />
  );
}

/** Horizontal ring sector (desk bodies, curved benches) extruded upwards. */
export function useArcGeometry(innerR: number, outerR: number, halfAngle: number, height: number, segments = 48) {
  const geometry = useMemo(() => {
    const shape = new THREE.Shape();
    // Arc centred on −Z so the convex side faces +Z (towards the entrance).
    const a0 = Math.PI / 2 - halfAngle;
    const a1 = Math.PI / 2 + halfAngle;
    shape.absarc(0, 0, outerR, a0, a1, false);
    shape.absarc(0, 0, innerR, a1, a0, true);
    shape.closePath();
    const g = new THREE.ExtrudeGeometry(shape, { depth: height, bevelEnabled: false, curveSegments: segments });
    // Shape lives in XY (+Y = entrance side). Rotating +90° about X maps Y→Z and the
    // extrusion to −Y; lifting by `height` puts the body on the floor. Winding is preserved.
    g.rotateX(Math.PI / 2);
    g.translate(0, height, 0);
    return g;
  }, [innerR, outerR, halfAngle, height, segments]);

  useLayoutEffect(() => () => geometry.dispose(), [geometry]);
  return geometry;
}

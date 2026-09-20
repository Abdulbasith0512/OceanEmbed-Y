"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  DoubleSide,
  InstancedBufferAttribute,
  InstancedMesh,
  Object3D,
  ShaderMaterial,
} from "three";
import { createMarineGeometry } from "@/lib/three/marine-geometry";
import { marineFragment, marineVertex } from "@/lib/three/marine-shaders";
import {
  habitatVisibility,
  MARINE_HABITATS,
} from "@/lib/three/marine-habitats";
import { depthAtProgress } from "@/lib/animation/journey";
import { smoothstep } from "@/lib/ocean";
import type { ProgressRef } from "./experience-canvas";

type Habitat = (typeof MARINE_HABITATS)[number];
const random = (n: number) => {
  const v = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return v - Math.floor(v);
};

function MarinePopulation({
  habitat,
  progress,
  mobile,
}: {
  habitat: Habitat;
  progress: ProgressRef;
  mobile: boolean;
}) {
  const mesh = useRef<InstancedMesh>(null);
  const material = useRef<ShaderMaterial>(null);
  const count = mobile
    ? Math.max(1, Math.ceil(habitat.count / 2))
    : habitat.count;
  const geometry = useMemo(() => {
    const result = createMarineGeometry(habitat.kind);
    result.setAttribute(
      "aSeed",
      new InstancedBufferAttribute(
        Float32Array.from({ length: count }, (_, i) =>
          random(i + habitat.shader * 53),
        ),
        1,
      ),
    );
    return result;
  }, [habitat.kind, habitat.shader, count]);
  const dummy = useMemo(() => new Object3D(), []);
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uDepth: { value: 0 },
      uOpacity: { value: 0 },
      uKind: { value: habitat.shader },
      uSpeed: { value: habitat.speed },
    }),
    [habitat.shader, habitat.speed],
  );
  useEffect(
    () => () => {
      geometry.dispose();
      (material.current as unknown as { dispose?: () => void } | null)?.dispose?.();
    },
    [geometry],
  );
  const yaw = useRef<Float32Array>(new Float32Array(count));
  const prevX = useRef<Float32Array>(new Float32Array(count));
  const elapsed = useRef(0);

  useFrame((_, rawDelta) => {
    if (!mesh.current || !material.current) return;
    const p = progress.current.value,
      depth = depthAtProgress(p);
    const visibility =
      habitatVisibility(habitat.kind, depth) *
      smoothstep(0.44, 0.475, p) *
      (1 - smoothstep(0.79, 0.835, p));
    mesh.current.visible = visibility > 0.005;
    if (!mesh.current.visible) return;
    elapsed.current += Math.min(rawDelta, 0.05);
    const time = elapsed.current;
    material.current.uniforms.uTime.value = time;
    material.current.uniforms.uDepth.value = depth;
    material.current.uniforms.uOpacity.value = visibility;
    for (let i = 0; i < count; i++) {
      const seed = random(i + habitat.shader * 41 + 5);
      const drifting =
        habitat.kind === "jelly" || habitat.kind === "siphonophore";
      const school = habitat.kind === "fish" || habitat.kind === "lanternfish";
      const lane = school ? Math.floor(i / 8) : i;
      let x = 1.8 + Math.sin(seed * 9) * 3.5;
      let y = Math.cos(seed * 17) * 2.1;
      let z = -2.4 - seed * 4;
      if (school) {
        // Boids-lite: lane flow + neighbor cohesion wobble + depth current.
        const flow = Math.sin(time * habitat.speed * 2.2 + lane * 2.1) * 3.2;
        const cohesion =
          Math.sin(time * 0.9 + i * 1.7 + seed * 4) * 0.28 +
          Math.sin(depth * 0.01 + lane) * 0.3;
        x = 0.4 + flow + (i % 8) * 0.38 + cohesion;
        y =
          -1.6 +
          lane * 1.35 +
          Math.sin(i * 2.3) * 0.24 +
          Math.sin(time * 0.45 + seed * 2) * 0.15;
        z = -3 - lane * 1.2 - (i % 4) * 0.2;
      } else if (drifting) {
        // Keep drifters on screen: wrap in a bounded column, don't march to x~8.
        const cycle = Math.sin(time * 0.1 + seed * 8) * 2.2;
        x = -0.5 + ((seed * 6 + cycle) % 5) - 1.5;
        y = 1.2 - (i % 2) * 2.9 + Math.sin(time * 0.17 + seed * 4) * 0.25;
      } else {
        x = 1.2 + Math.sin(time * habitat.speed * 2.4 + seed * 5) * 2.8;
        y =
          (habitat.kind === "turtle" ? 1.2 : -1.2 + (i % 3) * 1.4) +
          Math.sin(time * 0.25 + seed * 5) * 0.22;
        z = habitat.kind === "turtle" ? -2.2 : -2.8 - i * 1.1;
      }
      // Gentle camera-relative ascent through the water column as the viewer descends.
      y += Math.sin(depth / 350 + seed * 4) * 0.18;
      dummy.position.set(x, y, z);
      // Velocity-aligned yaw: derive heading from frame-to-frame dx, smooth it.
      const vx = x - prevX.current[i];
      prevX.current[i] = x;
      const targetYaw = drifting
        ? 0.3
        : vx > 0.0004
          ? -0.22
          : vx < -0.0004
            ? Math.PI + 0.22
            : yaw.current[i];
      let dy = targetYaw - yaw.current[i];
      while (dy > Math.PI) dy -= Math.PI * 2;
      while (dy < -Math.PI) dy += Math.PI * 2;
      yaw.current[i] += dy * 0.06;
      // Pitch from vertical velocity proxy + bank from turn rate.
      const bank = Math.max(-0.3, Math.min(0.3, -dy * 2.5));
      dummy.rotation.set(
        drifting ? 0.12 : 0.1 + Math.sin(time * 0.4 + seed * 5) * 0.05,
        yaw.current[i],
        drifting
          ? Math.sin(time * 0.12 + seed) * 0.08
          : bank + Math.sin(time * 0.28 + seed * 6) * 0.04,
      );
      dummy.scale.setScalar(habitat.scale * (0.8 + seed * 0.4));
      dummy.updateMatrix();
      mesh.current.setMatrixAt(i, dummy.matrix);
    }
    mesh.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={mesh}
      name={`marine-${habitat.kind}`}
      args={[geometry, undefined, count]}
      frustumCulled={false}
      renderOrder={3}
      visible={false}
    >
      <shaderMaterial
        ref={material}
        vertexShader={marineVertex}
        fragmentShader={marineFragment}
        uniforms={uniforms}
        vertexColors
        transparent
        depthWrite={false}
        side={DoubleSide}
      />
    </instancedMesh>
  );
}

export function MarineLife({
  progress,
  mobile,
}: {
  progress: ProgressRef;
  mobile: boolean;
}) {
  return (
    <group name="marine-life">
      {MARINE_HABITATS.map((habitat) => (
        <MarinePopulation
          key={habitat.kind}
          habitat={habitat}
          progress={progress}
          mobile={mobile}
        />
      ))}
    </group>
  );
}

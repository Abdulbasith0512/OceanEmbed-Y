"use client";

import { useMemo, useRef } from "react";
import { useFrame, useLoader } from "@react-three/fiber";
import {
  AdditiveBlending,
  BackSide,
  Color,
  FrontSide,
  Group,
  Mesh,
  Points,
  PointsMaterial,
  Quaternion,
  ShaderMaterial,
  TextureLoader,
  Vector3,
} from "three";
import { lerp, smoothstep } from "@/lib/ocean";
import {
  EARTH_LOCK_RANGE,
  EARTH_SPIN_RATE,
  INDIAN_OCEAN_YAW,
  nearestEquivalentAngle,
  OCEAN_TRANSITION,
  shortestAngleDelta,
} from "@/lib/animation/journey";
import type { ProgressRef } from "./experience-canvas";

const EARTH_DAY =
  "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_atmos_2048.jpg";
const EARTH_SPEC =
  "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_specular_2048.jpg";
const EARTH_CLOUD =
  "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_clouds_1024.png";
const EARTH_NIGHT =
  "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_lights_2048.png";

const atmosphereVertex = /* glsl */ `
  varying vec3 vNormal;

  void main() {
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const atmosphereFragment = /* glsl */ `
  uniform vec3 glowColor;
  uniform float coefficient;
  uniform float power;
  varying vec3 vNormal;

  void main() {
    float intensity = pow(
      coefficient - dot(vNormal, vec3(0.0, 0.0, 1.0)),
      power
    );
    gl_FragColor = vec4(glowColor, intensity * 0.8);
  }
`;

const oceanVertex = /* glsl */ `
  uniform float uTime;
  varying vec2 vUv;

  void main() {
    vUv = uv;
    vec3 p = position;
    p += normal * (
      sin(uTime * 0.5 + position.x * 3.0) * 0.008 +
      cos(uTime * 0.4 + position.z * 2.0) * 0.006
    );
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

const oceanFragment = /* glsl */ `
  uniform float uTime;
  varying vec2 vUv;

  void main() {
    float wave = sin(vUv.x * 60.0 + uTime) *
      cos(vUv.y * 60.0 + uTime * 0.7);
    float shimmer = wave * 0.04 + 0.96;
    gl_FragColor = vec4(0.05, 0.3, 0.6, shimmer * 0.15);
  }
`;

const cloudEntryVertex = /* glsl */ `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    // Keep this quad in clip space so it behaves like a camera-facing cloud layer.
    gl_Position = vec4(position.xy, 0.998, 1.0);
  }
`;

const cloudEntryFragment = /* glsl */ `
  precision mediump float;

  uniform float uTime;
  uniform float uEntry;
  varying vec2 vUv;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
      f.y
    );
  }

  float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    for (int i = 0; i < 4; i++) {
      value += noise(p) * amplitude;
      p = p * 2.02 + vec2(17.1, 31.7);
      amplitude *= 0.5;
    }
    return value;
  }

  void main() {
    vec2 centered = vUv - 0.5;
    float pulse = 0.5 + 0.5 * sin(uTime * 0.75);

    // Compressing the sample domain makes cloud formations grow toward the camera.
    float travel = 1.0 + uEntry * (2.45 + pulse * 0.45);
    vec2 cloudUv = centered / travel + 0.5;
    vec2 wind = vec2(uTime * 0.038, -uTime * 0.064);
    vec2 warp = vec2(
      noise(cloudUv * 2.4 + wind + vec2(4.1)),
      noise(cloudUv * 2.4 - wind + vec2(8.7))
    ) - 0.5;
    vec2 warpedUv = cloudUv + warp * (0.08 + uEntry * 0.12);

    float broad = fbm(warpedUv * 2.8 + wind);
    float detail = fbm(warpedUv * 7.2 - wind * 1.45 + vec2(4.2, 7.1));
    float verticalBands = fbm(
      vec2(warpedUv.x * 2.4 + wind.x, warpedUv.y * 7.0 - wind.y * 1.4)
    );
    float density = smoothstep(0.40, 0.74, broad * 0.72 + detail * 0.28);
    density *= smoothstep(0.28, 0.72, verticalBands);

    // Foreground wisps move faster and expand more aggressively during entry.
    vec2 foregroundUv = centered / (0.42 + uEntry * 0.92) + 0.5;
    float foreground = fbm(
      foregroundUv * vec2(2.7, 6.4) + vec2(uTime * 0.075, -uTime * 0.11)
    );
    foreground = smoothstep(0.46, 0.76, foreground);
    density = max(density, foreground * smoothstep(0.18, 0.7, uEntry) * 0.76);

    float radial = length(centered * vec2(0.88, 1.08));
    float softHaze = (1.0 - smoothstep(0.16, 0.82, radial)) * 0.10;
    float alpha = (density * 0.68 + softHaze) * uEntry;
    vec3 color = mix(
      vec3(0.24, 0.39, 0.46),
      vec3(0.88, 0.95, 0.95),
      clamp(broad * 0.55 + detail * 0.45, 0.0, 1.0)
    );

    gl_FragColor = vec4(color, clamp(alpha, 0.0, 0.72));
  }
`;


function random(seed: number) {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function StarField({
  mobile,
  progress,
}: {
  mobile: boolean;
  progress: ProgressRef;
}) {
  const stars = useRef<Points>(null);
  const brightStars = useRef<Points>(null);
  const material = useRef<PointsMaterial>(null);
  const brightMaterial = useRef<PointsMaterial>(null);
  const elapsed = useRef(0);
  const count = mobile ? 1100 : 3200;
  const brightCount = mobile ? 90 : 260;
  const positions = useMemo(() => {
    const data = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      data[i * 3] = (random(i * 3) - 0.5) * 52;
      data[i * 3 + 1] = (random(i * 3 + 1) - 0.5) * 34;
      data[i * 3 + 2] = -6 - random(i * 3 + 2) * 28;
    }
    return data;
  }, [count]);
  const brightPositions = useMemo(() => {
    const data = new Float32Array(brightCount * 3);
    for (let i = 0; i < brightCount; i++) {
      data[i * 3] = (random(i * 11 + 5) - 0.5) * 52;
      data[i * 3 + 1] = (random(i * 11 + 6) - 0.5) * 34;
      data[i * 3 + 2] = -5 - random(i * 11 + 7) * 25;
    }
    return data;
  }, [brightCount]);

  useFrame((_, rawDelta) => {
    elapsed.current += Math.min(rawDelta, 0.05);
    const fade = 1 - smoothstep(0.33, OCEAN_TRANSITION.end, progress.current.value);
    const visible = progress.current.value < OCEAN_TRANSITION.end;
    if (stars.current) stars.current.visible = visible;
    if (brightStars.current) brightStars.current.visible = visible;
    if (material.current) material.current.opacity = 0.72 * fade;
    if (brightMaterial.current) {
      const twinkle =
        0.72 + 0.28 * (0.5 + 0.5 * Math.sin(elapsed.current * 1.8));
      brightMaterial.current.opacity = fade * twinkle;
    }
  });

  return (
    <>
      <points ref={stars} name="orbital-stars">
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          ref={material}
          color="#cce7f5"
          size={mobile ? 0.06 : 0.075}
          sizeAttenuation
          transparent
          opacity={0.9}
          depthWrite={false}
          toneMapped={false}
        />
      </points>
      <points ref={brightStars} name="bright-orbital-stars">
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[brightPositions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          ref={brightMaterial}
          color="#fff5da"
          size={mobile ? 0.13 : 0.15}
          sizeAttenuation
          transparent
          opacity={1}
          depthWrite={false}
          blending={AdditiveBlending}
          toneMapped={false}
        />
      </points>
    </>
  );
}

function AtmosphereClouds({ progress }: { progress: ProgressRef }) {
  const pass = useRef<Mesh>(null);
  const material = useRef<ShaderMaterial>(null);
  const elapsed = useRef(0);
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uEntry: { value: 0 },
    }),
    [],
  );

  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    elapsed.current += delta;
    const p = progress.current.value;
    // Reveal the cloud bank during the Indian Ocean lock, then hand off to water.
    const entry =
      smoothstep(0.23, 0.30, p) * (1 - smoothstep(0.36, 0.425, p));

    if (pass.current) pass.current.visible = entry > 0.001;
    if (material.current) {
      material.current.uniforms.uTime.value = elapsed.current;
      material.current.uniforms.uEntry.value = entry;
    }
  });

  return (
    <mesh
      ref={pass}
      visible={false}
      frustumCulled={false}
      renderOrder={3}
    >
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={material}
        vertexShader={cloudEntryVertex}
        fragmentShader={cloudEntryFragment}
        uniforms={uniforms}
        transparent
        depthTest={false}
        depthWrite={false}
      />
    </mesh>
  );
}

function Satellite({
  progress,
  phase = 0.55,
  speed = 0.22,
  orbitScale = 1,
  verticalScale = 1.03,
  satelliteScale = 0.17,
  panelColor = "#1a3e63",
}: {
  progress: ProgressRef;
  phase?: number;
  speed?: number;
  orbitScale?: number;
  verticalScale?: number;
  satelliteScale?: number;
  panelColor?: string;
}) {
  const satellite = useRef<Group>(null);
  const panels = useRef<Group>(null);
  const elapsed = useRef(0);
  useFrame((_, rawDelta) => {
    if (!satellite.current) return;
    const delta = Math.min(rawDelta, 0.05);
    elapsed.current += delta;
    const p = progress.current.value;
    // Smooth fade instead of a hard mid-orbit cut.
    const fade = 1 - smoothstep(0.22, 0.28, p);
    satellite.current.visible = fade > 0.01;
    if (!satellite.current.visible) return;
    satellite.current.traverse((child) => {
      const mat = (child as { material?: { transparent?: boolean; opacity?: number } })
        .material;
      if (mat && typeof mat.opacity === "number") {
        mat.transparent = true;
        mat.opacity = fade;
      }
    });
    // Scroll-decoupled Kepler-ish orbits with independent phases and inclinations.
    const t = elapsed.current * speed;
    const anomaly = t + phase + p * 0.35;
    const ecc = 0.18;
    const radius = 1 - ecc * Math.cos(anomaly);
    const a = 3.15 * radius * orbitScale;
    const b = 2.3 * radius * orbitScale;
    const x = Math.cos(anomaly) * a;
    const z = Math.sin(anomaly) * b;
    const y = Math.sin(anomaly * 0.9 + 0.4 + phase * 0.16) * verticalScale * radius;
    satellite.current.position.set(x, y, z);
    // Orient body along velocity, keep solar panels facing the sun dir.
    const ahead = anomaly + 0.08;
    const nx = Math.cos(ahead) * a;
    const nz = Math.sin(ahead) * b;
    satellite.current.lookAt(nx, y * 0.98, nz);
    if (panels.current) {
      panels.current.rotation.y = -anomaly * 0.6;
    }
  });
  return (
    <group ref={satellite} scale={satelliteScale}>
      <mesh>
        <boxGeometry args={[0.65, 0.65, 0.9]} />
        <meshStandardMaterial
          color="#deddd1"
          metalness={0.8}
          roughness={0.35}
        />
      </mesh>
      <group ref={panels}>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.045, 0.045, 4, 6]} />
          <meshStandardMaterial color="#a2aebb" />
        </mesh>
        {[-1, 1].map((side) => (
          <group key={side} position={[side * 1.45, 0, 0]}>
            <mesh>
              <boxGeometry args={[1.55, 0.035, 1.1]} />
              <meshStandardMaterial
                color={panelColor}
                metalness={0.8}
                roughness={0.3}
              />
            </mesh>
            {[0, 1, 2, 3].map((i) => (
              <mesh key={i} position={[-0.6 + i * 0.4, 0.025, 0]}>
                <boxGeometry args={[0.012, 0.01, 1.1]} />
                <meshBasicMaterial color="#9bb4c0" />
              </mesh>
            ))}
          </group>
        ))}
      </group>
      <mesh position={[0, 0.55, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.5, 0.3, 16, 1, true]} />
        <meshStandardMaterial
          color="#c3c5c1"
          metalness={0.75}
          roughness={0.25}
          side={2}
        />
      </mesh>
    </group>
  );
}

export function EarthScene({
  progress,
  mobile,
}: {
  progress: ProgressRef;
  mobile: boolean;
}) {
  const group = useRef<Group>(null);
  const earth = useRef<Group>(null);
  const target = useRef<Group>(null);
  const atmosphere = useRef<ShaderMaterial>(null);
  const cloud = useRef<Mesh>(null);
  const ocean = useRef<Mesh>(null);
  const oceanMaterial = useRef<ShaderMaterial>(null);
  const glow = useRef<Mesh>(null);
  const textureTime = useRef(0);

  const [dayMap, specMap, cloudMap, nightMap] = useLoader(TextureLoader, [
    EARTH_DAY,
    EARTH_SPEC,
    EARTH_CLOUD,
    EARTH_NIGHT,
  ]);

  const atmosphereUniforms = useMemo(
    () => ({
      glowColor: { value: new Color(0x4488ff) },
      coefficient: { value: 0.6 },
      power: { value: 3.5 },
    }),
    [],
  );
  const oceanUniforms = useMemo(() => ({ uTime: { value: 0 } }), []);
  const marker = useMemo(() => {
    const latitude = (12 * Math.PI) / 180,
      longitude = (72 * Math.PI) / 180;
    const normal = new Vector3(
      Math.cos(latitude) * Math.cos(longitude),
      Math.sin(latitude),
      -Math.cos(latitude) * Math.sin(longitude),
    );
    return {
      position: normal.clone().multiplyScalar(2.225),
      rotation: new Quaternion().setFromUnitVectors(
        new Vector3(0, 0, 1),
        normal,
      ),
    };
  }, []);
  // Stateful yaw: free spin accumulates here, scroll-lock pulls toward the
  // nearest equivalent of the Indian Ocean yaw via the shortest arc.
  const yaw = useRef(-2.65);
  const elapsed = useRef(0);

  useFrame((_, rawDelta) => {
    const p = progress.current.value;
    if (!group.current || !earth.current) return;
    group.current.visible = p < OCEAN_TRANSITION.end;
    if (!group.current.visible) return;
    const delta = Math.min(rawDelta, 0.05);
    elapsed.current += delta;
    textureTime.current += delta;
    if (cloud.current) cloud.current.rotation.y += delta * 0.055;
    if (ocean.current) ocean.current.rotation.y += delta * 0.04;
    if (glow.current) glow.current.rotation.y += delta * 0.04;
    if (oceanMaterial.current) {
      oceanMaterial.current.uniforms.uTime.value = textureTime.current;
    }

    const approach = smoothstep(
      EARTH_LOCK_RANGE.start,
      EARTH_LOCK_RANGE.end,
      p,
    );
    const eased = approach * approach * (3 - 2 * approach);
    const plunge = smoothstep(0.34, OCEAN_TRANSITION.end, p);
    const plungeEased = plunge * plunge * (3 - 2 * plunge);
    group.current.position.set(
      lerp(mobile ? 0.5 : 1.85, 0.15, eased),
      lerp(mobile ? 1.2 : 0.02, -0.3, eased),
      0,
    );
    group.current.scale.setScalar(
      lerp(mobile ? 0.86 : 1, 1.32, eased) + plungeEased * 1.15,
    );
    // Idle spin runs until the lock engages; once locked, the shortest
    // arc pulls yaw onto the Indian Ocean. Scrubbing back resumes spin
    // from the current yaw with no jump.
    yaw.current += EARTH_SPIN_RATE * delta * (1 - eased);
    const desired = nearestEquivalentAngle(yaw.current, INDIAN_OCEAN_YAW);
    const pull = shortestAngleDelta(yaw.current, desired);
    yaw.current += pull * (1 - Math.exp(-2.2 * delta)) * eased;
    earth.current.rotation.y =
      yaw.current + Math.sin(elapsed.current * 0.035) * 0.015 * (1 - eased);
    earth.current.rotation.x = 0.16;
    earth.current.rotation.z = 0;
    if (target.current) {
      const targetFade =
        smoothstep(0.27, 0.3, p) * (1 - smoothstep(0.375, 0.405, p));
      target.current.visible = targetFade > 0.01;
      target.current.scale.setScalar(
        (1 / group.current.scale.x) * (0.8 + targetFade * 0.2),
      );
      target.current.traverse((child) => {
        const mat = (child as { material?: { opacity?: number } }).material;
        if (mat && typeof mat.opacity === "number") mat.opacity = targetFade;
      });
    }
  });

  return (
    <>
      <StarField mobile={mobile} progress={progress} />
      <AtmosphereClouds progress={progress} />
      <ambientLight intensity={0.45} color="#a3bccb" />
      <directionalLight position={[-4, 6, 6]} intensity={2.4} color="#e5eff6" />
      <directionalLight
        position={[4, -2, -3]}
        intensity={0.35}
        color="#3a5a6e"
      />
      <group
        ref={group}
        name="orbital-earth"
        position={[mobile ? 0.5 : 1.85, mobile ? 1.2 : 0.02, 0]}
      >
        <group ref={earth} rotation={[0.16, -2.65, 0.04]}>
          <mesh>
            <sphereGeometry args={[2.2, mobile ? 64 : 96, mobile ? 48 : 64]} />
            <meshPhongMaterial
              map={dayMap}
              specularMap={specMap}
              specular="#226688"
              shininess={18}
              emissiveMap={nightMap}
              emissive="#ffaa44"
              emissiveIntensity={0.6}
            />
          </mesh>

          <mesh ref={ocean}>
            <sphereGeometry
              args={[2.2 * 1.0004, mobile ? 64 : 96, mobile ? 48 : 64]}
            />
            <shaderMaterial
              ref={oceanMaterial}
              vertexShader={oceanVertex}
              fragmentShader={oceanFragment}
              uniforms={oceanUniforms}
              transparent
              blending={AdditiveBlending}
              depthWrite={false}
              side={FrontSide}
            />
          </mesh>

          <mesh ref={cloud}>
            <sphereGeometry
              args={[2.2 * 1.014, mobile ? 64 : 96, mobile ? 48 : 64]}
            />
            <meshPhongMaterial
              map={cloudMap}
              transparent
              opacity={0.75}
              depthWrite={false}
              blending={AdditiveBlending}
            />
          </mesh>

          <mesh ref={glow}>
            <sphereGeometry
              args={[2.2 * 1.03, mobile ? 64 : 96, mobile ? 48 : 64]}
            />
            <shaderMaterial
              ref={atmosphere}
              vertexShader={atmosphereVertex}
              fragmentShader={atmosphereFragment}
              uniforms={atmosphereUniforms}
              transparent
              blending={AdditiveBlending}
              depthWrite={false}
              side={FrontSide}
            />
          </mesh>

          <mesh>
            <sphereGeometry
              args={[2.2 * 1.1, mobile ? 64 : 96, mobile ? 48 : 64]}
            />
            <meshBasicMaterial
              color="#2244aa"
              transparent
              opacity={0.06}
              side={BackSide}
              depthWrite={false}
              blending={AdditiveBlending}
            />
          </mesh>
          <group
            ref={target}
            position={marker.position}
            quaternion={marker.rotation}
            visible={false}
          >
            <mesh>
              <ringGeometry args={[0.07, 0.076, 48]} />
              <meshBasicMaterial
                color="#eca07b"
                transparent
                opacity={0.9}
                depthWrite={false}
              />
            </mesh>
            <mesh>
              <ringGeometry args={[0.125, 0.127, 48]} />
              <meshBasicMaterial
                color="#eca07b"
                transparent
                opacity={0.4}
                depthWrite={false}
              />
            </mesh>
          </group>
        </group>
        <Satellite progress={progress} phase={0.55} speed={0.22} />
        <Satellite
          progress={progress}
          phase={2.25}
          speed={0.18}
          orbitScale={1.12}
          verticalScale={1.28}
          satelliteScale={0.14}
          panelColor="#244f74"
        />
        <Satellite
          progress={progress}
          phase={4.1}
          speed={0.27}
          orbitScale={0.9}
          verticalScale={0.78}
          satelliteScale={0.13}
          panelColor="#315f68"
        />
        <Satellite
          progress={progress}
          phase={5.35}
          speed={0.15}
          orbitScale={1.24}
          verticalScale={0.92}
          satelliteScale={0.12}
          panelColor="#3b526e"
        />
      </group>
    </>
  );
}

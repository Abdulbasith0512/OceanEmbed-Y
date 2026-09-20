"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { AdditiveBlending, Group, Mesh, ShaderMaterial } from "three";
import { smoothstep } from "@/lib/ocean";
import { depthAtProgress, OCEAN_TRANSITION } from "@/lib/animation/journey";
import { MarineLife } from "./marine-life";
import type { ProgressRef } from "./experience-canvas";

const particleVertex = /* glsl */ `
uniform float uTime; uniform float uDepth; uniform float uReveal;
attribute float aSeed; varying float vAlpha; varying float vFade;
void main(){
  vec3 p=position;
  // Buoyancy + drag: terminal rise with gentle oscillation, not linear teleport.
  float rise = uTime*(0.05+aSeed*0.06);
  float buoy = sin(uTime*0.35+aSeed*6.28)*0.25;
  // Turbulence: two-axis curl-ish sway instead of single-axis sine.
  float turbX = sin(uTime*0.12+aSeed*40.0)*0.35 + sin(uTime*0.043+aSeed*17.0)*0.25;
  float turbZ = cos(uTime*0.10+aSeed*31.0)*0.22;
  p.y += rise*0.35 + buoy + uDepth*0.0012;
  p.x += turbX;
  p.z += turbZ;
  // Soft wrap fade near bounds to avoid popping.
  float wrapped = mod(p.y+6.0,12.0);
  p.y = wrapped-6.0;
  vFade = smoothstep(0.0,0.8,wrapped)*(1.0-smoothstep(11.2,12.0,wrapped));
  vec3 grid=vec3(floor(position.x*2.0)/2.0,-1.8+sin(position.x*0.7+position.z*0.6)*0.16,position.z);
  float revealEased = uReveal*uReveal*(3.0-2.0*uReveal);
  p=mix(p,grid,revealEased);
  vec4 mv=modelViewMatrix*vec4(p,1.0); gl_Position=projectionMatrix*mv;
  // Marine snow densifies visually with depth: slightly larger, softer.
  float depthT = clamp(uDepth/1000.0,0.0,1.0);
  gl_PointSize=clamp((0.6+aSeed*1.1)*(1.0+depthT*0.5)*(10.0/-mv.z),0.5,2.6);
  float twinkle = 0.75+0.25*sin(uTime*(1.0+aSeed*2.0)+aSeed*40.0);
  vAlpha=(0.08+aSeed*0.27)*twinkle;
}`;
const particleFragment = /* glsl */ `
uniform float uDepth; uniform float uReveal; uniform float uSubmerge;
varying float vAlpha; varying float vFade;
void main(){
  float r=length(gl_PointCoord-0.5);if(r>0.5)discard;
  float depthT=clamp(uDepth/1000.0,0.0,1.0);
  vec3 c=mix(vec3(0.42,0.76,0.82),vec3(0.31,0.65,0.72),depthT);
  c=mix(c,vec3(0.87,0.56,0.37),uReveal*0.55);
  // Bioluminescent tint grows in the deep.
  c+=vec3(0.10,0.35,0.38)*smoothstep(0.5,1.0,depthT)*0.35;
  float soft = (1.0-r*2.0);
  soft*=soft;
  gl_FragColor=vec4(c,soft*vAlpha*vFade*uSubmerge);
}`;
const waterVertex = /* glsl */ `varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.999,1.0);}`;
const waterFragment = /* glsl */ `
uniform float uTime; uniform float uDepth; uniform float uOpacity; uniform float uSubmerge;
varying vec2 vUv;

float wave(vec2 p){
  float w = sin(dot(p, vec2(1.0, 0.42)) * 20.0 + uTime * 0.22);
  w += 0.52 * sin(dot(p, vec2(-0.68, 1.0)) * 31.0 - uTime * 0.18 + sin(p.y * 9.0));
  w += 0.26 * sin(dot(p, vec2(0.86, 0.58)) * 57.0 + uTime * 0.31);
  w += 0.14 * sin(dot(p, vec2(-0.34, 0.94)) * 91.0 - uTime * 0.25);
  return w / 1.92;
}

float noise(vec2 p){
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = fract(sin(dot(i, vec2(127.1, 311.7))) * 43758.5453);
  float b = fract(sin(dot(i + vec2(1.0, 0.0), vec2(127.1, 311.7))) * 43758.5453);
  float c = fract(sin(dot(i + vec2(0.0, 1.0), vec2(127.1, 311.7))) * 43758.5453);
  float d = fract(sin(dot(i + vec2(1.0, 1.0), vec2(127.1, 311.7))) * 43758.5453);
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

void main(){
  vec2 uv = vUv;
  float depthT = clamp(uDepth / 1000.0, 0.0, 1.0);
  float horizon = 0.565 + sin(uv.x * 5.0 + uTime * 0.08) * 0.008;
  float surfaceY = horizon - uv.y;
  float belowSurface = smoothstep(-0.015, 0.035, surfaceY);

  // Layered directional waves give the water a coherent current instead of a grid-like pattern.
  float broad = wave(uv * 1.35 + vec2(uTime * 0.012, -uTime * 0.018));
  float detail = wave(uv * 3.8 - vec2(uTime * 0.026, uTime * 0.021));
  float micro = wave(uv * 9.0 + vec2(-uTime * 0.05, uTime * 0.037));
  float volumeNoise = noise(uv * 5.0 + vec2(uTime * 0.018, -uTime * 0.012));

  float surfaceLight = 1.0 - smoothstep(0.0, 0.78, depthT);
  vec3 deepWater = vec3(0.0015, 0.009, 0.022);
  vec3 shallowWater = vec3(0.008, 0.12, 0.16);
  vec3 water = mix(deepWater, shallowWater, surfaceLight);
  water += vec3(0.012, 0.045, 0.052) * (broad * 0.5 + 0.5) * (0.25 + surfaceLight * 0.75);
  water += vec3(0.006, 0.025, 0.032) * (detail * 0.5 + 0.5) * (1.0 - depthT * 0.55);
  water += vec3(0.004, 0.012, 0.014) * volumeNoise * (1.0 - depthT * 0.35);

  // Caustics and sun shafts decay quickly as the camera descends.
  float caustic = pow(max(0.0, 1.0 - abs(wave(uv * 2.1 + vec2(uTime * 0.03, -uTime * 0.022)))), 10.0);
  float rayCoordinate = uv.x + (1.0 - uv.y) * 0.28;
  float ray = pow(max(0.0, sin(rayCoordinate * 26.0 + uTime * 0.065)), 18.0);
  ray *= pow(max(surfaceY, 0.0), 0.7) * exp(-depthT * 4.2);
  water += vec3(0.055, 0.18, 0.20) * caustic * surfaceLight * belowSurface * 0.7;
  water += vec3(0.05, 0.16, 0.18) * ray * 0.85;

  // Surface reflection and foam remain visible during the handoff from air to water.
  float crest = pow(max(0.0, broad * 0.7 + detail * 0.3), 5.0);
  float ripple = abs(micro * 0.45 + detail * 0.55);
  vec3 surface = water + vec3(0.025, 0.09, 0.10) * crest * belowSurface;
  float fresnel = pow(1.0 - clamp(abs(surfaceY) * 5.0, 0.0, 1.0), 2.0);
  surface += vec3(0.045, 0.13, 0.14) * fresnel * surfaceLight;
  float foamLine = exp(-abs(surfaceY) * 170.0) * (0.3 + crest * 0.7);
  surface += vec3(0.25, 0.42, 0.42) * foamLine * (0.35 + surfaceLight * 0.65);

  vec3 sky = mix(
    vec3(0.008, 0.025, 0.037),
    vec3(0.08, 0.20, 0.23),
    clamp(1.0 - (uv.y - horizon) * 3.0, 0.0, 1.0)
  );
  sky += vec3(0.02, 0.07, 0.08) * (noise(uv * 4.0 + uTime * 0.01) - 0.35);
  vec3 above = mix(surface, sky, smoothstep(-0.012, 0.012, uv.y - horizon));

  // The submerge envelope removes the visible horizon while entering the volume.
  float foamBurst = exp(-pow((uSubmerge - 0.42) * 6.0, 2.0)) * smoothstep(0.28, 0.55, uv.y);
  above += vec3(0.22, 0.38, 0.39) * foamBurst * 0.28;
  vec3 finalColor = mix(above, water, uSubmerge);
  finalColor *= 1.0 - depthT * 0.18;
  gl_FragColor = vec4(finalColor, uOpacity);
}`;

const splashVertex = /* glsl */ `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.997, 1.0);
  }
`;

const splashFragment = /* glsl */ `
  precision mediump float;
  uniform float uTime;
  uniform float uSplash;
  uniform float uImpact;
  uniform float uDepth;
  varying vec2 vUv;

  float hash(float n) {
    return fract(sin(n * 91.73) * 43758.5453);
  }

  float hash2(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash2(i), hash2(i + vec2(1.0, 0.0)), f.x),
      mix(hash2(i + vec2(0.0, 1.0)), hash2(i + vec2(1.0, 1.0)), f.x),
      f.y
    );
  }

  void main() {
    float horizon = 0.565;
    float droplets = 0.0;
    float trails = 0.0;
    float foamFragments = 0.0;

    // Each droplet has its own fall speed, width, sway, and breakup point.
    for (int i = 0; i < 18; i++) {
      float index = float(i);
      float seed = hash(index + 2.7);
      float speed = 0.38 + seed * 0.48;
      float cycle = fract(uTime * speed + seed * 1.7);
      float x = 0.06 + seed * 0.88 + sin(uTime * (0.32 + seed * 0.22) + index) * 0.026;
      float y = horizon + 0.035 - cycle * (0.70 + seed * 0.24);
      float size = 0.003 + seed * 0.007;
      float distanceToDrop = length((vUv - vec2(x, y)) / vec2(size, size * 1.9));
      float life = 1.0 - smoothstep(0.68, 1.0, cycle);
      droplets += (1.0 - smoothstep(0.16, 1.0, distanceToDrop)) * life;

      float horizontal = 1.0 - smoothstep(0.0, size * 1.35, abs(vUv.x - x));
      float vertical = smoothstep(y, y + 0.13, vUv.y) *
        (1.0 - smoothstep(y + 0.13, y + 0.24, vUv.y));
      trails += horizontal * vertical * 0.30 * life;

      // Broken foam flecks replace the old geometric splash ring.
      float fragmentX = 0.06 + hash(index + 19.4) * 0.88;
      float fragmentY = horizon + (hash(index + 35.8) - 0.5) * 0.13;
      float fragmentSize = 0.004 + hash(index + 51.2) * 0.010;
      float fragmentDistance = length(
        (vUv - vec2(fragmentX, fragmentY)) / vec2(fragmentSize * 2.8, fragmentSize * 0.6)
      );
      foamFragments += (1.0 - smoothstep(0.2, 1.0, fragmentDistance)) *
        (0.35 + 0.65 * uSplash);
    }

    // A broken, noisy sheet of water hangs near the surface without forming an oval.
    float sheetNoise = noise(vec2(vUv.x * 11.0 + uTime * 0.22, vUv.y * 3.5 - uTime * 0.08));
    float sheet = exp(-abs(vUv.y - horizon) * 75.0) *
      smoothstep(0.42, 0.78, sheetNoise) * 0.35;
    float impactSheet = exp(-abs(vUv.y - horizon) * 115.0) *
      smoothstep(0.3, 0.78, sheetNoise) * uImpact * 0.9;
    float freshness = 1.0 - smoothstep(2.0, 50.0, uDepth);
    float alpha = (droplets * 0.64 + trails + foamFragments * 0.52 + sheet + impactSheet) *
      uSplash;
    vec3 foam = mix(vec3(0.23, 0.49, 0.56), vec3(0.86, 0.98, 0.97), freshness);
    gl_FragColor = vec4(foam, clamp(alpha, 0.0, 0.84));
  }
`;


export function OceanDive({
  progress,
  mobile,
}: {
  progress: ProgressRef;
  mobile: boolean;
}) {
  const group = useRef<Group>(null);
  const water = useRef<ShaderMaterial>(null);
  const particles = useRef<ShaderMaterial>(null);
  const splashMesh = useRef<Mesh>(null);
  const splash = useRef<ShaderMaterial>(null);
  const count = mobile ? 320 : 800;
  const data = useMemo(() => {
    const positions = new Float32Array(count * 3),
      seeds = new Float32Array(count);
    const rand = (n: number) => {
      const x = Math.sin(n * 127.1) * 43758.5453;
      return x - Math.floor(x);
    };
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (rand(i + 1) - 0.5) * 22;
      positions[i * 3 + 1] = (rand(i + 900) - 0.5) * 12;
      positions[i * 3 + 2] = -rand(i + 2100) * 12;
      seeds[i] = rand(i + 3800);
    }
    return { positions, seeds };
  }, [count]);
  const waterUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uDepth: { value: 0 },
      uOpacity: { value: 0 },
      uSubmerge: { value: 0 },
    }),
    [],
  );
  const particleUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uDepth: { value: 0 },
      uReveal: { value: 0 },
      uSubmerge: { value: 0 },
    }),
    [],
  );
  const splashUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uSplash: { value: 0 },
      uImpact: { value: 0 },
      uDepth: { value: 0 },
    }),
    [],
  );
  const elapsed = useRef(0);
  useFrame((_, rawDelta) => {
    const p = progress.current.value;
    if (group.current) group.current.visible = p >= OCEAN_TRANSITION.start;
    if (p < OCEAN_TRANSITION.start) return;
    elapsed.current += Math.min(rawDelta, 0.05);
    const time = elapsed.current;
    const depth = depthAtProgress(p);
    const reveal = smoothstep(0.9, 0.98, p);
    const opacity = smoothstep(
      OCEAN_TRANSITION.start,
      OCEAN_TRANSITION.end,
      p,
    );
    const submerge = smoothstep(0.44, 0.535, p);
    // A sharp impact peaks at exactly 1m, followed by a softer settling tail.
    const impact = Math.exp(-Math.pow((depth - 1.0) / 0.45, 2));
    const settling =
      smoothstep(0.65, 1.5, depth) *
      (1.0 - smoothstep(1.0, 50.0, depth)) *
      0.45;
    const splashAmount = Math.min(1, impact + settling);
    if (water.current) {
      water.current.uniforms.uTime.value = time;
      water.current.uniforms.uDepth.value = depth;
      water.current.uniforms.uOpacity.value = opacity;
      water.current.uniforms.uSubmerge.value = submerge;
    }
    if (particles.current) {
      particles.current.uniforms.uTime.value = time;
      particles.current.uniforms.uDepth.value = depth;
      particles.current.uniforms.uReveal.value = reveal;
      particles.current.uniforms.uSubmerge.value = Math.max(submerge, 0.12);
    }
    if (splashMesh.current) splashMesh.current.visible = splashAmount > 0.001;
    if (splash.current) {
      splash.current.uniforms.uTime.value = time;
      splash.current.uniforms.uSplash.value = splashAmount;
      splash.current.uniforms.uImpact.value = impact;
      splash.current.uniforms.uDepth.value = depth;
    }
  });
  return (
    <group ref={group} name="ocean-world" visible={false}>
      <mesh frustumCulled={false} renderOrder={1}>
        <planeGeometry args={[2, 2]} />
        <shaderMaterial
          ref={water}
          vertexShader={waterVertex}
          fragmentShader={waterFragment}
          uniforms={waterUniforms}
          transparent
          depthWrite={false}
          depthTest={false}
        />
      </mesh>
      <mesh
        ref={splashMesh}
        visible={false}
        frustumCulled={false}
        renderOrder={5}
      >
        <planeGeometry args={[2, 2]} />
        <shaderMaterial
          ref={splash}
          vertexShader={splashVertex}
          fragmentShader={splashFragment}
          uniforms={splashUniforms}
          transparent
          depthTest={false}
          depthWrite={false}
        />
      </mesh>
      <points frustumCulled={false} renderOrder={4}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[data.positions, 3]}
          />
          <bufferAttribute attach="attributes-aSeed" args={[data.seeds, 1]} />
        </bufferGeometry>
        <shaderMaterial
          ref={particles}
          vertexShader={particleVertex}
          fragmentShader={particleFragment}
          uniforms={particleUniforms}
          transparent
          depthWrite={false}
          blending={AdditiveBlending}
        />
      </points>
      <MarineLife progress={progress} mobile={mobile} />
    </group>
  );
}

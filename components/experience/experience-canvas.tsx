"use client";

import {
  Component,
  Suspense,
  useEffect,
  useRef,
  useSyncExternalStore,
  type ReactNode,
  type RefObject,
} from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { AdaptiveDpr, PerformanceMonitor } from "@react-three/drei";
import { Color, MathUtils } from "three";
import { EarthScene } from "./space-scene";
import { OceanDive } from "./ocean-dive";
import { smoothstep } from "@/lib/ocean";

export type ProgressRef = RefObject<{ value: number }>;
type Availability = (ready: boolean) => void;

let webglAvailable: boolean | undefined;
function supportsWebGL() {
  if (webglAvailable !== undefined) return webglAvailable;
  try {
    const context = document.createElement("canvas").getContext("webgl2");
    webglAvailable = Boolean(context);
    context?.getExtension("WEBGL_lose_context")?.loseContext();
  } catch {
    webglAvailable = false;
  }
  return webglAvailable;
}
const subscribe = () => () => {};

class CanvasBoundary extends Component<
  { children: ReactNode; onAvailability: Availability },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onAvailability(false);
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

function RenderLifecycle({ onAvailability }: { onAvailability: Availability }) {
  const { gl, setFrameloop, invalidate } = useThree();
  const ready = useRef(false);
  useFrame(() => {
    if (!ready.current) {
      ready.current = true;
      onAvailability(true);
    }
  });
  useEffect(() => {
    const visibility = () => {
      // Pause fully when hidden; resume without forcing a full-rate loop
      // when the tab was only briefly backgrounded.
      setFrameloop(document.hidden ? "never" : "always");
      if (!document.hidden) invalidate();
    };
    const lost = (event: Event) => {
      event.preventDefault();
      gl.domElement.style.opacity = "0";
      onAvailability(false);
      setFrameloop("never");
    };
    const restored = () => {
      gl.domElement.style.opacity = "1";
      ready.current = false;
      setFrameloop(document.hidden ? "never" : "always");
      invalidate();
    };
    document.addEventListener("visibilitychange", visibility);
    gl.domElement.addEventListener("webglcontextlost", lost);
    gl.domElement.addEventListener("webglcontextrestored", restored);
    return () => {
      onAvailability(false);
      document.removeEventListener("visibilitychange", visibility);
      gl.domElement.removeEventListener("webglcontextlost", lost);
      gl.domElement.removeEventListener("webglcontextrestored", restored);
      // Release GPU context promptly on unmount (route change / reduced-motion).
      try {
        gl.dispose();
      } catch {
        // dispose is best-effort; context loss handler already covers fallback.
      }
    };
  }, [gl, setFrameloop, invalidate, onAvailability]);
  return null;
}

function CameraRig({
  progress,
  mobile,
}: {
  progress: ProgressRef;
  mobile: boolean;
}) {
  const color = useRef(new Color());
  const deepColor = useRef(new Color("#02070d"));
  const surfaceColor = useRef(new Color("#073c4d"));
  const spaceColor = useRef(new Color("#080d11"));
  const smoothed = useRef({ x: 0, y: 0, z: 9, drift: 1, fov: 38 });
  const lookTarget = useRef({ x: 0, y: 0 });
  const elapsed = useRef(0);
  useFrame(({ camera, scene }, rawDelta) => {
    const p = progress.current.value;
    const delta = Math.min(rawDelta, 0.05);
    elapsed.current += delta;
    const time = elapsed.current;
    // Smooth darkness-pause envelope instead of a binary 20x step.
    const pauseTarget = p > 0.78 && p < 0.92 ? 0.12 : 1;
    smoothed.current.drift +=
      (pauseTarget - smoothed.current.drift) * (1 - Math.exp(-2.2 * delta));
    const drift = smoothed.current.drift;
    // Inertial drift: critically-damped follow toward a sinusoidal target.
    const targetX = Math.sin(time * 0.09) * 0.06 * drift;
    const targetY = Math.cos(time * 0.07) * 0.035 * drift;
    smoothed.current.x +=
      (targetX - smoothed.current.x) * (1 - Math.exp(-1.6 * delta));
    smoothed.current.y +=
      (targetY - smoothed.current.y) * (1 - Math.exp(-1.6 * delta));
    // Eased dolly: slow orbital drift, committed approach, gentle dive push.
    const approach = smoothstep(0.12, 0.43, p);
    const eased = approach * approach * (3 - 2 * approach);
    const divePush = smoothstep(0.44, 0.62, p) * 0.35;
    const targetZ =
      MathUtils.lerp(9, 6.8, eased) - divePush + (mobile ? 0.7 : 0);
    smoothed.current.z +=
      (targetZ - smoothed.current.z) * (1 - Math.exp(-3.2 * delta));
    camera.position.set(
      smoothed.current.x,
      smoothed.current.y,
      smoothed.current.z,
    );
    // Subtle look-target lead + bank for parallax instead of fixed lookAt.
    const leadX = Math.sin(time * 0.05) * 0.08 * drift;
    const leadY = Math.cos(time * 0.06) * 0.05 * drift - smoothstep(0.44, 0.6, p) * 0.12;
    lookTarget.current.x +=
      (leadX - lookTarget.current.x) * (1 - Math.exp(-2 * delta));
    lookTarget.current.y +=
      (leadY - lookTarget.current.y) * (1 - Math.exp(-2 * delta));
    camera.lookAt(lookTarget.current.x, lookTarget.current.y, 0);
    camera.rotation.z +=
      (Math.sin(time * 0.04) * 0.008 * drift - camera.rotation.z) *
      (1 - Math.exp(-1.5 * delta));
    // FOV widens slightly on descent for a dive sensation, narrows in darkness.
    const persp = camera as { fov?: number; updateProjectionMatrix?: () => void };
    if (typeof persp.fov === "number") {
      const fovTarget =
        38 + smoothstep(0.4, 0.6, p) * 7 - smoothstep(0.78, 0.9, p) * 4;
      smoothed.current.fov +=
        (fovTarget - smoothed.current.fov) * (1 - Math.exp(-2.5 * delta));
      if (Math.abs(persp.fov - smoothed.current.fov) > 0.01) {
        persp.fov = smoothed.current.fov;
        persp.updateProjectionMatrix?.();
      }
    }
    // Continuous background: no branch discontinuity at p=0.45.
    const oceanMix = smoothstep(0.395, 0.46, p);
    const deepMix = smoothstep(0.46, 0.8, p);
    color.current
      .copy(spaceColor.current)
      .lerp(surfaceColor.current, oceanMix)
      .lerp(deepColor.current, deepMix);
    scene.background = color.current;
  });
  return null;
}

function QualityControl() {
  const regress = useThree((state) => state.performance.regress);
  return (
    <PerformanceMonitor onDecline={regress} onFallback={regress} flipflops={3}>
      <AdaptiveDpr />
    </PerformanceMonitor>
  );
}

export default function ExperienceCanvas({
  progress,
  mobile,
  onAvailability,
}: {
  progress: ProgressRef;
  mobile: boolean;
  onAvailability: Availability;
}) {
  const supported = useSyncExternalStore(subscribe, supportsWebGL, () => false);
  if (!supported) return null;
  return (
    <div className="experience-canvas" aria-hidden="true">
      <CanvasBoundary onAvailability={onAvailability}>
        <Canvas
          camera={{ position: [0, 0, 9], fov: 38, near: 0.1, far: 100 }}
          dpr={mobile ? [1, 1.25] : [1, 1.5]}
          gl={{
            antialias: !mobile,
            alpha: true,
            powerPreference: mobile ? "low-power" : "high-performance",
            stencil: false,
            depth: true,
          }}
          performance={{ min: 0.6, debounce: 3000 }}
          fallback={null}
        >
          <Suspense fallback={null}>
            <EarthScene progress={progress} mobile={mobile} />
            <OceanDive progress={progress} mobile={mobile} />
            <RenderLifecycle onAvailability={onAvailability} />
          </Suspense>
          <CameraRig progress={progress} mobile={mobile} />
          <QualityControl />
        </Canvas>
      </CanvasBoundary>
    </div>
  );
}

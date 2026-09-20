import { clamp, smoothstep } from "@/lib/ocean";

export const CHAPTERS = [
  { name: "Orbital perspective", start: 0, landing: 0, panel: 0 },
  { name: "Our blue planet", start: 0.17, landing: 0.23, panel: 1 },
  { name: "North Indian Ocean", start: 0.3, landing: 0.36, panel: 2 },
  { name: "The visible surface", start: 0.43, landing: 0.47, panel: 3 },
  { name: "Into the unknown", start: 0.54, landing: 0.61, panel: 4 },
  { name: "Descent into darkness", start: 0.69, landing: 0.745, panel: 5 },
  { name: "The unseen ocean", start: 0.8, landing: 0.85, panel: 6 },
  { name: "A deeper understanding", start: 0.91, landing: 0.96, panel: 7 },
] as const;

export const PANEL_WINDOWS = [
  [0, 0.17],
  [0.17, 0.3],
  [0.3, 0.43],
  [0.43, 0.54],
  [0.54, 0.69],
  [0.69, 0.8],
  [0.8, 0.91],
  [0.91, 1.1],
] as const;
export const OCEAN_TRANSITION = { start: 0.395, end: 0.44 } as const;
export const DIVE_START = 0.44;
export const DIVE_END = 0.82;
export const DEPTH_MARKS = [0, 50, 100, 200, 300, 500, 700, 1000] as const;

/** North Indian Ocean focus point for the Earth approach. */
export const INDIAN_OCEAN = { lat: 12, lon: 72 } as const;
/** Idle spin rate (rad/s) for the orbital globe when unlocked. */
export const EARTH_SPIN_RATE = 0.02;
/** Scroll window over which Earth locks onto the Indian Ocean. */
export const EARTH_LOCK_RANGE = { start: 0.13, end: 0.36 } as const;

/**
 * Yaw (rotation.y) that faces `lon` toward the camera (+Z) on a
 * three.js SphereGeometry. Derived from the same mapping used for the
 * surface marker: normal=(cosLat·cosLon, sinLat, -cosLat·sinLon), and
 * R_y(θ) brings its azimuth atan2(x,z) to zero, so θ=-atan2(x,z).
 */
export function targetYawForLon(lonDeg: number) {
  const lon = (lonDeg * Math.PI) / 180;
  // atan2(cosLon, -sinLon) === lon + π/2, so target === -lon - π/2.
  return -lon - Math.PI / 2;
}

export const INDIAN_OCEAN_YAW = targetYawForLon(INDIAN_OCEAN.lon);

/** Shortest signed angular difference in [-π, π]. */
export function shortestAngleDelta(from: number, to: number) {
  const twoPi = Math.PI * 2;
  let delta = (to - from) % twoPi;
  if (delta > Math.PI) delta -= twoPi;
  if (delta < -Math.PI) delta += twoPi;
  return delta;
}

/** Equivalent of `target` closest to `current` (avoids full extra turns). */
export function nearestEquivalentAngle(current: number, target: number) {
  const twoPi = Math.PI * 2;
  return target + Math.round((current - target) / twoPi) * twoPi;
}

export function depthAtProgress(progress: number) {
  // Continuous from the ocean crossfade: no 0m dead-zone between
  // OCEAN_TRANSITION.end and the old 0.49 start. Exponential shaping
  // keeps shallow storytelling slow and deep descent faster, while
  // remaining monotonic and bounded for scroll restoration.
  const t = smoothstep(DIVE_START, DIVE_END, progress);
  return Math.pow(t, 1.25) * 1000;
}

/** Log-spaced gauge position so 0/50/100m don't collide at the top. */
export function depthGaugePosition(depth: number) {
  const marks = [0, 50, 100, 200, 300, 500, 700, 1000];
  const d = clamp(depth, 0, 1000);
  if (d <= 0) return 0;
  if (d >= 1000) return 1;
  for (let i = 1; i < marks.length; i++) {
    if (d <= marks[i]) {
      const lo = marks[i - 1];
      const hi = marks[i];
      const segment = (i - 1) / (marks.length - 1);
      const t = (d - lo) / (hi - lo);
      return segment + t / (marks.length - 1);
    }
  }
  return 1;
}

/** Critically-damped-ish smoothing for per-frame values (frame-rate independent). */
export function dampValue(
  current: number,
  target: number,
  lambda: number,
  delta: number,
) {
  return current + (target - current) * (1 - Math.exp(-lambda * delta));
}

export function easeOutCubic(t: number) {
  const c = clamp(t);
  return 1 - Math.pow(1 - c, 3);
}

export function easeInOutCubic(t: number) {
  const c = clamp(t);
  return c < 0.5 ? 4 * c * c * c : 1 - Math.pow(-2 * c + 2, 3) / 2;
}
export function panelOpacity(index: number, progress: number) {
  const [start, end] = PANEL_WINDOWS[index];
  // Slightly wider, eased window avoids velocity kinks at edges.
  const fade = 0.035;
  return (
    (index === 0 ? 1 : smoothstep(start, start + fade, progress)) *
    (1 - smoothstep(end - fade, end, progress))
  );
}
export function chapterAtProgress(progress: number) {
  return Math.max(
    0,
    CHAPTERS.findLastIndex(({ start }) => progress >= start),
  );
}
export function normalizedScroll(offset: number, distance: number) {
  return distance > 0 ? clamp(offset / distance) : 0;
}

export function oceanZone(depth: number) {
  return depth < 200
    ? "SUNLIT ZONE"
    : depth < 700
      ? "TWILIGHT ZONE"
      : "MIDNIGHT ZONE";
}

/** Hysteresis wrapper prevents flicker when depth hovers on 200/700m. */
export function oceanZoneStable(
  depth: number,
  previous: string | null,
  hysteresis = 12,
) {
  if (!previous) return oceanZone(depth);
  if (previous === "SUNLIT ZONE" && depth < 200 + hysteresis)
    return "SUNLIT ZONE";
  if (previous === "TWILIGHT ZONE") {
    if (depth < 200 - hysteresis) return "SUNLIT ZONE";
    if (depth < 700 + hysteresis) return "TWILIGHT ZONE";
    return "MIDNIGHT ZONE";
  }
  if (previous === "MIDNIGHT ZONE" && depth >= 700 - hysteresis)
    return "MIDNIGHT ZONE";
  return oceanZone(depth);
}

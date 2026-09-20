import { clamp, REGION } from "@/lib/ocean";
import {
  DEPTHS,
  type Depth,
  type OceanLocation,
  type ReconstructionPoint,
} from "@/types/ocean";

export function validateDate(date: string) {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    !Number.isFinite(Date.parse(date)) ||
    new Date(date).toISOString().slice(0, 10) !== date
  ) {
    throw new Error("Choose a valid calendar date.");
  }
}

export function validateDepth(depth: number): asserts depth is Depth {
  if (!DEPTHS.includes(depth as Depth))
    throw new Error("Choose one of the 15 supported depth levels.");
}

export function validateLocation({ lat, lon }: OceanLocation) {
  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lon) ||
    lat < REGION.south ||
    lat > REGION.north ||
    lon < REGION.west ||
    lon > REGION.east
  ) {
    throw new Error(
      "Choose a location within the North Indian Ocean study region.",
    );
  }
}

// A deterministic visual demonstration, never a trained model or an observation.
export function sampleOcean(
  lat: number,
  lon: number,
  depth: Depth,
  date: string,
): ReconstructionPoint {
  const day = Date.parse(`${date}T00:00:00Z`) / 86400000;
  const season = Math.sin((day / 365.25) * Math.PI * 2);
  const eddy =
    Math.sin(lon * 0.25 + lat * 0.34 + day * 0.018) *
    Math.cos(lat * 0.35 - lon * 0.12);
  const surface = 28.8 - Math.abs(lat - 6) * 0.09 + season * 0.85 + eddy * 1.1;
  const thermocline =
    150 + 35 * Math.sin(lon * 0.12) + 20 * Math.cos(lat * 0.2);
  const temperature =
    4.5 +
    (surface - 4.5) * Math.exp(-depth / thermocline) +
    eddy * 0.35 * Math.exp(-depth / 650);
  const observability = clamp(
    (0.92 + eddy * 0.06) * Math.exp(-depth / 390),
    0.04,
    0.99,
  );
  const uncertainty =
    0.16 + (1 - observability) * 1.55 + Math.abs(eddy) * (0.14 + depth / 4500);
  return {
    lat,
    lon,
    temperature: +temperature.toFixed(3),
    observability: +observability.toFixed(3),
    uncertainty: +uncertainty.toFixed(3),
  };
}

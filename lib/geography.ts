import geometry from "@/lib/generated/land.json";
import { REGION } from "./ocean";
import type { LandGeometry, OceanLocation } from "@/types/ocean";

export const land = geometry as LandGeometry;
const bounds = land.coordinates.map((polygon) => {
  const ring = polygon[0];
  return {
    west: Math.min(...ring.map((p) => p[0])),
    east: Math.max(...ring.map((p) => p[0])),
    south: Math.min(...ring.map((p) => p[1])),
    north: Math.max(...ring.map((p) => p[1])),
    polygon,
  };
});

export function pointInRing(lon: number, lat: number, ring: number[][]) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (
      yi > lat !== yj > lat &&
      lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi
    )
      inside = !inside;
  }
  return inside;
}

export function isOcean({ lat, lon }: OceanLocation) {
  if (
    lon < REGION.west ||
    lon > REGION.east ||
    lat < REGION.south ||
    lat > REGION.north
  )
    return false;
  return !bounds.some(
    ({ west, east, south, north, polygon }) =>
      lon >= west &&
      lon <= east &&
      lat >= south &&
      lat <= north &&
      pointInRing(lon, lat, polygon[0]) &&
      !polygon.slice(1).some((ring) => pointInRing(lon, lat, ring)),
  );
}

export function locationName({ lat, lon }: OceanLocation) {
  if (lat < 5) return "Equatorial Indian Ocean";
  return lon < 80 ? "Arabian Sea" : "Bay of Bengal";
}

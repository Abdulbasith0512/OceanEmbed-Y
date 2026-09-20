import type { DataLayer, OceanLocation } from "@/types/ocean";

export const REGION = { west: 40, east: 105, south: -5, north: 30 } as const;
export const DEFAULT_DATE = "2026-08-28";
export const DEFAULT_LOCATION: OceanLocation = { lat: 12, lon: 72 };
export const LAYERS: Record<
  DataLayer,
  {
    label: string;
    symbol: string;
    unit: string;
    min: number;
    max: number;
    colors: string[];
    description: string;
  }
> = {
  temperature: {
    label: "Temperature",
    symbol: "T̂(z)",
    unit: "°C",
    min: 4,
    max: 32,
    colors: ["#22375f", "#266d97", "#4ebbb2", "#e0d17a", "#e58b57", "#c9493d"],
    description: "Reconstructed subsurface temperature",
  },
  observability: {
    label: "Observability",
    symbol: "O(z)",
    unit: "",
    min: 0,
    max: 1,
    colors: ["#17283b", "#28526a", "#388d94", "#a4ddc0"],
    description: "How strongly surface observations constrain this depth",
  },
  uncertainty: {
    label: "Uncertainty",
    symbol: "σ(z)",
    unit: "°C",
    min: 0,
    max: 2.5,
    colors: ["#23374b", "#687b90", "#c9b18f", "#eeb174", "#d26745"],
    description: "Illustrative predictive uncertainty",
  },
};

export const clamp = (x: number, lo = 0, hi = 1) =>
  Math.max(lo, Math.min(hi, x));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const smoothstep = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

/** Derived confidence proxy for a reconstructed temperature value. */
export function predictionConfidence(observability: number, uncertainty: number) {
  return clamp(observability * Math.exp(-uncertainty / 2.2));
}

export function colorForValue(value: number, layer: DataLayer): string {
  const { min, max, colors } = LAYERS[layer];
  const position = clamp((value - min) / (max - min)) * (colors.length - 1);
  const index = Math.min(Math.floor(position), colors.length - 2);
  const t = position - index;
  const a = colors[index]
    .slice(1)
    .match(/.{2}/g)!
    .map((c) => parseInt(c, 16));
  const b = colors[index + 1]
    .slice(1)
    .match(/.{2}/g)!
    .map((c) => parseInt(c, 16));
  return `rgb(${a.map((v, i) => Math.round(lerp(v, b[i], t))).join(",")})`;
}

export function formatLocation({ lat, lon }: OceanLocation) {
  return `${Math.abs(lat).toFixed(2)}° ${lat >= 0 ? "N" : "S"} / ${Math.abs(lon).toFixed(2)}° ${lon >= 0 ? "E" : "W"}`;
}

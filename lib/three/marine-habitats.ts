import { smoothstep } from "@/lib/ocean";
import type { MarineKind } from "./marine-geometry";

// Overlapping artistic encounter ranges, not species distribution measurements.
export const MARINE_HABITATS: {
  kind: MarineKind;
  count: number;
  enter: [number, number];
  leave: [number, number];
  scale: number;
  speed: number;
  shader: number;
}[] = [
  {
    kind: "fish",
    count: 24,
    enter: [2, 28],
    leave: [140, 300],
    scale: 0.19,
    speed: 0.24,
    shader: 0,
  },
  {
    kind: "ray",
    count: 2,
    enter: [2, 30],
    leave: [140, 280],
    scale: 0.52,
    speed: 0.12,
    shader: 1,
  },
  {
    kind: "turtle",
    count: 1,
    enter: [2, 22],
    leave: [90, 210],
    scale: 0.53,
    speed: 0.1,
    shader: 2,
  },
  {
    kind: "jelly",
    count: 4,
    enter: [90, 220],
    leave: [630, 850],
    scale: 0.66,
    speed: 0.035,
    shader: 3,
  },
  {
    kind: "squid",
    count: 3,
    enter: [230, 390],
    leave: [800, 1010],
    scale: 0.4,
    speed: 0.14,
    shader: 4,
  },
  {
    kind: "siphonophore",
    count: 2,
    enter: [570, 750],
    leave: [1000, 1100],
    scale: 0.7,
    speed: 0.018,
    shader: 5,
  },
  {
    kind: "lanternfish",
    count: 12,
    enter: [310, 480],
    leave: [1000, 1100],
    scale: 0.16,
    speed: 0.16,
    shader: 6,
  },
];

export function habitatVisibility(kind: MarineKind, depth: number) {
  const habitat = MARINE_HABITATS.find((item) => item.kind === kind)!;
  return (
    smoothstep(...habitat.enter, depth) *
    (1 - smoothstep(...habitat.leave, depth))
  );
}

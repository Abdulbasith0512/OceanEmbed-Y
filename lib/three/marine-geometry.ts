import { BufferGeometry, Color, Float32BufferAttribute } from "three";

export type MarineKind =
  | "fish"
  | "ray"
  | "turtle"
  | "jelly"
  | "squid"
  | "lanternfish"
  | "siphonophore";
type Vec = [number, number, number];
type Sample = (u: number, v: number) => Vec;

/** Small, merged organic meshes: fins, eyes and tentacles share each animal's draw call. */
class OrganicMesh {
  positions: number[] = [];
  colors: number[] = [];
  motion: number[] = [];
  glow: number[] = [];
  indices: number[] = [];

  vertex(point: Vec, color: Color, part: number, emission: number) {
    this.positions.push(...point);
    this.colors.push(color.r, color.g, color.b);
    this.motion.push(part);
    this.glow.push(emission);
  }

  surface(
    segments: number,
    rings: number,
    sample: Sample,
    color: string | ((u: number, v: number) => Color),
    part = 0,
    emission = 0,
  ) {
    const offset = this.positions.length / 3;
    const solidColor = typeof color === "string" ? new Color(color) : null;
    for (let v = 0; v <= rings; v++)
      for (let u = 0; u <= segments; u++) {
        this.vertex(
          sample(u / segments, v / rings),
          solidColor ??
            (color as (u: number, v: number) => Color)(u / segments, v / rings),
          part,
          emission,
        );
      }
    for (let v = 0; v < rings; v++)
      for (let u = 0; u < segments; u++) {
        const a = offset + v * (segments + 1) + u,
          b = a + segments + 1;
        this.indices.push(a, b, a + 1, b, b + 1, a + 1);
      }
  }

  ellipsoid(
    center: Vec,
    radius: Vec,
    color: string,
    part = 0,
    emission = 0,
    segments = 16,
  ) {
    this.surface(
      segments,
      10,
      (u, v) => {
        const phi = u * Math.PI * 2,
          theta = v * Math.PI;
        return [
          center[0] + radius[0] * Math.cos(phi) * Math.sin(theta),
          center[1] + radius[1] * Math.cos(theta),
          center[2] + radius[2] * Math.sin(phi) * Math.sin(theta),
        ];
      },
      color,
      part,
      emission,
    );
  }

  fin(vertices: Vec[], color: string, part = 1) {
    const offset = this.positions.length / 3;
    const tint = new Color(color);
    vertices.forEach((v) => this.vertex(v, tint, part, 0));
    for (let i = 1; i < vertices.length - 1; i++)
      this.indices.push(offset, offset + i, offset + i + 1);
  }

  tube(
    path: (t: number) => Vec,
    radius: (t: number) => number,
    color: string,
    part = 2,
    emission = 0,
    segments = 24,
  ) {
    this.surface(
      7,
      segments,
      (u, t) => {
        const p = path(t),
          next = path(Math.min(1, t + 0.001)),
          prev = path(Math.max(0, t - 0.001));
        const dx = next[0] - prev[0],
          dy = next[1] - prev[1];
        const length = Math.hypot(dx, dy) || 1;
        const a = u * Math.PI * 2,
          r = radius(t);
        return [
          p[0] - (dy / length) * Math.cos(a) * r,
          p[1] + (dx / length) * Math.cos(a) * r,
          p[2] + Math.sin(a) * r,
        ];
      },
      color,
      part,
      emission,
    );
  }

  finish() {
    const geometry = new BufferGeometry();
    geometry.setAttribute(
      "position",
      new Float32BufferAttribute(this.positions, 3),
    );
    geometry.setAttribute("color", new Float32BufferAttribute(this.colors, 3));
    geometry.setAttribute("aPart", new Float32BufferAttribute(this.motion, 1));
    geometry.setAttribute("aGlow", new Float32BufferAttribute(this.glow, 1));
    geometry.setIndex(this.indices);
    geometry.computeVertexNormals();
    geometry.computeBoundingSphere();
    return geometry;
  }
}

function fish(deep: boolean) {
  const mesh = new OrganicMesh();
  const dorsal = new Color(deep ? "#314d5e" : "#396b7c"),
    belly = new Color(deep ? "#91a6af" : "#c4d6cf");
  mesh.surface(
    32,
    20,
    (u, v) => {
      const x = -1 + u * 1.95,
        a = v * Math.PI * 2;
      const r = Math.pow(Math.sin(Math.PI * u), 0.85) * (0.78 + u * 0.4);
      return [
        x,
        Math.cos(a) * r * (deep ? 0.29 : 0.34),
        Math.sin(a) * r * 0.21,
      ];
    },
    (_, v) => dorsal.clone().lerp(belly, (1 - Math.cos(v * Math.PI * 2)) * 0.5),
  );
  mesh.fin(
    [
      [-0.95, 0, 0],
      [-1.58, 0.58, 0],
      [-1.38, 0.05, 0],
      [-1.38, -0.05, 0],
      [-1.58, -0.58, 0],
    ],
    "#7196a0",
  );
  mesh.fin(
    [
      [-0.55, 0.23, 0],
      [-0.33, 0.65, 0],
      [0.28, 0.3, 0],
    ],
    "#567d8c",
  );
  mesh.fin(
    [
      [-0.52, -0.2, 0],
      [-0.47, -0.47, 0],
      [0.08, -0.3, 0],
    ],
    "#97b4b8",
  );
  for (const side of [-1, 1]) {
    mesh.fin(
      [
        [0.3, 0, side * 0.17],
        [-0.25, -0.28, side * 0.47],
        [-0.03, -0.04, side * 0.2],
      ],
      "#87a7ae",
    );
    mesh.ellipsoid(
      [0.64, 0.075, side * 0.162],
      [0.087, 0.087, 0.028],
      "#acc1b9",
    );
    mesh.ellipsoid(
      [0.654, 0.075, side * 0.183],
      [deep ? 0.068 : 0.049, deep ? 0.068 : 0.049, 0.016],
      "#06101a",
    );
    mesh.ellipsoid(
      [0.67, 0.095, side * 0.198],
      [0.016, 0.016, 0.005],
      "#d3e9e3",
      0,
      0.3,
    );
    mesh.tube(
      (t) => [
        0.39 - Math.sin(t * Math.PI) * 0.07,
        0.22 - t * 0.4,
        side * (0.15 + Math.sin(t * Math.PI) * 0.059),
      ],
      () => 0.008,
      "#24434e",
      0,
      0,
      12,
    );
    if (deep)
      for (let i = 0; i < 8; i++)
        mesh.ellipsoid(
          [
            -0.66 + i * 0.14,
            -0.16 - Math.sin((i / 8) * Math.PI) * 0.06,
            side * 0.14,
          ],
          [0.026, 0.018, 0.013],
          "#9ce8e0",
          0,
          1,
          8,
        );
  }
  return mesh.finish();
}

function ray() {
  const mesh = new OrganicMesh();
  mesh.surface(
    24,
    32,
    (u, v) => {
      const z = (v - 0.5) * 3.7,
        wing = Math.pow(1 - Math.abs(z) / 1.85, 0.68);
      return [
        (-0.7 + u * 1.6) * wing - Math.abs(z) * 0.13,
        Math.sin(u * Math.PI) * wing * 0.19,
        z,
      ];
    },
    (u, v) =>
      new Color("#395e68").lerp(
        new Color("#77969a"),
        Math.sin(u * Math.PI) * (1 - Math.abs(v - 0.5)) * 0.45,
      ),
    1,
  );
  mesh.ellipsoid([0.1, 0.04, 0], [0.72, 0.17, 0.31], "#4b737b");
  mesh.tube(
    (t) => [
      -0.52 - t * 2.5,
      -0.02 + Math.sin(t * 3) * 0.04,
      Math.sin(t * 4) * 0.1,
    ],
    (t) => 0.035 * (1 - t) + 0.003,
    "#385765",
  );
  for (const side of [-1, 1])
    mesh.ellipsoid([0.53, 0.19, side * 0.17], [0.075, 0.036, 0.045], "#0a1b25");
  return mesh.finish();
}

function turtle() {
  const mesh = new OrganicMesh();
  mesh.ellipsoid([0, 0, 0], [0.79, 0.27, 0.55], "#5a7767");
  mesh.ellipsoid([-0.02, 0.11, 0], [0.74, 0.27, 0.52], "#425e4f");
  mesh.ellipsoid([0.75, 0.01, 0], [0.27, 0.13, 0.16], "#8a9b7b");
  mesh.ellipsoid([1.02, 0.04, 0], [0.25, 0.18, 0.22], "#84967a");
  for (const side of [-1, 1]) {
    mesh.ellipsoid([1.13, 0.11, side * 0.17], [0.035, 0.036, 0.015], "#111e20");
    mesh.fin(
      [
        [0.47, 0, side * 0.3],
        [0.1, -0.04, side * 0.92],
        [-0.44, -0.16, side * 1.4],
        [-0.25, -0.2, side * 0.67],
        [0.08, -0.09, side * 0.43],
      ],
      "#7e977d",
    );
    mesh.fin(
      [
        [-0.48, -0.07, side * 0.3],
        [-1.05, -0.11, side * 0.7],
        [-0.98, -0.15, side * 0.32],
        [-0.6, -0.1, side * 0.19],
      ],
      "#79917b",
    );
    for (let i = 0; i < 4; i++)
      mesh.tube(
        (t) => [
          -0.53 + i * 0.31 + Math.sin(t * Math.PI) * 0.055,
          0.16 + Math.sin(t * Math.PI) * 0.19,
          side * t * 0.45,
        ],
        () => 0.009,
        "#9ba780",
        0,
        0,
        12,
      );
  }
  mesh.fin(
    [
      [-0.64, -0.02, -0.06],
      [-1.03, -0.01, 0],
      [-0.64, -0.02, 0.06],
    ],
    "#84967a",
    0,
  );
  return mesh.finish();
}

function jelly() {
  const mesh = new OrganicMesh();
  mesh.surface(
    40,
    20,
    (u, v) => {
      const phi = u * Math.PI * 2,
        theta = v * Math.PI * 0.57;
      const r =
        Math.sin(theta) * (0.52 + Math.pow(v, 5) * Math.cos(phi * 16) * 0.024);
      return [Math.cos(phi) * r, Math.cos(theta) * 0.47, Math.sin(phi) * r];
    },
    (_, v) => new Color("#93cbd0").lerp(new Color("#638fa4"), v * 0.65),
    0,
    0.12,
  );
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2;
    mesh.ellipsoid(
      [Math.cos(a) * 0.11, 0.15, Math.sin(a) * 0.11],
      [0.09, 0.075, 0.09],
      "#c7a29f",
      0,
      0.28,
    );
  }
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    const length = 1.35 + Math.sin(i * 2.7) * 0.4;
    mesh.tube(
      (t) => [
        Math.cos(a) * (0.49 + t * 0.06) + Math.sin(t * 7 + i) * t * 0.07,
        -0.09 - t * length,
        Math.sin(a) * 0.49 + Math.cos(t * 5 + i) * t * 0.07,
      ],
      (t) => 0.012 * (1 - t * 0.7),
      "#9bbfcb",
      2,
      0.2,
    );
  }
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2;
    mesh.tube(
      (t) => [
        Math.cos(a) * 0.12 + Math.sin(t * 6 + i) * t * 0.13,
        0.02 - t * 1.05,
        Math.sin(a) * 0.12,
      ],
      (t) => 0.045 * (1 - t) + 0.005,
      "#a7bbc7",
      2,
      0.1,
    );
  }
  return mesh.finish();
}

function squid() {
  const mesh = new OrganicMesh();
  mesh.surface(
    30,
    20,
    (u, v) => {
      const a = v * Math.PI * 2,
        r = Math.pow(Math.sin(u * Math.PI), 0.65) * 0.27;
      return [-0.75 + u * 1.95, Math.cos(a) * r, Math.sin(a) * r];
    },
    "#ad7b7c",
  );
  for (const side of [-1, 1]) {
    mesh.fin(
      [
        [0.12, 0, side * 0.21],
        [0.73, 0, side * 0.64],
        [1.14, 0, side * 0.06],
      ],
      "#bb9395",
    );
    mesh.ellipsoid([-0.61, 0.03, side * 0.23], [0.13, 0.13, 0.065], "#b4bdc5");
    mesh.ellipsoid(
      [-0.63, 0.04, side * 0.285],
      [0.075, 0.085, 0.018],
      "#051724",
    );
  }
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2,
      length = i < 2 ? 1.75 : 1.08;
    mesh.tube(
      (t) => [
        -0.74 - t * length,
        Math.cos(a) * (0.16 + t * 0.2) + Math.sin(t * 4 + i) * t * 0.1,
        Math.sin(a) * (0.16 + t * 0.22),
      ],
      (t) => 0.04 * (1 - t) + 0.006,
      "#b895a0",
      2,
      0.04,
    );
  }
  return mesh.finish();
}

function siphonophore() {
  const mesh = new OrganicMesh();
  mesh.tube(
    (t) => [Math.sin(t * 5) * 0.18, 1.7 - t * 3.4, Math.cos(t * 3) * 0.06],
    () => 0.014,
    "#87c6cb",
    2,
    0.65,
    40,
  );
  for (let i = 0; i < 19; i++) {
    const t = i / 19,
      y = 1.6 - t * 3.1,
      side = i % 2 ? -1 : 1;
    const x = Math.sin(t * 5) * 0.18;
    mesh.ellipsoid(
      [x + side * 0.09, y, 0],
      [0.09, 0.13, 0.095],
      i < 7 ? "#9fd2d6" : "#bcaaa8",
      2,
      i < 7 ? 0.65 : 0.3,
      10,
    );
    if (i > 5)
      mesh.tube(
        (s) => [
          x + side * (0.08 + s * 0.38) + Math.sin(s * 6 + i) * s * 0.13,
          y - s * 0.6,
          Math.sin(s * 3 + i) * s * 0.09,
        ],
        (s) => 0.008 * (1 - s * 0.65),
        "#7db2bd",
        2,
        0.3,
        14,
      );
  }
  return mesh.finish();
}

export function createMarineGeometry(kind: MarineKind) {
  switch (kind) {
    case "fish":
      return fish(false);
    case "lanternfish":
      return fish(true);
    case "ray":
      return ray();
    case "turtle":
      return turtle();
    case "jelly":
      return jelly();
    case "squid":
      return squid();
    case "siphonophore":
      return siphonophore();
  }
}

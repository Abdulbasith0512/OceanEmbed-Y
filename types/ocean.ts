export const DEPTHS = [
  0, 5, 10, 20, 30, 50, 75, 100, 125, 150, 200, 300, 500, 700, 1000,
] as const;
export type Depth = (typeof DEPTHS)[number];
export type DataLayer = "temperature" | "observability" | "uncertainty";
export type OceanLocation = { lat: number; lon: number };

export type ReconstructionPoint = OceanLocation & {
  temperature: number;
  observability: number;
  uncertainty: number;
};

export type ReconstructionQuery = { date: string; depth: Depth };
export type ReconstructionResponse = ReconstructionQuery & {
  points: ReconstructionPoint[];
  source: "mock" | "api";
  resolution: number;
};

export type ProfilePoint = ReconstructionPoint & { depth: Depth };
export type ProfileResponse = OceanLocation & {
  date: string;
  source: "mock" | "api";
  points: ProfilePoint[];
};

export interface OceanService {
  getReconstruction(
    query: ReconstructionQuery,
    signal?: AbortSignal,
  ): Promise<ReconstructionResponse>;
  getProfile(
    query: OceanLocation & { date: string },
    signal?: AbortSignal,
  ): Promise<ProfileResponse>;
}

export type LandGeometry = {
  type: "MultiPolygon";
  coordinates: number[][][][];
};

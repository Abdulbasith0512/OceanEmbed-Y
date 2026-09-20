# Backend API Integration Specification

This document details the interface contracts required to swap the synthetic mock data provider with a live model inference / data backend.

## Expected Interfaces

All backend communication flows through `lib/api/ocean-service.ts`.

### 1. Reconstruction Data Query

```typescript
fetchReconstruction(params: {
  date: string;
  depth: number;
  layer: FieldLayer;
  signal?: AbortSignal;
}): Promise<ReconstructionResponse>
```

### 2. Vertical Profile Query

```typescript
fetchProfile(params: {
  lat: number;
  lon: number;
  date: string;
  signal?: AbortSignal;
}): Promise<ProfileResponse>
```

## Depth Levels

The interface expects data matching 15 specific depth levels: `0, 5, 10, 20, 30, 50, 75, 100, 125, 150, 200, 300, 500, 700, 1000 m`.

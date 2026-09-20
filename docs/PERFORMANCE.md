# WebGL & R3F Performance Optimization Notes

To maintain 60 FPS performance during complex 3D scroll expeditions across various hardware configurations, OceanEmbed-X implements several optimization strategies:

## 1. Instanced Rendering
- All schooling marine life (fish, rays, jellies, squid) use `THREE.InstancedMesh`.
- Single draw calls render hundreds of marine organisms simultaneously.

## 2. GPU Vertex Shader Animation
- Swimming motion and tentacle movement are calculated entirely in custom GLSL vertex shaders, eliminating CPU overhead per frame.

## 3. Dynamic Scene Unloading
- Orbital elements (Earth globe, atmospheric shaders, stars) stop rendering once the underwater expedition reaches deep-water chapters.

## 4. Ref-based Frame Updates
- Camera positions and shader uniforms update via React `useFrame` refs instead of triggering React state re-renders.

## 5. Capped Pixel Ratio
- WebGL renderer device pixel ratio is capped at `Math.min(window.devicePixelRatio, 2)` to prevent excessive rendering loads on High-DPI screens.

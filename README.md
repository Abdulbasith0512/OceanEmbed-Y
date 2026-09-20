# OceanEmbed-X

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-15-black.svg?logo=next.js)
![React](https://img.shields.io/badge/React-19-61DAFB.svg?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6.svg?logo=typescript)
![Three.js](https://img.shields.io/badge/Three.js-R3F-black.svg?logo=three.js)

A desktop-focused Next.js frontend for the Neutrons SIH26066 proposal: a scroll-driven expedition from orbit to 1000 m, followed by a scientific ocean explorer. This is a frontend demonstration; it contains no backend, authentication, or trained model.

## Table of Contents

- [Run Locally](#run-locally)
- [Architecture](#architecture)
- [Connecting a Backend](#connecting-a-backend)
- [Rendering and Accessibility](#rendering-and-accessibility)
- [Scientific and Asset References](#scientific-and-asset-references)
- [Contributing](#contributing)
- [License](#license)

## Run locally

Use Node.js 22.9 or newer.

```sh
npm ci
npm run dev
```

Open `http://localhost:3000`. For a production preview, run `npm run build` followed by `npm start`.

```sh
npm run typecheck
npm run lint
npm test
npm run build
npm run test:e2e
```

Browser tests start a production server on port 3100. They use installed Google Chrome when available; otherwise install Chromium with `npx playwright install chromium`. Set `CHROME_PATH` to select another Chromium executable. The browser suite uses software WebGL for repeatable rendering; it is not a hardware FPS benchmark. Screenshots and failure traces are written to `test-results/`.

## Architecture

- `app/`: App Router pages, metadata, fonts, and styles. `/` is the expedition; `/explore` is the data interface.
- `components/experience/`: lazy-loaded React Three Fiber canvas, Earth and satellite, surface/underwater shaders, and instanced marine populations.
- `lib/animation/journey.ts`: chapter landing points, scene boundaries, continuous depth calculation, and depth labels.
- `lib/hooks/use-expedition-scroll.ts`: GSAP ScrollTrigger lifecycle, DOM narrative updates, scroll restoration, and resizing.
- `lib/three/`: merged procedural animal geometry, GPU animation, and overlapping artistic encounter ranges.
- `components/explore/`: canvas ocean map, date/depth/layer controls, custom SVG vertical profiles, and CSV export.
- `lib/api/ocean-service.ts`: replaceable asynchronous data-service boundary, including cancellation.
- `lib/mock/ocean-data.ts`: deterministic synthetic fields, input validation, and matching profile samples.
- `types/ocean.ts`: public frontend interfaces and the proposal's 15 depth queries.

The main dependencies are Next.js, React, TypeScript, Three.js, React Three Fiber, Drei, GSAP, and Tailwind CSS. Fonts and geographic assets are served locally.

## Connecting a backend

Replace the two `oceanService` methods in `lib/api/ocean-service.ts` with calls to the backend's reconstruction and profile endpoints. Keep the `OceanService`, `ReconstructionResponse`, and `ProfileResponse` interfaces, pass the supplied `AbortSignal` to `fetch`, and reject unsuccessful responses. Map backend fields into these types within the service rather than changing visual components.

The current grid is 0.25°, with depth levels `0, 5, 10, 20, 30, 50, 75, 100, 125, 150, 200, 300, 500, 700, 1000 m`. Fields and profiles provide reconstructed temperature, observability index, and predictive uncertainty. Mock data are explicitly labeled in the UI and in downloads. The date selector changes synthetic values; it does not retrieve satellite observations.

## Rendering and accessibility

The scene uses one pinned viewport and one normalized scroll value. Camera and shader updates use refs instead of React state each frame. The orbital globe and stars stop rendering before the underwater view; the CSS Earth exists only as a loading/non-WebGL fallback. The water transition becomes fully opaque before the globe is removed.

Each marine population is one instanced mesh with merged bodies, fins, eyes, and tentacles. Animation runs in vertex shaders. Models are procedural illustrations, not photogrammetry or species-level biological reconstructions. Encounter ranges overlap and should not be interpreted as species distribution data. Shallow scenes include schooling fish, rays, and a turtle; deeper scenes introduce jellies, squid, lanternfish forms, and siphonophore colonies. The final 1000 m reveal deliberately becomes quiet and dark.

Pixel ratio is capped, quality can regress under sustained load, expensive postprocessing and shadows are avoided, and rendering pauses when the document is hidden. WebGL loss restores the fallback. Reduced-motion mode exposes the full narrative without the animated canvas. Interactive controls are keyboard accessible. Desktop/laptop layouts, including short browser windows, are the primary acceptance target.

## Scientific and asset references

- `plan.md` and `OceanEmbed-X.pdf` are the project requirements and scientific source of truth. A browser-readable copy of the proposal is available at `/OceanEmbed-X.pdf`.
- [NOAA: How far does light travel in the ocean?](https://oceanservice.noaa.gov/facts/light_travel.html) informs the sunlit/twilight framing.
- [NOAA Ocean Exploration: Bioluminescence](https://oceanexplorer.noaa.gov/ocean-fact/bioluminescence/) informs the restrained deep-water light effects.
- [MBARI: Animals of the Deep](https://www.mbari.org/education/animals-of-the-deep/), [deep-sea squid](https://www.mbari.org/animal/deep-sea-squid/), and [red siphonophores](https://www.mbari.org/animal/red-siphonophore/) inform the general animal forms. These references do not establish exact species occurrence at the illustrated North Indian Ocean locations.
- Earth texture: [Three.js example texture](https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg), stored as `public/textures/earth.jpg` (2048 px, approximately 500 KB).
- Coastlines: Natural Earth 1:110m public-domain geography, distributed through `world-atlas`. `node scripts/prepare-geography.mjs` regenerates the checked-in geometry.

Higher-fidelity animal models can replace the procedural geometry without changing scroll or habitat logic. Prefer compressed GLB assets below roughly 15,000 triangles per animal and 1024 px textures; keep shared materials and instancing for schools. No additional asset downloads are required to run the current experience.

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidelines, [CODE_OF_CONDUCT.md](.github/CODE_OF_CONDUCT.md) for community standards, and [SECURITY.md](SECURITY.md) for security policy.

## License

Distributed under the MIT License. See [LICENSE](LICENSE) for details.

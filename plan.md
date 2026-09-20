You are the lead frontend/graphics engineer for a high-end scientific visualization project.

You have 10+ years of expert-level experience with:
- Next.js
- React
- TypeScript
- Three.js
- React Three Fiber
- GSAP
- WebGL
- GLSL shaders
- high-performance browser animation
- interactive scientific visualization
- production-grade frontend architecture

You work at the quality level expected from a top-tier product engineering team.

Your task is to build the complete frontend for a project called:

OCEANEMBED-X

PROJECT CONTEXT

OceanEmbed-X is a scientific deep-learning project that reconstructs subsurface ocean temperature from satellite surface observations.

The core problem:
Satellites can continuously observe the ocean surface, but subsurface ocean temperatures are much harder to observe directly. The system uses surface observations to reconstruct temperatures at multiple ocean depths and also estimates observability and predictive uncertainty.

The frontend must communicate this idea visually.

IMPORTANT SCOPE

You are responsible ONLY for the frontend.

Do NOT build:
- backend
- database
- authentication
- ML model
- API server

Backend development is handled by another team.

For now, create a mock data/service layer with clean TypeScript interfaces so that real backend APIs can be connected later with minimal changes.

PRIMARY GOAL

Build an exceptionally polished, cinematic, immersive, scroll-driven Next.js frontend that feels like an interactive scientific documentary rather than a normal website.

This must NOT look like:
- a generic SaaS landing page
- a dashboard template
- a portfolio site
- a basic hero + feature cards + footer website
- a typical hackathon frontend

The experience should feel premium, futuristic, scientific, cinematic, elegant and technically impressive.

The website should tell the scientific story through motion.

MAIN USER JOURNEY

The page should behave like a continuous cinematic journey controlled mainly by scrolling.

The conceptual sequence is:

SPACE
→ SATELLITE
→ EARTH
→ NORTH INDIAN OCEAN
→ OCEAN SURFACE
→ UNDERWATER DESCENT
→ DEEP OCEAN
→ SCIENTIFIC PROBLEM
→ OCEANEMBED-X REVEAL
→ INTERACTIVE SCIENTIFIC EXPLORATION

Implement this as a smooth scroll-controlled experience.

SCENE 1 — SPACE

Start in deep space.

Requirements:
- dark cinematic background
- high-quality procedural star field
- subtle atmospheric particles
- realistic but performant Earth
- satellite orbiting Earth
- subtle camera drift even when the user is not scrolling
- professional typography
- minimal UI
- no clutter

The first impression must be visually strong.

As the user scrolls:
- camera gradually approaches Earth
- satellite passes through the frame naturally
- Earth becomes dominant
- atmospheric glow becomes stronger

Do not make animations cartoonish.

SCENE 2 — EARTH APPROACH

The camera approaches Earth.

Requirements:
- atmospheric scattering/glow
- physically believable lighting
- smooth camera transitions
- target the Indian Ocean region
- visually guide attention toward the North Indian Ocean

As scrolling progresses:
- move closer to Earth
- orient camera toward the Indian subcontinent / North Indian Ocean
- subtly highlight the target ocean region

Show very minimal scientific labels such as:
"North Indian Ocean"

Avoid excessive text.

SCENE 3 — OCEAN SURFACE

Transition seamlessly from Earth toward the ocean surface.

The user should feel like the camera is flying into the ocean.

At or near the surface, introduce the satellite-observed variables:

SST — Sea Surface Temperature
SSS — Sea Surface Salinity
SLA — Sea Level Anomaly
Ocean Currents
Surface Winds

These should appear visually around the environment using refined motion graphics, labels, flowing vector fields, particles, overlays or subtle HUD elements.

Do NOT make them look like cards.

The visual message should be:

"Satellites reveal the surface."

SCENE 4 — UNDERWATER DESCENT

This is one of the most important parts.

As the user continues scrolling, the camera should descend underwater.

Show an always-visible but elegant depth indicator:

0 m
50 m
100 m
200 m
300 m
500 m
700 m
1000 m

Do not make the depth changes abrupt.

The environment should evolve with depth.

At shallow depth:
- sunlight penetration
- caustics
- visible particles
- moderate amount of marine life
- lighter blue water

At medium depth:
- reduced light
- increased fog
- fewer visible fish
- more subdued environment

At greater depths:
- almost complete darkness
- low visibility
- subtle suspended particles
- bioluminescent organisms/particles
- occasional silhouettes
- strong cinematic atmosphere

Fish should move naturally and subtly.
Do not turn this into an aquarium simulation.

Prefer performant techniques:
- instanced meshes
- flocking approximation
- shader-based animation
- lightweight GLB models only where necessary

SCIENTIFIC STORY DURING DESCENT

Use carefully timed typography while descending.

Examples of appropriate scientific narrative:

"Sunlight fades."

"Surface observations reveal less about deeper layers."

"The deeper ocean becomes increasingly difficult to observe."

"Satellites cannot directly measure the temperature here."

"How much can the surface truly tell us about the ocean below?"

Avoid scientifically incorrect claims such as implying all deep water is literally freezing.

Text should appear and disappear elegantly based on scroll position.

Use minimal copy.

SCENE 5 — DEEP OCEAN / REVEAL

At approximately 1000 m:
- environment becomes extremely dark
- almost all visual elements disappear
- pause the visual motion slightly
- create a strong cinematic moment

Display something like:

"Satellites can see the surface."

then:

"But what lies beneath?"

Then slowly reveal:

OCEANEMBED-X

Subtitle:
"Reconstructing the unseen ocean."

Create a premium reveal using:
- particles
- volumetric-looking lighting
- subtle glow
- depth fog
- shader effects
- elegant typography

Avoid cheesy neon effects.

SCENE 6 — TRANSITION INTO SCIENTIFIC VISUALIZATION

Do not end at the logo reveal.

The reveal should transition naturally into the actual scientific product experience.

The deep-ocean environment should transform into a data visualization.

Possible visual transition:
- particles align into a grid
- grid becomes an ocean field
- color field emerges
- scientific controls fade in

Create a separate exploration section or route:

/explore

The homepage should be cinematic.
The explore experience should be interactive and data-driven.

EXPLORE EXPERIENCE

Build a full-screen scientific exploration interface.

Do NOT make it look like an admin dashboard.

The main visualization should dominate the screen.

Core functionality:

1. North Indian Ocean visualization
2. Depth selector
3. Date selector
4. Layer switcher:
   - Temperature
   - Observability
   - Uncertainty
5. Clickable/selectable ocean locations
6. Vertical profile visualization
7. Smooth animation between depth levels
8. Smooth animation when switching data layers

The system conceptually outputs:

Temperature:
T(z)

Observability:
O(z)

Predictive uncertainty:
σ(z)

For now use realistic mock data.

MOCK DATA ARCHITECTURE

Create clean frontend interfaces such as:

type ReconstructionPoint = {
  lat: number
  lon: number
  temperature: number
  observability: number
  uncertainty: number
}

type ReconstructionResponse = {
  date: string
  depth: number
  points: ReconstructionPoint[]
}

Build a frontend service abstraction.

Example:

getReconstruction({
  date,
  depth
})

Currently this should load mock data.

Later it must be possible to replace the implementation with:

fetch(`${API_URL}/reconstruction?...`)

without rewriting UI components.

Create mock data files or procedurally generate deterministic scientific-looking values.

INTERACTIVE OCEAN MAP

When the user selects a location, display a vertical temperature profile.

Example depths:

0
50
100
200
300
500
700
1000 m

Show:
- temperature profile
- observability by depth
- uncertainty by depth

Visualize these elegantly.

Avoid generic chart-library styling.

You may use lightweight charting where appropriate, but customize visuals heavily.

TECH STACK

Use:

- latest stable Next.js
- App Router
- TypeScript
- React
- Tailwind CSS
- Three.js
- React Three Fiber
- @react-three/drei
- GSAP
- GSAP ScrollTrigger
- Framer Motion only where useful
- @react-three/postprocessing where justified

Use custom GLSL shaders where they provide meaningful visual improvements.

Do not overuse external dependencies.

ARCHITECTURE

Use a clean scalable structure.

Suggested direction:

app/
  page.tsx
  explore/
    page.tsx

components/
  experience/
    ExperienceCanvas.tsx
    SpaceScene.tsx
    EarthScene.tsx
    Satellite.tsx
    OceanSurface.tsx
    OceanDive.tsx
    DepthEnvironment.tsx
    FishSystem.tsx
    StarField.tsx
    CinematicText.tsx

  explore/
    OceanExplorer.tsx
    OceanField.tsx
    DepthControl.tsx
    LayerControl.tsx
    DateControl.tsx
    VerticalProfile.tsx
    LocationDetails.tsx

  ui/

lib/
  api/
  mock/
  math/
  animation/
  three/

types/

Feel free to improve this architecture.

ENGINEERING REQUIREMENTS

Treat this as production-grade code.

Requirements:
- strict TypeScript
- clean component boundaries
- reusable abstractions
- no giant 1500-line components
- no unnecessary prop drilling
- avoid global state unless genuinely useful
- no duplicated animation logic
- separate rendering, data and interaction logic
- use hooks where appropriate
- preserve server/client component boundaries correctly
- no hydration issues
- no memory leaks
- dispose Three.js resources correctly
- avoid unnecessary React re-renders
- avoid state updates every animation frame
- use refs for animation values where appropriate

PERFORMANCE REQUIREMENTS

Performance is critical.

Target smooth 60 FPS on normal modern laptops.

Implement:

- dynamic imports for heavy 3D code
- client-only WebGL where necessary
- lazy loading
- Suspense
- instanced meshes
- compressed textures where possible
- optimized geometry
- reasonable DPR limits
- adaptive quality
- device capability detection where useful
- mobile fallback
- reduced effects on lower-end devices
- prefers-reduced-motion support
- avoid huge texture files
- avoid excessive post-processing
- avoid expensive shadows unless justified

Never use thousands of independent React mesh components.

Use instancing or GPU techniques.

SCROLL ARCHITECTURE

Do NOT treat the experience as normal stacked sections.

Use a pinned cinematic viewport controlled by a scroll timeline.

The conceptual timeline:

0–10%
Space

10–25%
Satellite + Earth approach

25–40%
North Indian Ocean approach

40–50%
Ocean surface

50–80%
Underwater descent

80–90%
Deep ocean / darkness

90–100%
OceanEmbed-X reveal and transition

Use GSAP ScrollTrigger or an equivalent robust architecture.

Do not update React state on every scroll pixel.

Animate Three.js camera/object refs directly.

VISUAL DESIGN

Design direction:

- cinematic
- scientific
- minimal
- modern
- dark
- immersive
- sophisticated
- premium

Typography should feel editorial/scientific.

Avoid:
- excessive rounded cards
- glassmorphism everywhere
- purple-blue SaaS gradients
- giant glowing buttons
- random neon borders
- excessive blur
- template-looking components
- generic stock graphics

Use whitespace and typography carefully.

ANIMATION PRINCIPLES

Animations must:
- communicate meaning
- feel physically believable
- use proper easing
- have intentional timing
- avoid unnecessary movement

Scrolling should feel smooth and controlled.

Camera transitions are more important than decorative UI animation.

ACCESSIBILITY

Implement:
- keyboard-accessible controls
- semantic HTML
- ARIA labels where appropriate
- readable contrast
- reduced-motion fallback
- usable non-WebGL fallback if WebGL is unavailable

RESPONSIVENESS

Primary target:
desktop/laptop hackathon presentation.

Still support:
- tablets
- mobile

Mobile should use a simplified but still high-quality experience rather than trying to render the full desktop scene at maximum complexity.

ASSETS

Do not assume Blender is available.

First prefer:
- procedural geometry
- shaders
- CSS/SVG
- lightweight public-domain/free 3D assets if absolutely necessary

Create placeholder/procedural versions when external assets are unavailable.

Keep all asset integration modular so higher-quality GLB models or textures can be dropped in later.

If an external asset is required, document:
- exact asset needed
- recommended format
- expected path
- approximate polygon/texture limits

Do not block implementation because an asset is missing.

IMPLEMENTATION STRATEGY

You are operating inside an empty project folder.

Start by inspecting the directory.

If no Next.js project exists, initialize one properly.

Then proceed autonomously.

Do not ask me for confirmation for normal implementation decisions.

Make sensible senior-engineering decisions yourself.

Work incrementally.

Recommended order:

Phase 1
- initialize Next.js
- install dependencies
- establish project architecture
- configure styling
- verify app runs

Phase 2
- build WebGL canvas
- space scene
- Earth
- satellite
- star field

Phase 3
- implement GSAP scroll timeline
- Earth approach
- ocean transition

Phase 4
- underwater scene
- depth system
- lighting/fog changes
- fish/particles
- scientific storytelling text

Phase 5
- OceanEmbed-X reveal
- transition into data visualization

Phase 6
- build /explore
- mock scientific data
- depth/layer interaction
- profiles

Phase 7
- responsive behavior
- fallback behavior
- performance optimization
- polish

Phase 8
- test production build
- fix TypeScript/lint/runtime issues
- remove warnings
- final visual polish

IMPORTANT AUTONOMY RULE

Do not stop after generating a scaffold.

Actually implement the application.

After each major phase:
- run the project/build
- identify errors
- fix them
- continue

Use commands when needed.

You have permission to:
- initialize the project
- install packages
- create files
- modify files
- delete unnecessary generated files
- run lint
- run type checks
- run builds

Do not wait for me after every step.

QUALITY BAR

Before considering the task complete, verify:

1. npm run build succeeds
2. TypeScript has no errors
3. no obvious console errors
4. no broken routes
5. scrolling works smoothly
6. major WebGL resources are cleaned up
7. desktop presentation looks polished
8. mobile fallback is usable
9. explore page works with mock data
10. architecture is ready for backend API integration

FINAL DELIVERABLE

When finished, provide a concise report containing:

- what you implemented
- project architecture
- major dependencies
- how to run it
- where mock API logic lives
- where real backend API integration should replace it
- any external assets still worth improving
- performance decisions made
- known limitations

Do not give me lengthy theoretical explanations before implementation.

Inspect the folder and begin building immediately.

A project proposal PDF is available at:

docs/OceanEmbed-X.pdf

Read it before implementation.

Use it as the source of truth for the project's scientific terminology, intended outputs, target depths, problem framing and OceanEmbed-X/DOAR concepts.

Do not invent scientific claims that contradict the proposal.
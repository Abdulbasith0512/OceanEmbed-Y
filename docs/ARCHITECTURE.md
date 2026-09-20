# Technical Architecture Overview

OceanEmbed-X is built with Next.js 15 App Router, React 19, Three.js, React Three Fiber (R3F), and GSAP ScrollTrigger.

## System Design

```
+-------------------------------------------------------------+
|                      User Browser                           |
+------------------------------+------------------------------+
                               |
       +-----------------------+-----------------------+
       |                                               |
       v                                               v
+---------------+                             +-----------------+
| Orbit to      |                             | Interactive     |
| 1000m Dive    |                             | Ocean Explorer  |
| (Expedition)  |                             | (/explore)      |
+-------+-------+                             +--------+--------+
        |                                              |
        v                                              v
+---------------+                             +-----------------+
| R3F Canvas    |                             | Canvas Map &    |
| & Shaders     |                             | SVG Profiles    |
+---------------+                             +--------+--------+
                                                       |
                                                       v
                                              +-----------------+
                                              | Ocean Service   |
                                              | Boundary        |
                                              +-----------------+
```

## Key Components

1. **`app/`**: Next.js App Router entry points and layout definitions.
2. **`components/experience/`**: R3F components handling camera controls, procedural animal instancing, underwater lighting shaders, and orbital transitions.
3. **`lib/animation/journey.ts`**: Interpolation mechanics for continuous depth calculation and landing chapter triggers.
4. **`lib/hooks/use-expedition-scroll.ts`**: GSAP integration controlling pinned viewport scroll behavior.
5. **`lib/api/ocean-service.ts`**: Decoupled async interface for synthetic or live reconstructed ocean fields.

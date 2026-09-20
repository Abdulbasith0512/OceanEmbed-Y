# Accessibility & Reduced Motion Support

OceanEmbed-X prioritizes web accessibility and fallback behavior for users with different device capabilities and sensory preferences.

## Reduced Motion (`prefers-reduced-motion`)

When users have requested reduced motion in their system settings:
- The continuous 3D WebGL canvas animation is disabled or paused.
- The narrative expedition text chapters remain accessible through standard scrollable HTML document flow.
- Interactive controls and data profile exploration tools remain fully operational.

## Keyboard Accessibility

- All interactive controls on `/explore` (date selector, depth picker, layer toggles, CSV export button) are standard HTML focusable elements with visible focus rings.
- Dynamic dialogs and popups trap focus and support `Escape` key dismissal.

## Screen Reader & Non-WebGL Fallbacks

- Text equivalents are provided for ocean depth observations.
- A 2D CSS fallback visualization renders when WebGL context cannot be created or is lost.

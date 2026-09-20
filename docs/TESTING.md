# Testing Strategy and Guide

OceanEmbed-X employs unit testing (Vitest) and end-to-end browser automation (Playwright) to verify interactive performance, visual rendering, and data export.

## Running Unit Tests

Unit tests validate data transformation logic, calculation helpers, and service boundaries.

```bash
npm test
```

## Running End-to-End (E2E) Browser Tests

Playwright tests run against a built production server to verify real rendering behavior.

```bash
# Run tests headlessly
npm run test:e2e

# Run with UI mode for debugging
npx playwright test --ui
```

## Test Structure

- `tests/journey.test.ts`: Depth scale, continuous calculations, and scroll landing targets.
- `tests/ocean-service.test.ts`: Data fetching interface, profile interpolation, and mock fallback checks.
- `tests/browser/desktop.spec.ts`: E2E canvas initialization, page routing, and control interaction tests.

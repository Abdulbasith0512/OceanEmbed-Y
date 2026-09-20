import assert from "node:assert/strict";
import test from "node:test";
import {
  CHAPTERS,
  chapterAtProgress,
  depthAtProgress,
  INDIAN_OCEAN_YAW,
  nearestEquivalentAngle,
  normalizedScroll,
  panelOpacity,
  shortestAngleDelta,
  targetYawForLon,
} from "../lib/animation/journey";
import {
  habitatVisibility,
  MARINE_HABITATS,
} from "../lib/three/marine-habitats";
import { createMarineGeometry } from "../lib/three/marine-geometry";

test("every chapter lands on a fully readable panel with a matching chapter label", () => {
  CHAPTERS.forEach((chapter, index) => {
    assert.equal(chapterAtProgress(chapter.landing), index);
    assert.equal(panelOpacity(chapter.panel, chapter.landing), 1);
  });
});

test("depth increases continuously, stays bounded, and returns to zero on ascent", () => {
  let previous = 0;
  for (let step = 0; step <= 1000; step++) {
    const depth = depthAtProgress(step / 1000);
    assert.ok(depth >= previous && depth <= 1000);
    assert.ok(depth - previous < 5);
    previous = depth;
  }
  assert.equal(depthAtProgress(0.44), 0);
  assert.equal(depthAtProgress(0.82), 1000);
  assert.equal(depthAtProgress(-2), 0);
  // No dead-zone: depth starts moving right after the ocean crossfade.
  assert.ok(depthAtProgress(0.47) > 0);
  assert.ok(depthAtProgress(0.5) < 120);
});

test("scroll restoration handles boundaries and empty layout ranges", () => {
  assert.equal(normalizedScroll(500, 1000), 0.5);
  assert.equal(normalizedScroll(-100, 1000), 0);
  assert.equal(normalizedScroll(1100, 1000), 1);
  assert.equal(normalizedScroll(10, 0), 0);
});

test("marine encounters overlap smoothly and shallow animals leave before deep scenes", () => {
  assert.ok(habitatVisibility("fish", 50) > 0.99);
  assert.ok(habitatVisibility("turtle", 50) > 0.99);
  assert.equal(habitatVisibility("fish", 500), 0);
  assert.equal(habitatVisibility("turtle", 500), 0);
  assert.ok(habitatVisibility("jelly", 350) > 0.99);
  assert.ok(habitatVisibility("squid", 500) > 0.99);
  assert.ok(habitatVisibility("siphonophore", 900) > 0.99);
  assert.ok(habitatVisibility("lanternfish", 900) > 0.99);
  for (const { kind } of MARINE_HABITATS) {
    let previous = habitatVisibility(kind, 0);
    for (let depth = 1; depth <= 1000; depth++) {
      const visibility = habitatVisibility(kind, depth);
      assert.ok(visibility >= 0 && visibility <= 1);
      assert.ok(Math.abs(visibility - previous) < 0.2);
      previous = visibility;
    }
  }
});

test("earth returns to the Indian Ocean via the shortest arc", () => {
  // Target faces 72E toward +Z; -2.827 rad ≈ 198°.
  assert.ok(Math.abs(INDIAN_OCEAN_YAW - -2.827) < 0.01);
  assert.equal(targetYawForLon(72), INDIAN_OCEAN_YAW);
  // Deltas always take the short way around.
  assert.ok(Math.abs(shortestAngleDelta(0, Math.PI * 1.5) + Math.PI / 2) < 1e-9);
  assert.ok(Math.abs(shortestAngleDelta(0, -Math.PI * 1.5) - Math.PI / 2) < 1e-9);
  for (const current of [-10, -3, 0, 2.5, 10 * Math.PI, -7 * Math.PI]) {
    const desired = nearestEquivalentAngle(current, INDIAN_OCEAN_YAW);
    const pull = shortestAngleDelta(current, desired);
    assert.ok(Math.abs(pull) <= Math.PI + 1e-9);
    // Applying the pull lands exactly on an equivalent of the target.
    const landed = current + pull;
    const roundTrips = Math.round((landed - INDIAN_OCEAN_YAW) / (Math.PI * 2));
    assert.ok(
      Math.abs(landed - (INDIAN_OCEAN_YAW + roundTrips * Math.PI * 2)) < 1e-9,
    );
  }
});

test("all marine geometry has finite normals, valid triangles, and bounded complexity", () => {
  for (const { kind } of MARINE_HABITATS) {
    const geometry = createMarineGeometry(kind);
    const positions = geometry.getAttribute("position"),
      normals = geometry.getAttribute("normal");
    assert.ok(positions.count > 50 && positions.count < 18000, kind);
    assert.equal(positions.count, normals.count);
    assert.ok(Array.from(positions.array).every(Number.isFinite), kind);
    assert.ok(Array.from(normals.array).every(Number.isFinite), kind);
    assert.ok(
      Array.from(geometry.index!.array).every(
        (index) => index < positions.count,
      ),
      kind,
    );
    geometry.dispose();
  }
});

import assert from "node:assert/strict";
import test from "node:test";
import { oceanService } from "../lib/api/ocean-service";
import { DEPTHS } from "../types/ocean";

test("map and vertical profile agree at the same date, depth, and location", async () => {
  const [field, profile] = await Promise.all([
    oceanService.getReconstruction({ date: "2026-08-28", depth: 100 }),
    oceanService.getProfile({ date: "2026-08-28", lat: 12, lon: 72 }),
  ]);
  const point = field.points.find((p) => p.lat === 12 && p.lon === 72)!;
  const profilePoint = profile.points.find((p) => p.depth === 100)!;
  assert.equal(point.temperature, profilePoint.temperature);
  assert.equal(point.observability, profilePoint.observability);
  assert.equal(point.uncertainty, profilePoint.uncertainty);
  assert.deepEqual(
    profile.points.map((p) => p.depth),
    [...DEPTHS],
  );
  assert.equal(field.points.length, 261 * 141);
  assert.equal(field.source, "mock");
});

test("invalid dates and aborted requests cannot produce a stale result", async () => {
  await assert.rejects(
    oceanService.getReconstruction({ date: "2026-02-30", depth: 100 }),
    /valid calendar date/,
  );
  const controller = new AbortController();
  const request = oceanService.getReconstruction(
    { date: "2026-08-28", depth: 100 },
    controller.signal,
  );
  controller.abort();
  await assert.rejects(request, { name: "AbortError" });
});

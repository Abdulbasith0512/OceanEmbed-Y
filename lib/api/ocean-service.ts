import { REGION } from "@/lib/ocean";
import {
  sampleOcean,
  validateDate,
  validateDepth,
  validateLocation,
} from "@/lib/mock/ocean-data";
import {
  DEPTHS,
  type OceanService,
  type ReconstructionPoint,
} from "@/types/ocean";

function delay(signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted)
      return reject(new DOMException("Request aborted", "AbortError"));
    const abort = () => {
      clearTimeout(timer);
      reject(new DOMException("Request aborted", "AbortError"));
    };
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", abort);
      resolve();
    }, 160);
    signal?.addEventListener("abort", abort, { once: true });
  });
}

/** Integration boundary: replace these methods with your backend's fetch calls.
 * Preserve AbortSignal support and the response interfaces; no component changes needed.
 * Land is masked in the renderer and excluded from interactive selection.
 */
export const oceanService: OceanService = {
  async getReconstruction({ date, depth }, signal) {
    validateDate(date);
    validateDepth(depth);
    await delay(signal);
    const points: ReconstructionPoint[] = [];
    for (let lat = REGION.south; lat <= REGION.north; lat += 0.25) {
      for (let lon = REGION.west; lon <= REGION.east; lon += 0.25) {
        points.push(sampleOcean(lat, lon, depth, date));
      }
    }
    signal?.throwIfAborted();
    return { date, depth, points, source: "mock", resolution: 0.25 };
  },
  async getProfile({ lat, lon, date }, signal) {
    validateDate(date);
    validateLocation({ lat, lon });
    await delay(signal);
    return {
      lat,
      lon,
      date,
      source: "mock",
      points: DEPTHS.map((depth) => ({
        ...sampleOcean(lat, lon, depth, date),
        depth,
      })),
    };
  },
};

import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { feature } from "topojson-client";

// Natural Earth 1:110m public-domain land. Kept locally for offline presentation.
const topology = JSON.parse(
  readFileSync(
    new URL("../node_modules/world-atlas/land-110m.json", import.meta.url),
    "utf8",
  ),
);
const land = feature(topology, topology.objects.land).features[0].geometry;
mkdirSync(new URL("../lib/generated/", import.meta.url), { recursive: true });
writeFileSync(
  new URL("../lib/generated/land.json", import.meta.url),
  JSON.stringify(land),
);
console.log("Prepared Natural Earth land geometry.");

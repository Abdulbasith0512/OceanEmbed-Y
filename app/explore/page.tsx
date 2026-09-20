import type { Metadata } from "next";
import { OceanExplorer } from "@/components/explore/ocean-explorer";

export const metadata: Metadata = {
  title: "Ocean explorer",
  description:
    "Explore a demonstration of the North Indian Ocean at 15 depths through temperature, observability, and predictive uncertainty.",
};

export default function ExplorePage() {
  return <OceanExplorer />;
}

"use client";

import { useState } from "react";

import { Header } from "@/components/ui/header";
import { DEFAULT_DATE, DEFAULT_LOCATION } from "@/lib/ocean";
import { useProfile, useReconstruction } from "@/lib/hooks/use-ocean-data";
import type { Depth, OceanLocation } from "@/types/ocean";
import {
  DateControl,
  DepthControl,
  LayerLegend,
} from "./controls";
import { OceanField } from "./ocean-field";
import { VerticalProfile } from "./vertical-profile";

export function OceanExplorer() {
  const [depth, setDepth] = useState<Depth>(100);
  const [date, setDate] = useState(DEFAULT_DATE);
  const [location, setLocation] = useState<OceanLocation>(DEFAULT_LOCATION);
  const layer = "temperature" as const;
  const reconstruction = useReconstruction({ depth, date });
  const profile = useProfile(location, date);

  return (
    <div className="explorer-shell">
      <Header explorer />
      <main id="main-content" className="explorer-main">
        <div className="explorer-intro">
          <div>
            <h1>
              Explore the unseen<span> / North Indian Ocean</span>
            </h1>
            <p>A deeper view of temperature, observability, and uncertainty.</p>
          </div>
          <div className="intro-meta">
            <div>
              <strong>15</strong>
              <small>DEPTH LEVELS</small>
            </div>
            <div>
              <strong>0.25°</strong>
              <small>DAILY GRID</small>
            </div>
            <span
              className="demo-badge"
              title="All values are deterministic synthetic data, not model output."
            >
              <i /> MOCK DATA
            </span>
          </div>
        </div>
        <div className="explorer-workspace">
          <div className="map-workspace">
            <div className="explorer-toolbar">
              <DateControl value={date} onChange={setDate} />
              <DepthControl value={depth} onChange={setDepth} />
            </div>
            <OceanField
              data={reconstruction.data}
              loading={reconstruction.loading}
              error={reconstruction.error}
              retry={reconstruction.retry}
              layer={layer}
              location={location}
              onSelect={setLocation}
            />
            <LayerLegend layer={layer} />
          </div>
          <VerticalProfile
            data={profile.data}
            loading={profile.loading}
            error={profile.error}
            retry={profile.retry}
            location={location}
            depth={depth}
          />
        </div>
      </main>
    </div>
  );
}

"use client";

import { useState } from "react";
import {
  Activity,
  ArrowDownToLine,
  Download,
  MapPin,
  ScanLine,
} from "lucide-react";
import { formatLocation, predictionConfidence } from "@/lib/ocean";
import { locationName } from "@/lib/geography";
import type {
  Depth,
  OceanLocation,
  ProfilePoint,
  ProfileResponse,
} from "@/types/ocean";

type Props = {
  data: ProfileResponse | null;
  location: OceanLocation;
  depth: Depth;
  loading: boolean;
  error: string | null;
  retry: () => void;
};

function MiniProfile({
  data,
  field,
  depth,
}: {
  data: ProfileResponse;
  field: "observability" | "uncertainty";
  depth: Depth;
}) {
  const points = data.points;
  const max = field === "observability" ? 1 : 2.5;
  const path = points
    .map(
      (p, i) =>
        `${i === 0 ? "M" : "L"}${(p.depth / 1000) * 105 + 2},${28 - (p[field] / max) * 24}`,
    )
    .join(" ");
  const current = points.find((p) => p.depth === depth)!;
  return (
    <svg
      className="mini-depth-chart"
      viewBox="0 0 110 32"
      role="img"
      aria-label={`${field === "observability" ? "Observability" : "Uncertainty"} across 0 to 1000 metres`}
    >
      <path d="M2 30H108" stroke="#536d7933" />
      <path
        d={path}
        stroke={field === "observability" ? "#8dc1bc" : "#d4b08a"}
        fill="none"
        strokeWidth="1.25"
      />
      <circle
        cx={(depth / 1000) * 105 + 2}
        cy={28 - (current[field] / max) * 24}
        r="2.4"
        fill={field === "observability" ? "#9ed6ce" : "#e8bb8f"}
      />
    </svg>
  );
}

function ProfileChart({
  data,
  depth,
}: {
  data: ProfileResponse;
  depth: Depth;
}) {
  const [hoveredPoint, setHoveredPoint] = useState<ProfilePoint | null>(null);
  const left = 34,
    right = 238,
    top = 24,
    bottom = 207;
  const x = (temperature: number) => left + (temperature / 35) * (right - left);
  const y = (z: number) => top + (z / 1000) * (bottom - top);
  const points = data.points;
  const path = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${x(p.temperature)},${y(p.depth)}`)
    .join(" ");
  const upper = points.map(
    (p) => `${x(p.temperature + p.uncertainty)},${y(p.depth)}`,
  );
  const lower = [...points]
    .reverse()
    .map(
      (p) => `${x(Math.max(0, p.temperature - p.uncertainty))},${y(p.depth)}`,
    );
  const current = points.find((p) => p.depth === depth)!;
  const tooltipWidth = 108;
  const tooltipHeight = 34;
  const hoveredPosition = hoveredPoint
    ? { x: x(hoveredPoint.temperature), y: y(hoveredPoint.depth) }
    : null;
  const tooltipX = hoveredPosition
    ? Math.min(Math.max(hoveredPosition.x - tooltipWidth / 2, 2), 250 - tooltipWidth - 2)
    : 0;
  const tooltipY = hoveredPosition
    ? hoveredPosition.y < top + tooltipHeight
      ? hoveredPosition.y + 10
      : hoveredPosition.y - tooltipHeight - 10
    : 0;
  return (
    <svg
      className="profile-chart"
      viewBox="0 0 250 235"
      role="img"
      aria-label={`Vertical temperature profile. At ${depth} metres: ${current.temperature.toFixed(1)} degrees Celsius, predictive uncertainty ${current.uncertainty.toFixed(2)} degrees Celsius.`}
    >
      {[0, 10, 20, 30].map((temperature) => (
        <g key={temperature}>
          <line
            x1={x(temperature)}
            y1={top}
            x2={x(temperature)}
            y2={bottom}
            stroke="#6c869a22"
            strokeDasharray="2 4"
          />
          <text x={x(temperature)} y={12} textAnchor="middle">
            {temperature}°
          </text>
        </g>
      ))}
      {[0, 200, 500, 700, 1000].map((z) => (
        <g key={z}>
          <line
            x1={left}
            x2={right}
            y1={y(z)}
            y2={y(z)}
            stroke="#6c869a22"
            strokeDasharray="2 4"
          />
          <text x={left - 9} y={y(z) + 3} textAnchor="end">
            {z}
          </text>
        </g>
      ))}
      <path d={`M${[...upper, ...lower].join(" L")}Z`} fill="#e8a17d20" />
      <path
        d={path}
        fill="none"
        stroke="#e8a17d"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <g aria-label="Temperature points at all 15 standard depths">
        {points.map((point) => (
          <circle
            key={point.depth}
            className="profile-point"
            data-testid="temperature-profile-point"
            data-depth={point.depth}
            cx={x(point.temperature)}
            cy={y(point.depth)}
            r={point.depth === depth ? 3.4 : 2.5}
            fill="#f2b493"
            stroke="#142027"
            strokeWidth="1.3"
            tabIndex={0}
            aria-label={`Depth ${point.depth} metres, temperature ${point.temperature.toFixed(1)} degrees Celsius`}
            onMouseEnter={() => setHoveredPoint(point)}
            onMouseLeave={() => setHoveredPoint(null)}
            onFocus={() => setHoveredPoint(point)}
            onBlur={() => setHoveredPoint(null)}
          >
            <title>{`${point.depth} m: ${point.temperature.toFixed(1)} °C`}</title>
          </circle>
        ))}
      </g>
      <line
        x1={left}
        x2={right}
        y1={y(depth)}
        y2={y(depth)}
        stroke="#a7c8cd88"
        strokeWidth=".7"
        strokeDasharray="3 3"
      />
      <circle
        cx={x(current.temperature)}
        cy={y(depth)}
        r="4"
        fill="#f2b493"
        stroke="#142027"
        strokeWidth="2"
      />
      {hoveredPoint && hoveredPosition && (
        <g
          className="profile-tooltip"
          data-testid="temperature-profile-tooltip"
          role="status"
          aria-label={`Depth ${hoveredPoint.depth} metres, temperature ${hoveredPoint.temperature.toFixed(1)} degrees Celsius`}
          transform={`translate(${tooltipX} ${tooltipY})`}
        >
          <rect width={tooltipWidth} height={tooltipHeight} rx="2" />
          <text x="8" y="14">
            Depth: {hoveredPoint.depth} m
          </text>
          <text x="8" y="27">
            Temperature: {hoveredPoint.temperature.toFixed(1)} °C
          </text>
        </g>
      )}
      <text x={right} y={229} textAnchor="end">
        Temperature / °C
      </text>
      <text x={left - 6} y={229} textAnchor="end">
        m
      </text>
    </svg>
  );
}

export function VerticalProfile({
  data,
  location,
  depth,
  loading,
  error,
  retry,
}: Props) {
  const current = data?.points.find((p) => p.depth === depth);
  const selected = loading ? undefined : current;
  const confidence = selected
    ? predictionConfidence(selected.observability, selected.uncertainty)
    : null;
  function download() {
    if (!data || loading) return;
    const csv = [
      "source,date,latitude,longitude,depth_m,temperature_c,observability_index,predictive_uncertainty_c",
      ...data.points.map((p) =>
        [
          data.source,
          data.date,
          p.lat,
          p.lon,
          p.depth,
          p.temperature,
          p.observability,
          p.uncertainty,
        ].join(","),
      ),
    ].join("\n");
    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8;" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `oceanembed-mock-profile-${data.lat}-${data.lon}-${data.date}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <aside
      className="profile-panel"
      aria-label="Selected ocean location profile"
      aria-busy={loading}
    >
      <div className="profile-heading">
        <span className="eyebrow">A VERTICAL PERSPECTIVE</span>
        <ArrowDownToLine size={14} />
      </div>
      <h2>Beneath this point.</h2>
      <p className="profile-coordinates" data-testid="profile-coordinates">
        {formatLocation(location)}
      </p>
      <div className="profile-location">
        <MapPin size={11} />
        {locationName(location)}
      </div>
      <div className="profile-divider" />
      {error ? (
        <div className="profile-body" role="alert">
          <p>{error}</p>
          <button className="profile-download" onClick={retry}>
            Retry profile
          </button>
        </div>
      ) : (
        <div className={`profile-body ${loading ? "profile-loading" : ""}`}>
          <div className="selected-results" aria-live="polite">
            <div
              className="selected-result"
              data-testid="temperature-output"
              aria-label={`Temperature at ${depth} metres`}
            >
              <span>TEMPERATURE AT {depth} M</span>
              <strong>
                {selected ? selected.temperature.toFixed(1) : "—"}
                <small>°C</small>
              </strong>
            </div>
            <div
              className="selected-result"
              data-testid="confidence-output"
              title="Derived from observability and predictive uncertainty; not a calibrated probability."
            >
              <span>CONFIDENCE SCORE</span>
              <strong>
                {confidence === null ? "—" : `${Math.round(confidence * 100)}%`}
              </strong>
              <small>prediction reliability</small>
            </div>
          </div>
          <div className="profile-chart-heading">
            <span>15-depth temperature profile</span>
            <small>0 — 1000 m · 15 points</small>
          </div>
          {data ? (
            <ProfileChart data={data} depth={depth} />
          ) : (
            <div style={{ height: 235 }} role="status">
              <p style={{ paddingTop: 70, textAlign: "center", fontSize: 11 }}>
                Loading vertical profile…
              </p>
            </div>
          )}
          <div className="chart-caption">
            <span>
              <i />
              Reconstruction
            </span>
            <span>
              <i className="band" />
              ±σ illustrative band
            </span>
          </div>
          <div className="profile-metrics">
            <div className="profile-metric">
              <span>
                <ScanLine />
                Observability
              </span>
              <strong>
                {current?.observability.toFixed(2) ?? "—"}
                <small>/ 1</small>
              </strong>
              {data && (
                <MiniProfile data={data} field="observability" depth={depth} />
              )}
            </div>
            <div className="profile-metric">
              <span>
                <Activity />
                Uncertainty
              </span>
              <strong>
                {current?.uncertainty.toFixed(2) ?? "—"}
                <small>°C</small>
              </strong>
              {data && (
                <MiniProfile data={data} field="uncertainty" depth={depth} />
              )}
            </div>
          </div>
          <p className="profile-note">
            {depth >= 300
              ? "At greater depths, surface observations typically offer weaker constraints. Direct measurements remain essential."
              : "Observability describes how strongly surface observations constrain a depth. It is distinct from predictive uncertainty."}
            {" "}Confidence is a derived proxy, not a calibrated probability.
          </p>
        </div>
      )}
      <button
        className="profile-download"
        onClick={download}
        disabled={!data || loading || Boolean(error)}
      >
        <Download size={13} />
        Download mock profile
      </button>
      <span className="sr-only" aria-live="polite">
        {!loading && current
          ? `At ${depth} metres, temperature ${current.temperature.toFixed(1)} degrees Celsius. Observability ${current.observability.toFixed(2)}. Uncertainty ${current.uncertainty.toFixed(2)} degrees Celsius.`
          : "Loading profile."}
      </span>
    </aside>
  );
}

"use client";

import { ArrowDownToLine, CalendarDays } from "lucide-react";
import { LAYERS } from "@/lib/ocean";
import { DEPTHS, type DataLayer, type Depth } from "@/types/ocean";


export function DateControl({
  value,
  onChange,
}: {
  value: string;
  onChange: (date: string) => void;
}) {
  return (
    <label className="date-control">
      <CalendarDays size={15} />
      <span className="date-control-label">OBSERVATION DATE</span>
      <input
        type="date"
        aria-label="Observation date"
        value={value}
        min="1993-01-01"
        max="2026-12-31"
        onChange={(event) => {
          if (event.target.validity.valid && event.target.value)
            onChange(event.target.value);
        }}
      />
    </label>
  );
}

export function DepthControl({
  value,
  onChange,
}: {
  value: Depth;
  onChange: (depth: Depth) => void;
}) {
  return (
    <section className="depth-control" aria-label="Depth selection">
      <div className="depth-control-header">
        <label htmlFor="depth-select">
          <ArrowDownToLine size={14} /> SELECT DEPTH
        </label>
        <div className="depth-value">
          <small>{value === 0 ? "At the surface" : "Below the surface"}</small>
          <strong>{value.toLocaleString("en")}</strong>
          <span>m</span>
        </div>
      </div>
      <div className="depth-selector">
        <select
          id="depth-select"
          aria-label="Choose depth level"
          value={value}
          onChange={(event) => onChange(Number(event.target.value) as Depth)}
        >
          {DEPTHS.map((depth) => (
            <option key={depth} value={depth}>
              {depth === 0 ? "0 m — Surface" : `${depth.toLocaleString("en")} m`}
            </option>
          ))}
        </select>
        <span className="depth-option-count">15 PDF levels</span>
      </div>
    </section>
  );
}


export function LayerLegend({ layer }: { layer: DataLayer }) {
  const config = LAYERS[layer];
  return (
    <div
      className="map-legend"
      aria-label={`${config.label} scale from ${config.min} to ${config.max} ${config.unit}`}
    >
      <div className="legend-title">
        {config.label}
        <span>
          {config.symbol} {config.unit && ` / ${config.unit}`}
        </span>
      </div>
      <div className="legend-gradient-wrap">
        <div
          className="legend-gradient"
          style={{
            background: `linear-gradient(90deg,${config.colors.join(",")})`,
          }}
        />
        <div className="legend-ticks">
          {Array.from({ length: 5 }, (_, i) => {
            const value = config.min + ((config.max - config.min) * i) / 4;
            return (
              <span key={i}>
                {layer === "temperature" ? value.toFixed(0) : value.toFixed(2)}
              </span>
            );
          })}
        </div>
      </div>
      <span className="legend-resolution">0.25° SPATIAL GRID</span>
    </div>
  );
}

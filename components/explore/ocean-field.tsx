"use client";

import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import {
  Crosshair,
  Grid2X2,
  Minus,
  MousePointer2,
  Plus,
  RotateCcw,
} from "lucide-react";
import { isOcean } from "@/lib/geography";
import { clamp, LAYERS, REGION } from "@/lib/ocean";
import {
  createFieldRaster,
  drawOceanMap,
  projection,
  type MapView,
} from "@/lib/map-renderer";
import { useMediaQuery } from "@/lib/hooks/use-media-query";
import type {
  DataLayer,
  OceanLocation,
  ReconstructionResponse,
} from "@/types/ocean";

const initialView: MapView = { zoom: 1, center: { lat: 12.5, lon: 72.5 } };

type Props = {
  data: ReconstructionResponse | null;
  layer: DataLayer;
  location: OceanLocation;
  onSelect: (location: OceanLocation) => void;
  loading: boolean;
  error: string | null;
  retry: () => void;
};

export function OceanField({
  data,
  layer,
  location,
  onSelect,
  loading,
  error,
  retry,
}: Props) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const rasterCache = useRef<{
    data: ReconstructionResponse;
    layer: DataLayer;
    canvas: HTMLCanvasElement;
  } | null>(null);
  const drag = useRef<{
    x: number;
    y: number;
    center: OceanLocation;
    moved: boolean;
  } | null>(null);
  const [view, setView] = useState(initialView);
  const [grid, setGrid] = useState(true);
  const [announcement, setAnnouncement] = useState("");
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");

  useEffect(() => {
    const element = canvas.current;
    const context = element?.getContext("2d");
    if (!element || !context) return;
    let animation = 0;
    const fieldChanged =
      data &&
      (rasterCache.current?.data !== data ||
        rasterCache.current?.layer !== layer);
    if (data && fieldChanged)
      rasterCache.current = {
        data,
        layer,
        canvas: createFieldRaster(data, layer),
      };

    function render(animate: boolean) {
      if (!element || !context) return;
      cancelAnimationFrame(animation);
      const { width, height } = element.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const target = document.createElement("canvas");
      target.width = Math.round(width * dpr);
      target.height = Math.round(height * dpr);
      const targetContext = target.getContext("2d")!;
      targetContext.scale(dpr, dpr);
      drawOceanMap(
        targetContext,
        width,
        height,
        rasterCache.current?.canvas ?? null,
        location,
        view,
        grid,
      );
      const previous = document.createElement("canvas");
      previous.width = element.width;
      previous.height = element.height;
      previous.getContext("2d")!.drawImage(element, 0, 0);
      element.width = target.width;
      element.height = target.height;
      const start = performance.now();
      function frame(now: number) {
        if (!element || !context) return;
        const t =
          animate && !reducedMotion ? Math.min((now - start) / 380, 1) : 1;
        context.globalAlpha = 1;
        context.clearRect(0, 0, element.width, element.height);
        if (t < 1)
          context.drawImage(previous, 0, 0, element.width, element.height);
        context.globalAlpha = t;
        context.drawImage(target, 0, 0);
        context.globalAlpha = 1;
        if (t < 1) animation = requestAnimationFrame(frame);
      }
      animation = requestAnimationFrame(frame);
    }
    render(Boolean(fieldChanged));
    let lastSize = `${element.clientWidth}:${element.clientHeight}`;
    const resize = new ResizeObserver(() => {
      const size = `${element.clientWidth}:${element.clientHeight}`;
      if (size !== lastSize) {
        lastSize = size;
        render(false);
      }
    });
    resize.observe(element);
    return () => {
      resize.disconnect();
      cancelAnimationFrame(animation);
    };
  }, [data, layer, location, view, grid, reducedMotion]);

  function select(candidate: OceanLocation) {
    const point = {
      lat: Math.round(candidate.lat * 4) / 4,
      lon: Math.round(candidate.lon * 4) / 4,
    };
    if (!isOcean(point)) {
      setAnnouncement(
        "Choose an ocean location within the study region. Land locations are unavailable.",
      );
      return;
    }
    onSelect(point);
    setAnnouncement(
      `Selected ${Math.abs(point.lat).toFixed(2)} degrees ${point.lat >= 0 ? "north" : "south"}, ${point.lon.toFixed(2)} degrees east.`,
    );
  }

  function pointerDown(event: PointerEvent<HTMLCanvasElement>) {
    drag.current = {
      x: event.clientX,
      y: event.clientY,
      center: view.center,
      moved: false,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }
  function pointerMove(event: PointerEvent<HTMLCanvasElement>) {
    if (!drag.current || !canvas.current) return;
    const dx = event.clientX - drag.current.x,
      dy = event.clientY - drag.current.y;
    if (Math.hypot(dx, dy) < 5 && !drag.current.moved) return;
    drag.current.moved = true;
    const { width, height } = canvas.current.getBoundingClientRect();
    const { scale } = projection(width, height, view);
    setView({
      zoom: view.zoom,
      center: {
        lon: clamp(
          drag.current.center.lon - dx / scale,
          REGION.west + 4,
          REGION.east - 4,
        ),
        lat: clamp(
          drag.current.center.lat + dy / scale,
          REGION.south + 3,
          REGION.north - 3,
        ),
      },
    });
  }
  function pointerUp(event: PointerEvent<HTMLCanvasElement>) {
    if (drag.current && !drag.current.moved) {
      const rect = event.currentTarget.getBoundingClientRect();
      select(
        projection(rect.width, rect.height, view).invert(
          event.clientX - rect.left,
          event.clientY - rect.top,
        ),
      );
    }
    drag.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
  }
  function keyboard(event: KeyboardEvent<HTMLCanvasElement>) {
    if (event.key === "+" || event.key === "=") {
      event.preventDefault();
      setView((v) => ({ zoom: Math.min(3, v.zoom + 0.4), center: location }));
      return;
    }
    if (event.key === "-" || event.key === "_") {
      event.preventDefault();
      setView((v) => ({ ...v, zoom: Math.max(0.6, v.zoom - 0.4) }));
      return;
    }
    const directions: Record<string, [number, number]> = {
      ArrowUp: [0.25, 0],
      ArrowDown: [-0.25, 0],
      ArrowLeft: [0, -0.25],
      ArrowRight: [0, 0.25],
    };
    const direction = directions[event.key];
    if (!direction) return;
    event.preventDefault();
    for (let i = 1; i <= 100; i++) {
      const candidate = {
        lat: location.lat + direction[0] * i,
        lon: location.lon + direction[1] * i,
      };
      if (isOcean(candidate)) {
        select(candidate);
        setView((v) => ({ ...v, center: candidate }));
        return;
      }
    }
    setAnnouncement("The edge of the available ocean region has been reached.");
  }

  return (
    <div className="map-container">
      <canvas
        ref={canvas}
        className="ocean-map"
        tabIndex={0}
        role="application"
        aria-roledescription="interactive ocean map"
        aria-label="North Indian Ocean. Click an ocean location to inspect its profile, drag to pan, or use arrow keys to move the selected location. Plus and minus zoom."
        aria-describedby="map-keyboard-help"
        onPointerDown={pointerDown}
        onPointerMove={pointerMove}
        onPointerUp={pointerUp}
        onPointerCancel={() => {
          drag.current = null;
        }}
        onKeyDown={keyboard}
        style={{ touchAction: "pan-y" }}
      />
      <div className="map-caption">
        <span className="eyebrow">
          {LAYERS[layer].symbol} / {LAYERS[layer].label.toUpperCase()} FIELD
        </span>
        <span className="mono">NORTH INDIAN OCEAN · {data?.depth ?? 0} m</span>
      </div>
      <div className="map-tools">
        <button
          className="icon-button"
          aria-label="Zoom in"
          disabled={view.zoom >= 3}
          onClick={() =>
            setView((v) => ({
              zoom: Math.min(3, v.zoom + 0.4),
              center: location,
            }))
          }
        >
          <Plus />
        </button>
        <button
          className="icon-button"
          aria-label="Zoom out"
          disabled={view.zoom <= 0.6}
          onClick={() =>
            setView((v) => ({ ...v, zoom: Math.max(0.6, v.zoom - 0.4) }))
          }
        >
          <Minus />
        </button>
        <button
          className="icon-button"
          aria-label="Center selected location"
          onClick={() => setView((v) => ({ ...v, center: location }))}
        >
          <Crosshair />
        </button>
        <button
          className="icon-button"
          aria-label="Toggle coordinate grid"
          aria-pressed={grid}
          onClick={() => setGrid((value) => !value)}
        >
          <Grid2X2 />
        </button>
        <button
          className="icon-button"
          aria-label="Reset map view"
          onClick={() => setView(initialView)}
        >
          <RotateCcw />
        </button>
      </div>
      <span className="map-hint">
        <MousePointer2 size={12} /> Click the ocean to inspect a profile. Drag
        to pan.
      </span>
      <p id="map-keyboard-help" className="map-keyboard-help">
        Arrow keys move the selection between ocean grid points. Plus and minus
        zoom. Tab moves to map controls.
      </p>
      {loading && (
        <div className="map-loading" role="status">
          <i className="loading-ring" />
          Reconstructing the view…
        </div>
      )}
      {error && (
        <div className="map-error" role="alert">
          <p>{error}</p>
          <button className="primary-button" onClick={retry}>
            Retry loading
          </button>
        </div>
      )}
      <span className="sr-only" role="status" aria-live="polite">
        {announcement}
      </span>
    </div>
  );
}

import { land } from "@/lib/geography";
import { colorForValue, LAYERS, REGION } from "@/lib/ocean";
import type {
  DataLayer,
  OceanLocation,
  ReconstructionResponse,
} from "@/types/ocean";

export type MapView = { zoom: number; center: OceanLocation };

export function projection(width: number, height: number, view: MapView) {
  const scale =
    Math.max(
      width / (REGION.east - REGION.west),
      height / (REGION.north - REGION.south),
    ) * view.zoom;
  return {
    scale,
    x: (lon: number) => width / 2 + (lon - view.center.lon) * scale,
    y: (lat: number) => height / 2 - (lat - view.center.lat) * scale,
    invert: (x: number, y: number): OceanLocation => ({
      lon: view.center.lon + (x - width / 2) / scale,
      lat: view.center.lat - (y - height / 2) / scale,
    }),
  };
}

export function createFieldRaster(
  data: ReconstructionResponse,
  layer: DataLayer,
) {
  const columns = Math.round((REGION.east - REGION.west) / data.resolution) + 1;
  const rows = Math.round((REGION.north - REGION.south) / data.resolution) + 1;
  const raster = document.createElement("canvas");
  raster.width = columns;
  raster.height = rows;
  const context = raster.getContext("2d")!;
  const pixels = context.createImageData(columns, rows);
  const config = LAYERS[layer];
  const palette = Array.from({ length: 256 }, (_, i) =>
    colorForValue(config.min + (i / 255) * (config.max - config.min), layer)
      .match(/\d+/g)!
      .map(Number),
  );
  for (const point of data.points) {
    const x = Math.round((point.lon - REGION.west) / data.resolution);
    const y = Math.round((REGION.north - point.lat) / data.resolution);
    const index = (y * columns + x) * 4;
    const colorIndex = Math.max(
      0,
      Math.min(
        255,
        Math.round(
          ((point[layer] - config.min) / (config.max - config.min)) * 255,
        ),
      ),
    );
    const color = palette[colorIndex];
    pixels.data[index] = color[0];
    pixels.data[index + 1] = color[1];
    pixels.data[index + 2] = color[2];
    pixels.data[index + 3] = 255;
  }
  context.putImageData(pixels, 0, 0);
  return raster;
}

export function drawOceanMap(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  raster: HTMLCanvasElement | null,
  location: OceanLocation,
  view: MapView,
  grid: boolean,
) {
  const { x, y, scale } = projection(width, height, view);
  context.fillStyle = "#142b39";
  context.fillRect(0, 0, width, height);
  if (raster) {
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    context.globalAlpha = 0.95;
    context.drawImage(
      raster,
      x(REGION.west),
      y(REGION.north),
      (REGION.east - REGION.west) * scale,
      (REGION.north - REGION.south) * scale,
    );
    context.globalAlpha = 1;
  }

  // Subtle field contours hint at circulation without claiming observed currents.
  context.save();
  context.globalAlpha = 0.22;
  context.strokeStyle = "#f0eedb";
  context.lineWidth = 0.7;
  for (let j = 0; j < 13; j++) {
    context.beginPath();
    for (let i = 0; i <= 120; i++) {
      const lon = 40 + i * 0.55;
      const lat =
        -5 +
        j * 3.2 +
        Math.sin(lon * 0.17 + j * 0.6) * 2.5 +
        Math.sin(lon * 0.3) * 0.7;
      if (i === 0) context.moveTo(x(lon), y(lat));
      else context.lineTo(x(lon), y(lat));
    }
    context.stroke();
  }
  context.restore();

  context.fillStyle = "#142027";
  context.strokeStyle = "#71888b";
  context.lineWidth = 0.75;
  for (const polygon of land.coordinates) {
    context.beginPath();
    for (const ring of polygon) {
      ring.forEach(([lon, lat], i) => {
        if (i === 0) context.moveTo(x(lon), y(lat));
        else context.lineTo(x(lon), y(lat));
      });
      context.closePath();
    }
    context.fill("evenodd");
    context.stroke();
  }

  if (grid) {
    context.save();
    context.strokeStyle = "#b8ced926";
    context.lineWidth = 0.6;
    context.setLineDash([2, 5]);
    for (let lon = 40; lon <= 105; lon += 5) {
      context.beginPath();
      context.moveTo(x(lon), 0);
      context.lineTo(x(lon), height);
      context.stroke();
    }
    for (let lat = -5; lat <= 30; lat += 5) {
      context.beginPath();
      context.moveTo(0, y(lat));
      context.lineTo(width, y(lat));
      context.stroke();
    }
    context.restore();
    context.font = '8px "Space Grotesk Variable",sans-serif';
    context.fillStyle = "#c6d8dd88";
    for (let lon = 45; lon <= 100; lon += 10) {
      if (x(lon) > 30 && x(lon) < width - 30)
        context.fillText(`${lon}° E`, x(lon) + 5, height - 9);
    }
    for (let lat = 0; lat <= 25; lat += 10) {
      if (y(lat) > 70 && y(lat) < height - 50)
        context.fillText(`${lat}° N`, 7, y(lat) - 5);
    }
  }

  context.textAlign = "center";
  const labels: [string, number, number, boolean][] = [
    ["I N D I A", 79, 23, false],
    ["O M A N", 56.3, 22, false],
    ["S O M A L I A", 46, 8.5, false],
    ["SRI LANKA", 81.7, 7.3, false],
    ["M Y A N M A R", 96, 22, false],
    ["ARABIAN SEA", 64, 14, true],
    ["BAY OF BENGAL", 88, 14.5, true],
    ["I N D I A N   O C E A N", 75, -1.7, true],
  ];
  for (const [label, lon, lat, ocean] of labels) {
    const px = x(lon),
      py = y(lat);
    if (px < 30 || px > width - 30 || py < 30 || py > height - 25) continue;
    context.font = `${ocean ? "italic 600 11" : "500 8"}px "Space Grotesk Variable",sans-serif`;
    context.fillStyle = ocean ? "#eff3e3d9" : "#b3c3c9";
    context.shadowColor = "#0b1921";
    context.shadowBlur = ocean ? 5 : 0;
    context.fillText(label, px, py);
  }
  context.shadowBlur = 0;

  const px = x(location.lon),
    py = y(location.lat);
  context.strokeStyle = "#f6d5b6";
  context.lineWidth = 1;
  context.beginPath();
  context.arc(px, py, 10, 0, Math.PI * 2);
  context.stroke();
  context.fillStyle = "#ffe0c0";
  context.beginPath();
  context.arc(px, py, 3, 0, Math.PI * 2);
  context.fill();
  context.strokeStyle = "#ffe1c577";
  for (const [dx, dy] of [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ]) {
    context.beginPath();
    context.moveTo(px + dx * 14, py + dy * 14);
    context.lineTo(px + dx * 21, py + dy * 21);
    context.stroke();
  }
  context.font = '8px "Space Grotesk Variable",sans-serif';
  context.textAlign = "left";
  const labelX = px > width - 150 ? px - 136 : px + 22;
  context.fillStyle = "#0b1921e8";
  context.fillRect(labelX, py - 12, 114, 25);
  context.fillStyle = "#e5e3d6";
  context.fillText(
    `${Math.abs(location.lat).toFixed(2)}°${location.lat >= 0 ? "N" : "S"}  ${location.lon.toFixed(2)}°E`,
    labelX + 9,
    py + 4,
  );
}

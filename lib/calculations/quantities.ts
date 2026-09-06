import type { RoomDimensions } from "@/types";
import type { SurfaceKind } from "@/lib/constants";
import { round } from "./money";

export interface SurfaceAreas {
  floorArea: number;
  ceilingArea: number;
  wallArea: number;
  perimeter: number;
  volume: number;
}

export function calculateFloorArea(d: RoomDimensions): number {
  return round(d.width * d.length);
}

export function calculateCeilingArea(d: RoomDimensions): number {
  return round(d.width * d.length);
}

export function calculatePerimeter(d: RoomDimensions): number {
  return round(2 * (d.width + d.length));
}

export function calculateWallArea(d: RoomDimensions): number {
  return round(calculatePerimeter(d) * d.height);
}

export function calculateVolume(d: RoomDimensions): number {
  return round(d.width * d.length * d.height);
}

export function surfaceAreas(d: RoomDimensions): SurfaceAreas {
  return {
    floorArea: calculateFloorArea(d),
    ceilingArea: calculateCeilingArea(d),
    wallArea: calculateWallArea(d),
    perimeter: calculatePerimeter(d),
    volume: calculateVolume(d),
  };
}

/** Base quantity (before waste) for a surface material in its own unit. */
export function baseSurfaceQuantity(
  surface: SurfaceKind | undefined,
  d: RoomDimensions,
  unit: string,
): number {
  const a = surfaceAreas(d);
  if (unit === "ml") return a.perimeter;
  if (unit === "m3") return a.volume;
  switch (surface) {
    case "wall":
      return a.wallArea;
    case "ceiling":
      return a.ceilingArea;
    case "floor":
    default:
      return a.floorArea;
  }
}

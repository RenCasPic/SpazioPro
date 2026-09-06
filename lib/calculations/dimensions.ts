import type { RoomDimensions } from "@/types";
import type { SurfaceKind } from "@/lib/constants";
import { inchesToFeet } from "./units";
import { round } from "./money";

export interface SurfaceAreas {
  /** square feet */
  floorAreaSqFt: number;
  ceilingAreaSqFt: number;
  wallAreaSqFt: number;
  /** linear feet */
  perimeterLinFt: number;
  /** cubic feet */
  volumeCuFt: number;
}

export function surfaceAreas(d: RoomDimensions): SurfaceAreas {
  const wFt = inchesToFeet(d.widthIn);
  const lFt = inchesToFeet(d.lengthIn);
  const hFt = inchesToFeet(d.heightIn);
  const floor = wFt * lFt;
  const perimeter = 2 * (wFt + lFt);
  return {
    floorAreaSqFt: round(floor),
    ceilingAreaSqFt: round(floor),
    wallAreaSqFt: round(perimeter * hFt),
    perimeterLinFt: round(perimeter),
    volumeCuFt: round(floor * hFt),
  };
}

/** Base quantity (before waste) for a surface material in its own unit. */
export function baseSurfaceQuantity(
  surface: SurfaceKind | undefined,
  d: RoomDimensions,
  unit: string,
): number {
  const a = surfaceAreas(d);
  if (unit === "linear_ft") return a.perimeterLinFt;
  if (unit === "cu_ft") return a.volumeCuFt;
  if (unit === "cu_yd") return round(a.volumeCuFt / 27);
  if (unit === "gallon") return round(a.wallAreaSqFt / 350); // ~350 sq ft per gal, 1 coat
  switch (surface) {
    case "wall":
      return a.wallAreaSqFt;
    case "ceiling":
      return a.ceilingAreaSqFt;
    case "floor":
    default:
      return a.floorAreaSqFt;
  }
}

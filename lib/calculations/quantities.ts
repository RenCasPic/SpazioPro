import type { RoomDimensions } from "@/types";
import { inchesToFeet } from "./units";
import { round } from "./money";

export * from "./dimensions";

/** width × length, in square feet. */
export function calculateFloorArea(d: RoomDimensions): number {
  return round(inchesToFeet(d.widthIn) * inchesToFeet(d.lengthIn));
}

export function calculateCeilingArea(d: RoomDimensions): number {
  return calculateFloorArea(d);
}

/** 2·(w+l), in linear feet. */
export function calculatePerimeter(d: RoomDimensions): number {
  return round(2 * (inchesToFeet(d.widthIn) + inchesToFeet(d.lengthIn)));
}

/** perimeter × height, in square feet. */
export function calculateWallArea(d: RoomDimensions): number {
  return round(calculatePerimeter(d) * inchesToFeet(d.heightIn));
}

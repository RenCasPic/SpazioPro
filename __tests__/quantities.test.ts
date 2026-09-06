import { describe, expect, it } from "vitest";
import {
  calculateFloorArea,
  calculateWallArea,
  calculatePerimeter,
  baseSurfaceQuantity,
} from "@/lib/calculations/quantities";
import { calculateWaste } from "@/lib/calculations/materials";
import { toInches, fromInches } from "@/lib/calculations/units";

const ft = (feet: number, inches = 0) => toInches({ feet, inches });

describe("imperial surface quantities", () => {
  it("4 ft × 5 ft = 20 sq ft", () => {
    const room = { widthIn: ft(4), lengthIn: ft(5), heightIn: ft(8) };
    expect(calculateFloorArea(room)).toBe(20);
  });

  it("12 ft × 15 ft = 180 sq ft", () => {
    const room = { widthIn: ft(12), lengthIn: ft(15), heightIn: ft(9) };
    expect(calculateFloorArea(room)).toBe(180);
    expect(calculatePerimeter(room)).toBe(54); // linear ft
    expect(calculateWallArea(room)).toBe(486); // 54 × 9
  });

  it("180 sq ft + 10% waste = 198 sq ft", () => {
    expect(calculateWaste(180, 10)).toBe(198);
  });

  it("handles feet + inches", () => {
    const room = { widthIn: ft(10, 6), lengthIn: ft(12), heightIn: ft(8) };
    expect(calculateFloorArea(room)).toBe(126); // 10.5 × 12
  });

  it("ft/in round-trips", () => {
    expect(fromInches(ft(8, 6))).toEqual({ feet: 8, inches: 6 });
  });

  it("base quantity picks the right surface + unit", () => {
    const room = { widthIn: ft(12), lengthIn: ft(15), heightIn: ft(9) };
    expect(baseSurfaceQuantity("floor", room, "sq_ft")).toBe(180);
    expect(baseSurfaceQuantity("wall", room, "sq_ft")).toBe(486);
    expect(baseSurfaceQuantity("wall", room, "linear_ft")).toBe(54);
  });
});

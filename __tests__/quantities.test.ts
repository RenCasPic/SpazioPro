import { describe, expect, it } from "vitest";
import {
  calculateFloorArea,
  calculateWallArea,
  calculatePerimeter,
  baseSurfaceQuantity,
} from "@/lib/calculations/quantities";
import { calculateWaste } from "@/lib/calculations/materials";

describe("surface quantities", () => {
  const room = { width: 4.2, length: 5.1, height: 2.6 };

  it("floor area = width × length", () => {
    expect(calculateFloorArea(room)).toBe(21.42);
  });

  it("perimeter = 2·(w+l)", () => {
    expect(calculatePerimeter(room)).toBe(18.6);
  });

  it("wall area = perimeter × height", () => {
    expect(calculateWallArea(room)).toBe(48.36);
  });

  it("adds 10% waste → 21.42 becomes 23.56", () => {
    expect(calculateWaste(calculateFloorArea(room), 10)).toBe(23.56);
  });

  it("waste is consistent and rounded to 2 decimals", () => {
    expect(calculateWaste(45, 5)).toBe(47.25);
    expect(calculateWaste(21.42, 8)).toBe(23.13);
  });

  it("base quantity picks the surface it covers", () => {
    expect(baseSurfaceQuantity("floor", room, "m2")).toBe(21.42);
    expect(baseSurfaceQuantity("wall", room, "m2")).toBe(48.36);
    expect(baseSurfaceQuantity("wall", room, "ml")).toBe(18.6);
  });
});

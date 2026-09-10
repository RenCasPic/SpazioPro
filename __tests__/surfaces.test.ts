import { describe, expect, it } from "vitest";
import {
  polygonAreaSqFt,
  polygonPerimeterLinFt,
  wallNetAreaSqFt,
  computeEntityDimensions,
  entitySurfaceQuantity,
} from "@/lib/calculations/surfaces";
import { calculateWaste } from "@/lib/calculations/materials";
import type { RoomEntity } from "@/types";

const ft = (n: number) => n * 12;

function wall(id: string, lengthIn: number, heightIn: number, openingIds: string[] = []): RoomEntity {
  return {
    id,
    type: "wall",
    label: id,
    parentId: "room_01",
    childIds: openingIds,
    surfaceKind: "wall",
    quantifiable: true,
    geometry: {
      polygon: [
        { u: 0, v: 0 },
        { u: lengthIn, v: 0 },
        { u: lengthIn, v: heightIn },
        { u: 0, v: heightIn },
      ],
    },
    dimensions: {},
    openingIds,
    confidence: 0.95,
    source: "demo",
    calibrationStatus: "calibrated",
    validationStatus: "verified",
  };
}

function opening(id: string, widthIn: number, heightIn: number, x = 0, y = 0): RoomEntity {
  return {
    id,
    type: "window",
    label: id,
    parentId: "wall_01",
    childIds: [],
    quantifiable: false,
    geometry: { position: { x, y, z: 0 } },
    dimensions: { widthIn, heightIn },
    confidence: 0.8,
    source: "demo",
    calibrationStatus: "calibrated",
    validationStatus: "unverified",
  };
}

describe("polygon geometry (inches → imperial)", () => {
  it("shoelace area of a 12 ft × 15 ft rectangle = 180 sq ft", () => {
    const poly = [
      { x: 0, z: 0 },
      { x: ft(12), z: 0 },
      { x: ft(12), z: ft(15) },
      { x: 0, z: ft(15) },
    ];
    expect(polygonAreaSqFt(poly)).toBe(180);
    expect(polygonPerimeterLinFt(poly)).toBe(54);
  });

  it("L-shaped floor area = full rectangle minus the missing corner", () => {
    // 20×16 = 320, minus the missing top-left 8×10 = 80  →  240 sq ft
    const poly = [
      { x: 0, z: 0 },
      { x: ft(20), z: 0 },
      { x: ft(20), z: ft(16) },
      { x: ft(8), z: ft(16) },
      { x: ft(8), z: ft(6) },
      { x: 0, z: ft(6) },
    ];
    expect(polygonAreaSqFt(poly)).toBe(240);
  });

  it("winding direction does not matter", () => {
    const cw = [
      { x: 0, z: 0 },
      { x: 0, z: ft(10) },
      { x: ft(10), z: ft(10) },
      { x: ft(10), z: 0 },
    ];
    expect(polygonAreaSqFt(cw)).toBe(100);
  });
});

describe("wall net area = gross − openings", () => {
  it("the brief's wall: ~13.78 ft × ~8.86 ft − (4 ft × 4 ft) ≈ 106 sq ft net", () => {
    const gross = wallNetAreaSqFt(165.4, 106.3, []);
    expect(gross).toBeCloseTo(122.09, 1);
    const net = wallNetAreaSqFt(165.4, 106.3, [{ uIn: 60, vIn: 40, widthIn: 48, heightIn: 48 }]);
    expect(net).toBeCloseTo(106.09, 1);
    expect(gross - net).toBe(16); // exactly the 4×4 window
  });

  it("computeEntityDimensions subtracts child openings from a wall", () => {
    const w = wall("wall_01", ft(14), ft(8), ["win_1"]);
    const d = computeEntityDimensions(w, [opening("win_1", ft(3), ft(4))]);
    expect(d.grossAreaSqFt).toBe(112); // 14 × 8
    expect(d.netAreaSqFt).toBe(100); // 112 − 12
    expect(d.lengthIn).toBe(ft(14));
    expect(d.heightIn).toBe(ft(8));
    expect(d.perimeterLinFt).toBe(14);
  });

  it("openings never drive the wall area negative", () => {
    expect(wallNetAreaSqFt(24, 24, [{ uIn: 0, vIn: 0, widthIn: 100, heightIn: 100 }])).toBe(0);
  });
});

describe("entitySurfaceQuantity → feeds the existing quantity engine", () => {
  it("the brief's example: floor 250 sq ft + 10% waste = 275 sq ft purchase", () => {
    const floor: RoomEntity = {
      id: "floor_01",
      type: "floor",
      label: "Floor",
      parentId: "room_01",
      childIds: [],
      surfaceKind: "floor",
      quantifiable: true,
      geometry: {},
      dimensions: { grossAreaSqFt: 250, netAreaSqFt: 250, perimeterLinFt: 64 },
      confidence: 0.95,
      source: "demo",
      calibrationStatus: "calibrated",
      validationStatus: "verified",
    };
    const base = entitySurfaceQuantity(floor, "sq_ft");
    expect(base).toBe(250);
    expect(calculateWaste(base, 10)).toBe(275);
  });

  it("baseboards (linear_ft) on a floor use the outline perimeter", () => {
    const floor: RoomEntity = {
      id: "floor_01", type: "floor", label: "Floor", parentId: "room_01", childIds: [],
      surfaceKind: "floor", quantifiable: true, geometry: {},
      dimensions: { grossAreaSqFt: 180, netAreaSqFt: 180, perimeterLinFt: 54 },
      confidence: 0.95, source: "demo", calibrationStatus: "calibrated", validationStatus: "verified",
    };
    expect(entitySurfaceQuantity(floor, "linear_ft")).toBe(54);
  });

  it("a wall run (linear_ft) uses the wall length, not a perimeter", () => {
    const w = { ...wall("wall_01", ft(14), ft(8)), dimensions: { lengthIn: ft(14), heightIn: ft(8) } };
    expect(entitySurfaceQuantity(w, "linear_ft")).toBe(14);
  });

  it("paint (gallon) uses the ~350 sq ft/gal assumption, matching baseSurfaceQuantity", () => {
    const w: RoomEntity = {
      ...wall("wall_01", ft(14), ft(8)),
      dimensions: { grossAreaSqFt: 700, netAreaSqFt: 700 },
    };
    expect(entitySurfaceQuantity(w, "gallon")).toBe(2);
  });
});

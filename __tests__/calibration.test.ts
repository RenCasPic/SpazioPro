import { describe, expect, it } from "vitest";
import { solveScale, rescaleGeometry, calibrateModel } from "@/lib/spatial/calibrate";
import { fxRoomWithWindows, fxSimpleRoom } from "@/lib/spatial/fixtures";
import { polygonAreaSqFt } from "@/lib/calculations/surfaces";

describe("scale solving", () => {
  it("one wall confirmation → uniform scale factor", () => {
    const m = fxSimpleRoom(); // 168 × 216 × 96 (raw)
    const wall = m.entities.find((e) => e.type === "wall")!;
    const modelLen = wall.dimensions.lengthIn!;
    const sol = solveScale(m, [
      { entityId: wall.id, kind: "wall_length", valueIn: modelLen * 2 },
    ]);
    expect(sol.factor).toBeCloseTo(2, 3);
    expect(sol.status).toBe("calibrated");
    expect(sol.references).toHaveLength(1);
  });

  it("two disagreeing measurements → partially_calibrated", () => {
    const m = fxRoomWithWindows();
    const [w1, w2] = m.entities.filter((e) => e.type === "wall");
    const sol = solveScale(m, [
      { entityId: w1.id, kind: "wall_length", valueIn: w1.dimensions.lengthIn! * 1.0 },
      { entityId: w2.id, kind: "wall_length", valueIn: w2.dimensions.lengthIn! * 1.4 },
    ]);
    expect(sol.status).toBe("partially_calibrated");
    expect(sol.disagreement).toBeGreaterThan(0.15);
  });

  it("ceiling height is a valid reference", () => {
    const m = fxSimpleRoom();
    const sol = solveScale(m, [
      { entityId: "ceiling_01", kind: "ceiling_height", valueIn: m.ceilingHeightIn * 1.5 },
    ]);
    expect(sol.factor).toBeCloseTo(1.5, 3);
  });
});

describe("rescaleGeometry", () => {
  it("doubling scale quadruples areas, doubles lengths", () => {
    const m = fxRoomWithWindows();
    const floor0 = m.entities.find((e) => e.type === "floor")!.dimensions.grossAreaSqFt!;
    const wall0 = m.entities.find((e) => e.type === "wall")!;
    const r = rescaleGeometry(m, 2);
    const floor1 = r.entities.find((e) => e.type === "floor")!.dimensions.grossAreaSqFt!;
    const wall1 = r.entities.find((e) => e.type === "wall")!;

    expect(floor1).toBeCloseTo(floor0 * 4, 0);
    expect(wall1.dimensions.lengthIn!).toBeCloseTo(wall0.dimensions.lengthIn! * 2, 1);
    expect(r.bounds.widthIn).toBeCloseTo(m.bounds.widthIn * 2, 1);
    expect(r.ceilingHeightIn).toBeCloseTo(m.ceilingHeightIn * 2, 1);
    expect(polygonAreaSqFt(r.floorPolygon)).toBeCloseTo(polygonAreaSqFt(m.floorPolygon) * 4, 0);
  });

  it("does not mutate the input", () => {
    const m = fxSimpleRoom();
    const before = JSON.stringify(m);
    rescaleGeometry(m, 1.7);
    expect(JSON.stringify(m)).toBe(before);
  });

  it("openings scale with the wall", () => {
    const m = fxRoomWithWindows();
    const win0 = m.entities.find((e) => e.type === "window")!;
    const r = rescaleGeometry(m, 1.25);
    const win1 = r.entities.find((e) => e.id === win0.id)!;
    expect(win1.dimensions.widthIn!).toBeCloseTo(win0.dimensions.widthIn! * 1.25, 1);
  });
});

describe("calibrateModel", () => {
  it("produces a calibrated model with the reference recorded and scale cumulative", () => {
    const m = fxSimpleRoom(); // scaleFactor 1
    const wall = m.entities.find((e) => e.type === "wall")!;
    const next = calibrateModel(m, [
      { entityId: wall.id, kind: "wall_length", valueIn: wall.dimensions.lengthIn! * 2 },
    ]);
    expect(next.calibration.status).toBe("calibrated");
    expect(next.calibration.scaleFactor).toBeCloseTo(2, 2);
    expect(next.calibration.references).toHaveLength(1);
    expect(next.entities.every((e) => e.calibrationStatus === "calibrated")).toBe(true);
    // original untouched
    expect(m.calibration.status).toBe("uncalibrated");
  });

  it("a second calibration multiplies the cumulative scale", () => {
    const m = fxSimpleRoom();
    const wall = m.entities.find((e) => e.type === "wall")!;
    const v2 = calibrateModel(m, [{ entityId: wall.id, kind: "wall_length", valueIn: wall.dimensions.lengthIn! * 2 }]);
    const v2wall = v2.entities.find((e) => e.type === "wall")!;
    const v3 = calibrateModel(v2, [{ entityId: v2wall.id, kind: "wall_length", valueIn: v2wall.dimensions.lengthIn! * 1.5 }]);
    expect(v3.calibration.scaleFactor).toBeCloseTo(3, 1); // 1 → 2 → 3
    expect(v3.calibration.references).toHaveLength(2);
  });
});

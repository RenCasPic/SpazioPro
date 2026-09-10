import { describe, expect, it } from "vitest";
import { demoSpatialProvider } from "@/lib/spatial/demo-provider";
import { getSpatialProvider, __resetSpatialProvider } from "@/lib/spatial/provider";
import { buildRectangularRoom } from "@/lib/spatial/room-builder";
import { roomModelSchema } from "@/lib/validations/room-model";
import { fxSimpleRoom, fxRoomWithWindows, fxCalibratedRoom, fxLowConfidenceWindow } from "@/lib/spatial/fixtures";
import { polygonAreaSqFt } from "@/lib/calculations/surfaces";
import { isQuantityReady, entityNeedsReview } from "@/lib/spatial/reconstruction";

const captures = [
  { id: "cap_1", url: "data:,", width: 1024, height: 768 },
  { id: "cap_2", url: "data:,", width: 1024, height: 768 },
  { id: "cap_3", url: "data:,", width: 1024, height: 768 },
];

describe("provider seam", () => {
  it("defaults to the demo provider", () => {
    __resetSpatialProvider();
    const p = getSpatialProvider();
    expect(p.id).toBe("demo");
    expect(p.isDemo).toBe(true);
  });
});

describe("DemoSpatialProvider.reconstruct", () => {
  it("is deterministic — same captures → identical model geometry", async () => {
    const a = await demoSpatialProvider.reconstruct({ projectId: "p", roomId: "r", captures });
    const b = await demoSpatialProvider.reconstruct({ projectId: "p", roomId: "r", captures });
    expect(a.bounds).toEqual(b.bounds);
    expect(a.floorPolygon).toEqual(b.floorPolygon);
    expect(a.entities.map((e) => [e.type, e.dimensions.grossAreaSqFt])).toEqual(
      b.entities.map((e) => [e.type, e.dimensions.grossAreaSqFt]),
    );
  });

  it("emits the documented stage sequence", async () => {
    const stages: string[] = [];
    await demoSpatialProvider.reconstruct({
      projectId: "p",
      roomId: "r",
      captures,
      onStage: (s) => {
        stages.push(s);
      },
    });
    expect(stages).toEqual(["processing", "reconstructing", "segmenting", "building_model", "awaiting_validation"]);
  });

  it("produces a room + floor + ceiling + 4 walls + ≥ 1 opening, all source 'demo'", async () => {
    const m = await demoSpatialProvider.reconstruct({ projectId: "p", roomId: "r", captures, roomTypeHint: "kitchen" });
    const byType = (t: string) => m.entities.filter((e) => e.type === t);
    expect(byType("room")).toHaveLength(1);
    expect(byType("floor")).toHaveLength(1);
    expect(byType("ceiling")).toHaveLength(1);
    expect(byType("wall")).toHaveLength(4);
    expect(byType("window").length + byType("door").length).toBeGreaterThanOrEqual(1);
    expect(m.entities.every((e) => e.source === "demo")).toBe(true);
  });

  it("comes back uncalibrated and awaiting validation", async () => {
    const m = await demoSpatialProvider.reconstruct({ projectId: "p", roomId: "r", captures });
    expect(m.status).toBe("awaiting_validation");
    expect(m.calibration.status).toBe("uncalibrated");
    expect(m.units).toBe("in");
  });

  it("passes the RoomModel Zod schema", async () => {
    const m = await demoSpatialProvider.reconstruct({ projectId: "p", roomId: "r", captures });
    expect(() => roomModelSchema.parse(m)).not.toThrow();
  });

  it("respects a bathroom hint (small, no window)", async () => {
    const m = await demoSpatialProvider.reconstruct({ projectId: "p", roomId: "r", captures, roomTypeHint: "bathroom" });
    expect(m.roomType).toBe("bathroom");
    expect(m.bounds.widthIn).toBe(84);
    expect(m.entities.filter((e) => e.type === "window")).toHaveLength(0);
  });
});

describe("buildRectangularRoom geometry", () => {
  it("floor area matches width × length", () => {
    const m = buildRectangularRoom({ projectId: "p", roomId: "r", widthIn: 168, lengthIn: 216, heightIn: 96 });
    const floor = m.entities.find((e) => e.type === "floor")!;
    expect(floor.dimensions.grossAreaSqFt).toBe(252); // 14 × 18
    expect(polygonAreaSqFt(m.floorPolygon)).toBe(252);
  });

  it("each wall area matches its run × height, openings subtracted", () => {
    const m = fxRoomWithWindows();
    const walls = m.entities.filter((e) => e.type === "wall");
    expect(walls).toHaveLength(4);
    // wall_01 is 14 ft × 8 ft = 112 gross; it hosts a 48×48 (16 sq ft) window
    const w1 = walls[0];
    expect(w1.dimensions.grossAreaSqFt).toBe(112);
    expect(w1.dimensions.netAreaSqFt).toBe(96);
  });

  it("wall normals point inward", () => {
    const m = buildRectangularRoom({ projectId: "p", roomId: "r", widthIn: 120, lengthIn: 120, heightIn: 96 });
    const w1 = m.entities.find((e) => e.id === "wall_01")!;
    expect(w1.geometry.plane!.normal.z).toBeCloseTo(1, 5); // front wall faces +z
  });
});

describe("fixtures", () => {
  it("simple room: uncalibrated, nothing quantity-ready", () => {
    const m = fxSimpleRoom();
    expect(m.entities.filter((e) => e.quantifiable).every((e) => !isQuantityReady(e))).toBe(true);
  });

  it("calibrated room: every quantifiable surface is quantity-ready", () => {
    const m = fxCalibratedRoom();
    expect(m.entities.filter((e) => e.quantifiable).every((e) => isQuantityReady(e))).toBe(true);
  });

  it("low-confidence window is flagged for verification", () => {
    const m = fxLowConfidenceWindow();
    const win = m.entities.find((e) => e.type === "window")!;
    expect(win.validationStatus).toBe("needs_verification");
    expect(entityNeedsReview(win)).toBe(true);
  });
});

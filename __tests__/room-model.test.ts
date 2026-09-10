import { describe, expect, it } from "vitest";
import {
  CONFIDENCE,
  confidenceBand,
  entityNeedsReview,
  isQuantityReady,
  effectiveSurfaceConfidence,
  canTransition,
  assertTransition,
  isTerminal,
  RECONSTRUCTION_STAGES,
} from "@/lib/spatial/reconstruction";
import { roomModelSchema, roomModelEditSchema } from "@/lib/validations/room-model";
import type { RoomEntity } from "@/types";

function entity(over: Partial<RoomEntity> = {}): RoomEntity {
  return {
    id: "wall_01",
    type: "wall",
    label: "Wall",
    parentId: "room_01",
    childIds: [],
    surfaceKind: "wall",
    quantifiable: true,
    geometry: {},
    dimensions: { grossAreaSqFt: 100, netAreaSqFt: 100 },
    confidence: 0.95,
    source: "demo",
    calibrationStatus: "calibrated",
    validationStatus: "verified",
    ...over,
  };
}

describe("confidence thresholds — centralized", () => {
  it("bands split at the documented thresholds", () => {
    expect(confidenceBand(0.95)).toBe("auto_accepted");
    expect(confidenceBand(CONFIDENCE.autoAccept)).toBe("auto_accepted");
    expect(confidenceBand(0.8)).toBe("verify_recommended");
    expect(confidenceBand(0.5)).toBe("verification_required");
  });

  it("a low-confidence window needs review", () => {
    expect(entityNeedsReview({ confidence: 0.71, validationStatus: "unverified" })).toBe(true);
    expect(entityNeedsReview({ confidence: 0.71, validationStatus: "verified" })).toBe(false);
  });
});

describe("quantity-readiness — confidence is never enough on its own", () => {
  it("confidence 0.98 + uncalibrated → NOT quantity-ready", () => {
    expect(isQuantityReady(entity({ confidence: 0.98, calibrationStatus: "uncalibrated" }))).toBe(false);
  });

  it("calibrated + verified → ready", () => {
    expect(isQuantityReady(entity({ calibrationStatus: "calibrated", validationStatus: "verified" }))).toBe(true);
  });

  it("calibrated + high confidence but unverified → ready (auto-accepted)", () => {
    expect(isQuantityReady(entity({ confidence: 0.93, validationStatus: "unverified" }))).toBe(true);
  });

  it("calibrated + mid confidence + unverified → not ready", () => {
    expect(isQuantityReady(entity({ confidence: 0.8, validationStatus: "unverified" }))).toBe(false);
  });

  it("furniture is never quantity-ready", () => {
    expect(isQuantityReady(entity({ type: "furniture", quantifiable: false }))).toBe(false);
  });

  it("uncalibrated geometry drags the effective confidence down", () => {
    expect(effectiveSurfaceConfidence({ confidence: 0.98, calibrationStatus: "uncalibrated" })).toBeLessThan(0.5);
    expect(effectiveSurfaceConfidence({ confidence: 0.98, calibrationStatus: "calibrated" })).toBe(0.98);
  });
});

describe("status state machine", () => {
  it("allows only the documented transitions", () => {
    expect(canTransition("uploaded", "processing")).toBe(true);
    expect(canTransition("building_model", "awaiting_validation")).toBe(true);
    expect(canTransition("awaiting_validation", "ready")).toBe(true);
    expect(canTransition("ready", "awaiting_validation")).toBe(true); // re-open for calibration
    expect(canTransition("failed", "processing")).toBe(true); // retry
  });

  it("rejects impossible jumps", () => {
    expect(canTransition("uploaded", "ready")).toBe(false);
    expect(canTransition("failed", "ready")).toBe(false);
    expect(canTransition("ready", "failed")).toBe(false);
    expect(() => assertTransition("uploaded", "ready")).toThrow(/transition/i);
  });

  it("ready and failed are terminal-ish", () => {
    expect(isTerminal("ready")).toBe(true);
    expect(isTerminal("failed")).toBe(true);
    expect(isTerminal("segmenting")).toBe(false);
  });

  it("the happy path is ordered", () => {
    for (let i = 0; i < RECONSTRUCTION_STAGES.length - 1; i++) {
      expect(canTransition(RECONSTRUCTION_STAGES[i], RECONSTRUCTION_STAGES[i + 1])).toBe(true);
    }
  });
});

describe("RoomModel schema", () => {
  const base = {
    id: "rm_1",
    projectId: "prj_1",
    roomId: "room_1",
    version: 1,
    supersedesId: null,
    schemaVersion: 1 as const,
    source: "demo" as const,
    captureSource: "demo" as const,
    status: "ready" as const,
    calibration: {
      status: "calibrated" as const,
      scaleFactor: 1,
      scaleConfidence: 0.9,
      references: [],
      updatedAt: "2026-01-01T00:00:00.000Z",
    },
    units: "in" as const,
    bounds: { widthIn: 168, lengthIn: 216, heightIn: 96 },
    floorPolygon: [
      { x: 0, z: 0 },
      { x: 168, z: 0 },
      { x: 168, z: 216 },
      { x: 0, z: 216 },
    ],
    ceilingHeightIn: 96,
    entities: [],
    confidence: 0.85,
    roomType: "kitchen" as const,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };

  it("accepts a valid model and round-trips JSON", () => {
    const parsed = roomModelSchema.parse(base);
    expect(JSON.parse(JSON.stringify(parsed))).toEqual(base);
  });

  it("rejects a non-inch unit system", () => {
    expect(() => roomModelSchema.parse({ ...base, units: "cm" })).toThrow();
  });

  it("rejects a degenerate floor polygon", () => {
    expect(() => roomModelSchema.parse({ ...base, floorPolygon: [{ x: 0, z: 0 }] })).toThrow();
  });

  it("rejects confidence outside 0..1", () => {
    expect(() => roomModelSchema.parse({ ...base, confidence: 1.5 })).toThrow();
  });
});

describe("edit-op schema — small, closed vocabulary (not a CAD)", () => {
  it("accepts the known ops", () => {
    expect(roomModelEditSchema.parse({ op: "set_ceiling_height", heightIn: 108 }).op).toBe("set_ceiling_height");
    expect(roomModelEditSchema.parse({ op: "mark_reviewed", entityId: "wall_02" }).op).toBe("mark_reviewed");
  });

  it("rejects an unknown op", () => {
    expect(() => roomModelEditSchema.parse({ op: "delete_wall", wallId: "w1" })).toThrow();
  });

  it("range-checks a ceiling height", () => {
    expect(() => roomModelEditSchema.parse({ op: "set_ceiling_height", heightIn: 5000 })).toThrow();
  });
});

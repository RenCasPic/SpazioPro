/**
 * Scale calibration — pure geometry. A monocular reconstruction has relative
 * scale; the user (or a device) confirms 1–3 real measurements and the whole
 * model is rescaled. Never mutates the input — returns a fresh, rescaled model
 * that the service persists as a NEW version. See §16–17.
 */

import type {
  CalibrationStatus,
  MeasurementKind,
  ReferenceMeasurement,
  RoomEntity,
  RoomModel,
} from "@/types";
import { computeEntityDimensions } from "@/lib/calculations/surfaces";
import { round } from "@/lib/calculations/money";
import { uid } from "@/lib/utils";

export interface MeasurementInput {
  entityId: string;
  kind: MeasurementKind;
  valueIn: number;
}

/** What the model currently believes a given measurement to be. */
export function modelMeasuredValue(model: RoomModel, m: MeasurementInput): number | null {
  const entity = model.entities.find((e) => e.id === m.entityId);
  switch (m.kind) {
    case "ceiling_height":
      return model.ceilingHeightIn;
    case "room_width":
      return model.bounds.widthIn;
    case "room_length":
      return model.bounds.lengthIn;
    case "wall_length":
      return entity?.dimensions.lengthIn ?? null;
    case "opening_width":
      return entity?.dimensions.widthIn ?? null;
    case "opening_height":
    case "door_height":
      return entity?.dimensions.heightIn ?? null;
    default:
      return null;
  }
}

export interface ScaleSolution {
  /** multiplier to apply to the CURRENT geometry */
  factor: number;
  status: CalibrationStatus;
  /** 0..1 */
  scaleConfidence: number;
  /** spread between the implied scales, 0 = perfect agreement */
  disagreement: number;
  references: ReferenceMeasurement[];
}

/** Disagreement above this (15%) means the axes scale differently → partial. */
const DISAGREEMENT_LIMIT = 0.15;

export function solveScale(model: RoomModel, measurements: MeasurementInput[]): ScaleSolution {
  const now = new Date().toISOString();
  const implied: number[] = [];
  const references: ReferenceMeasurement[] = [];

  for (const m of measurements) {
    const current = modelMeasuredValue(model, m);
    if (!current || current <= 0) continue;
    implied.push(m.valueIn / current);
    references.push({
      id: uid("ref"),
      entityId: m.entityId,
      kind: m.kind,
      originalValueIn: round(current),
      confirmedValueIn: m.valueIn,
      source: "user",
      createdAt: now,
    });
  }

  if (implied.length === 0) {
    return { factor: 1, status: model.calibration.status, scaleConfidence: model.calibration.scaleConfidence, disagreement: 0, references: [] };
  }

  const factor = implied.reduce((a, b) => a + b, 0) / implied.length;
  const disagreement =
    implied.length > 1 ? (Math.max(...implied) - Math.min(...implied)) / factor : 0;

  const status: CalibrationStatus =
    disagreement > DISAGREEMENT_LIMIT ? "partially_calibrated" : "calibrated";
  const scaleConfidence =
    status === "calibrated" ? (implied.length >= 2 ? 0.95 : 0.85) : 0.7;

  return { factor: round(factor, 4), status, scaleConfidence, disagreement: round(disagreement, 3), references };
}

/** Return a new model with all geometry multiplied by `factor`. */
export function rescaleGeometry(model: RoomModel, factor: number): RoomModel {
  if (!Number.isFinite(factor) || factor <= 0) return model;
  const s = (n: number) => round(n * factor, 3);

  const entities: RoomEntity[] = model.entities.map((e) => {
    const g = { ...e.geometry };
    if (g.polygon) g.polygon = g.polygon.map((p) => ({ u: s(p.u), v: s(p.v) }));
    if (g.position) g.position = { x: s(g.position.x), y: s(g.position.y), z: s(g.position.z) };
    if (g.plane) g.plane = { ...g.plane, offsetIn: s(g.plane.offsetIn) };
    return { ...e, geometry: g };
  });

  // recompute cached dimensions against the rescaled geometry
  const openings = entities.filter((e) => e.type === "window" || e.type === "door" || e.type === "opening");
  for (const e of entities) {
    if (e.type === "window" || e.type === "door" || e.type === "opening") {
      e.dimensions = {
        widthIn: s(e.dimensions.widthIn ?? 0),
        heightIn: s(e.dimensions.heightIn ?? 0),
        grossAreaSqFt: round(((e.dimensions.widthIn ?? 0) * factor * ((e.dimensions.heightIn ?? 0) * factor)) / 144),
      };
    } else {
      e.dimensions = computeEntityDimensions(e, openings);
    }
  }

  return {
    ...model,
    entities,
    floorPolygon: model.floorPolygon.map((p) => ({ x: s(p.x), z: s(p.z) })),
    ceilingHeightIn: s(model.ceilingHeightIn),
    bounds: {
      widthIn: s(model.bounds.widthIn),
      lengthIn: s(model.bounds.lengthIn),
      heightIn: s(model.bounds.heightIn),
    },
  };
}

/**
 * Apply confirmed measurements to a model. Returns a *new* model object (the
 * caller persists it as version N+1 with supersedesId set).
 */
export function calibrateModel(model: RoomModel, measurements: MeasurementInput[]): RoomModel {
  const solution = solveScale(model, measurements);
  const rescaled = rescaleGeometry(model, solution.factor);
  const now = new Date().toISOString();

  const entities = rescaled.entities.map((e) => ({
    ...e,
    calibrationStatus: solution.status,
  }));

  return {
    ...rescaled,
    entities,
    calibration: {
      status: solution.status,
      scaleFactor: round(model.calibration.scaleFactor * solution.factor, 5),
      scaleConfidence: solution.scaleConfidence,
      references: [...model.calibration.references, ...solution.references],
      updatedAt: now,
    },
    updatedAt: now,
  };
}

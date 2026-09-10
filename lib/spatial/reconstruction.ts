/**
 * Reconstruction domain rules — the SINGLE source of truth for:
 *   - confidence thresholds (never hardcode these in components)
 *   - the room-model status state machine
 *   - whether a surface is allowed to feed the quantity engine
 *
 * See docs/3d-room-reconstruction.md §18–19.
 */

import type {
  CalibrationStatus,
  RoomEntity,
  RoomModel,
  RoomModelStatus,
  ValidationStatus,
} from "@/types";

// ---------------------------------------------------------------------------
// Confidence thresholds
// ---------------------------------------------------------------------------

export const CONFIDENCE = {
  /** ≥ this → accepted automatically */
  autoAccept: 0.9,
  /** ≥ this (and < autoAccept) → verification recommended */
  verifyRecommended: 0.75,
  /** below verifyRecommended → verification required */
} as const;

export type ConfidenceBand = "auto_accepted" | "verify_recommended" | "verification_required";

export function confidenceBand(confidence: number): ConfidenceBand {
  if (confidence >= CONFIDENCE.autoAccept) return "auto_accepted";
  if (confidence >= CONFIDENCE.verifyRecommended) return "verify_recommended";
  return "verification_required";
}

/** Does this entity still need a human to look at it before its numbers are trusted? */
export function entityNeedsReview(
  entity: Pick<RoomEntity, "confidence" | "validationStatus">,
): boolean {
  if (entity.validationStatus === "verified") return false;
  return confidenceBand(entity.confidence) !== "auto_accepted";
}

/**
 * A surface may drive quantities only when it is calibrated AND either verified
 * or high-confidence. Confidence alone is never enough:
 *   confidence 0.98 + calibrationStatus "uncalibrated"  →  NOT quantity-ready.
 */
export function isQuantityReady(
  entity: Pick<
    RoomEntity,
    "quantifiable" | "confidence" | "calibrationStatus" | "validationStatus"
  >,
): boolean {
  if (!entity.quantifiable) return false;
  if (entity.calibrationStatus === "uncalibrated") return false;
  if (entity.validationStatus === "verified") return true;
  return (
    entity.calibrationStatus === "calibrated" &&
    confidenceBand(entity.confidence) === "auto_accepted"
  );
}

/** Combine an entity's confidence with model-level calibration for display. */
export function effectiveSurfaceConfidence(
  entity: Pick<RoomEntity, "confidence" | "calibrationStatus">,
): number {
  const penalty: Record<CalibrationStatus, number> = {
    uncalibrated: 0.4,
    partially_calibrated: 0.85,
    calibrated: 1,
  };
  return Math.max(0, Math.min(1, entity.confidence * penalty[entity.calibrationStatus]));
}

// ---------------------------------------------------------------------------
// Status state machine (§19)
// ---------------------------------------------------------------------------

const TRANSITIONS: Record<RoomModelStatus, readonly RoomModelStatus[]> = {
  uploaded: ["processing", "failed"],
  processing: ["reconstructing", "failed"],
  reconstructing: ["segmenting", "failed"],
  segmenting: ["building_model", "failed"],
  building_model: ["awaiting_validation", "ready", "failed"],
  awaiting_validation: ["ready", "building_model", "failed"],
  ready: ["awaiting_validation"], // re-open for a fresh calibration / edit pass
  failed: ["processing"], // retry
};

/** The ordered "happy path" — used to render staged progress in the UI. */
export const RECONSTRUCTION_STAGES: readonly RoomModelStatus[] = [
  "uploaded",
  "processing",
  "reconstructing",
  "segmenting",
  "building_model",
  "awaiting_validation",
  "ready",
];

export function canTransition(from: RoomModelStatus, to: RoomModelStatus): boolean {
  if (from === to) return true;
  return TRANSITIONS[from]?.includes(to) ?? false;
}

export function assertTransition(from: RoomModelStatus, to: RoomModelStatus): void {
  if (!canTransition(from, to)) {
    throw new Error(`Invalid room-model transition: ${from} → ${to}`);
  }
}

export function isTerminal(status: RoomModelStatus): boolean {
  return status === "ready" || status === "failed";
}

// ---------------------------------------------------------------------------
// Model-level helpers
// ---------------------------------------------------------------------------

export function modelEntitiesNeedingReview(model: RoomModel): RoomEntity[] {
  return model.entities.filter((e) => e.quantifiable && entityNeedsReview(e));
}

/** The model is safe to base a *final* estimate on. */
export function modelIsEstimateReady(model: RoomModel): boolean {
  if (model.status !== "ready" && model.status !== "awaiting_validation") return false;
  if (model.calibration.status === "uncalibrated") return false;
  return model.entities
    .filter((e) => e.quantifiable)
    .every((e) => isQuantityReady(e));
}

/** i18n key suffixes for reason codes fed into confidenceReport(). */
export function modelConfidenceReasons(model: RoomModel): string[] {
  const reasons: string[] = [];
  if (model.calibration.status === "uncalibrated") reasons.push("uncalibrated_model");
  else if (model.calibration.status === "partially_calibrated") reasons.push("partial_calibration");
  if (model.source === "demo") reasons.push("demo_model");
  if (model.source === "inferred" || model.source === "manual") reasons.push("manual_geometry");
  if (modelEntitiesNeedingReview(model).length > 0) reasons.push("unreviewed_geometry");
  return reasons;
}

export const VALIDATION_ORDER: readonly ValidationStatus[] = [
  "unverified",
  "needs_verification",
  "verified",
];

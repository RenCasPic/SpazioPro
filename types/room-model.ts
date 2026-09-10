/**
 * Semantic 3D Room Model — the canonical, measurable representation of an
 * interior space. See docs/3d-room-reconstruction.md.
 *
 * Four layers, kept separate:
 *   A. visual reconstruction  → not stored here (Storage: meshes, depth, poses)
 *   B. architectural geometry → this file (planes, polygons, parametric surfaces)
 *   C. semantic model         → this file (what each geometry *is*)
 *   D. quantification         → lib/calculations/surfaces.ts bridges to the
 *                               EXISTING quantity / market / estimate engines
 *
 * Commercial data (price, supplier, tax, labor) NEVER lives on an entity.
 * Units are ALWAYS inches for length, sq ft for area, linear ft for runs —
 * identical to RoomDimensions / lib/calculations. There is no second system.
 */

import type { ProjectType } from "./project";

/**
 * Structurally identical to `SurfaceKind` in lib/constants — duplicated here so
 * the `types/` layer never imports from `lib/` (avoids a dependency cycle).
 */
export type RoomSurfaceKind = "floor" | "wall" | "ceiling";

// ---------------------------------------------------------------------------
// Geometry primitives — room-local frame, right-handed, Y up, floor at y = 0.
// ---------------------------------------------------------------------------

/** A point on the floor plane. Inches. */
export interface Vec2 {
  x: number;
  z: number;
}

/** A point in room space. Inches. */
export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface Plane {
  /** unit normal */
  normal: Vec3;
  /** signed distance from the origin along the normal, inches */
  offsetIn: number;
}

/** A rectangular hole in a wall, in the wall's local (u = along, v = up) frame. */
export interface OpeningRect {
  /** distance from the wall's start corner to the opening's left edge, inches */
  uIn: number;
  /** distance from the floor to the opening's bottom edge, inches */
  vIn: number;
  widthIn: number;
  heightIn: number;
}

// ---------------------------------------------------------------------------
// Entities
// ---------------------------------------------------------------------------

export type RoomEntityType =
  | "room"
  | "floor"
  | "ceiling"
  | "wall"
  | "door"
  | "window"
  | "opening"
  | "column"
  | "stair"
  | "niche"
  | "furniture"
  | "appliance"
  | "object";

/** Types that describe the building itself. */
export const ARCHITECTURAL_TYPES: readonly RoomEntityType[] = [
  "room",
  "floor",
  "ceiling",
  "wall",
  "door",
  "window",
  "opening",
  "column",
  "stair",
  "niche",
];

/** Types that must never be treated as a quantifiable surface. */
export const MOVABLE_TYPES: readonly RoomEntityType[] = ["furniture", "appliance", "object"];

/** How the geometry for an entity (or a whole model) was obtained. */
export type SpatialSource =
  | "demo"
  | "photo"
  | "video"
  | "mobile_depth"
  | "lidar"
  | "arkit"
  | "arcore"
  | "manual"
  | "inferred";

/** Where the raw capture came from — set once at reconstruction time. */
export type CaptureSource =
  | "photo"
  | "video"
  | "mobile_depth"
  | "lidar"
  | "arkit"
  | "arcore"
  | "manual"
  | "demo";

export type CalibrationStatus = "uncalibrated" | "partially_calibrated" | "calibrated";

export type ValidationStatus = "unverified" | "needs_verification" | "verified";

/** Cached, derived measurements. Recomputed by lib/calculations/surfaces.ts. */
export interface EntityDimensions {
  lengthIn?: number;
  heightIn?: number;
  widthIn?: number;
  thicknessIn?: number;
  /** floor / ceiling elevation from y = 0, inches */
  elevationIn?: number;
  /** face area before openings, sq ft */
  grossAreaSqFt?: number;
  /** gross area minus openings, sq ft */
  netAreaSqFt?: number;
  /** run length, linear ft (walls) or outline perimeter (floor / ceiling) */
  perimeterLinFt?: number;
}

export interface RoomEntity {
  id: string;
  type: RoomEntityType;
  /** i18n-independent human label, e.g. "Left wall", "Window over sink" */
  label: string;
  parentId: string | null;
  childIds: string[];

  /** the existing surface enum — set only for quantifiable architectural faces */
  surfaceKind?: RoomSurfaceKind;
  /** whether this entity's geometry feeds the quantity engine */
  quantifiable: boolean;

  geometry: {
    /** supporting plane for walls / floor / ceiling */
    plane?: Plane;
    /** outline in the plane's local 2D frame (u along, v up), inches, ordered CCW */
    polygon?: Array<{ u: number; v: number }>;
    /** placement for openings / objects, room-local, inches */
    position?: Vec3;
    rotationDeg?: number;
  };

  dimensions: EntityDimensions;
  /** child ids (windows / doors) subtracted from a wall's net area */
  openingIds?: string[];

  /** 0..1 — reconstruction confidence for THIS entity */
  confidence: number;
  source: SpatialSource;
  calibrationStatus: CalibrationStatus;
  validationStatus: ValidationStatus;
}

// ---------------------------------------------------------------------------
// Calibration — never destroy the previous model; a recalibration makes a new
// RoomModel version (see RoomModel.version / supersedesId).
// ---------------------------------------------------------------------------

export type MeasurementKind =
  | "wall_length"
  | "room_width"
  | "room_length"
  | "ceiling_height"
  | "opening_width"
  | "opening_height"
  | "door_height";

export interface ReferenceMeasurement {
  id: string;
  entityId: string;
  kind: MeasurementKind;
  /** what the model reported before this measurement, inches */
  originalValueIn: number;
  /** what the user / device confirmed, inches */
  confirmedValueIn: number;
  source: "user" | "auto_prior" | "device";
  createdAt: string;
}

export interface CalibrationState {
  status: CalibrationStatus;
  /** global multiplier applied to the raw reconstruction geometry */
  scaleFactor: number;
  /** 0..1 — confidence in the absolute scale */
  scaleConfidence: number;
  references: ReferenceMeasurement[];
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// The model
// ---------------------------------------------------------------------------

export type RoomModelStatus =
  | "uploaded"
  | "processing"
  | "reconstructing"
  | "segmenting"
  | "building_model"
  | "awaiting_validation"
  | "ready"
  | "failed";

export interface RoomModel {
  id: string;
  projectId: string;
  /** FK → Room.id — the contract with the rest of the app */
  roomId: string;

  /** 1, 2, 3 … a new version per calibration or geometry edit */
  version: number;
  /** id of the version this one replaces, or null for v1 */
  supersedesId: string | null;
  schemaVersion: 1;

  source: SpatialSource;
  captureSource: CaptureSource;
  status: RoomModelStatus;

  calibration: CalibrationState;
  units: "in";

  /** axis-aligned bounds — mirrors RoomDimensions, written back to the Room row */
  bounds: { widthIn: number; lengthIn: number; heightIn: number };
  /** ordered CCW, inches, room-local */
  floorPolygon: Vec2[];
  ceilingHeightIn: number;

  entities: RoomEntity[];

  /** 0..1 — aggregate model confidence */
  confidence: number;
  /** room type as understood by the semantic layer (may differ from Project.projectType) */
  roomType: ProjectType | null;

  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Reconstruction job — async-friendly. Demo runs uploaded → ready immediately.
// ---------------------------------------------------------------------------

export interface ReconstructionJob {
  id: string;
  projectId: string;
  roomId: string;
  roomModelId: string | null;
  provider: string;
  status: RoomModelStatus;
  /** i18n key suffix for the current user-facing stage message */
  stage: string | null;
  captureIds: string[];
  imageCount: number;
  error: string | null;
  errorCode: string | null;
  startedAt: string;
  completedAt: string | null;
  durationMs: number | null;
}

// ---------------------------------------------------------------------------
// Capture
// ---------------------------------------------------------------------------

export interface RoomCapture {
  id: string;
  projectId: string;
  roomModelId: string | null;
  kind: "photo" | "frame";
  /** Storage path (real) or data URL (demo) */
  url: string;
  width: number;
  height: number;
  ordinal: number;
  createdAt: string;
}

import { z } from "zod";

/**
 * Centralized Zod schemas for the Semantic 3D Room Model. Shared by the API
 * routes, the services and the tests — no duplicated schemas elsewhere.
 * See docs/3d-room-reconstruction.md §22.
 */

// ---- primitives ----
export const vec2Schema = z.object({ x: z.number(), z: z.number() });
export const vec3Schema = z.object({ x: z.number(), y: z.number(), z: z.number() });
export const planeSchema = z.object({ normal: vec3Schema, offsetIn: z.number() });

export const roomEntityTypeSchema = z.enum([
  "room", "floor", "ceiling", "wall",
  "door", "window", "opening",
  "column", "stair", "niche",
  "furniture", "appliance", "object",
]);

export const spatialSourceSchema = z.enum([
  "demo", "photo", "video", "mobile_depth", "lidar", "arkit", "arcore", "manual", "inferred",
]);

export const captureSourceSchema = z.enum([
  "photo", "video", "mobile_depth", "lidar", "arkit", "arcore", "manual", "demo",
]);

export const calibrationStatusSchema = z.enum([
  "uncalibrated", "partially_calibrated", "calibrated",
]);

export const validationStatusSchema = z.enum([
  "unverified", "needs_verification", "verified",
]);

export const roomModelStatusSchema = z.enum([
  "uploaded", "processing", "reconstructing", "segmenting",
  "building_model", "awaiting_validation", "ready", "failed",
]);

export const measurementKindSchema = z.enum([
  "wall_length", "room_width", "room_length", "ceiling_height",
  "opening_width", "opening_height", "door_height",
]);

// A sane range for any interior measurement, in inches: 1 in … 100 ft.
const measurementInches = z.number().positive().min(1).max(1200);

export const entityDimensionsSchema = z.object({
  lengthIn: z.number().nonnegative().optional(),
  heightIn: z.number().nonnegative().optional(),
  widthIn: z.number().nonnegative().optional(),
  thicknessIn: z.number().nonnegative().optional(),
  elevationIn: z.number().optional(),
  grossAreaSqFt: z.number().nonnegative().optional(),
  netAreaSqFt: z.number().nonnegative().optional(),
  perimeterLinFt: z.number().nonnegative().optional(),
});

export const roomEntitySchema = z.object({
  id: z.string().min(1),
  type: roomEntityTypeSchema,
  label: z.string(),
  parentId: z.string().nullable(),
  childIds: z.array(z.string()),
  surfaceKind: z.enum(["floor", "wall", "ceiling"]).optional(),
  quantifiable: z.boolean(),
  geometry: z.object({
    plane: planeSchema.optional(),
    polygon: z.array(z.object({ u: z.number(), v: z.number() })).optional(),
    position: vec3Schema.optional(),
    rotationDeg: z.number().optional(),
  }),
  dimensions: entityDimensionsSchema,
  openingIds: z.array(z.string()).optional(),
  confidence: z.number().min(0).max(1),
  source: spatialSourceSchema,
  calibrationStatus: calibrationStatusSchema,
  validationStatus: validationStatusSchema,
});

export const referenceMeasurementSchema = z.object({
  id: z.string(),
  entityId: z.string(),
  kind: measurementKindSchema,
  originalValueIn: z.number().nonnegative(),
  confirmedValueIn: measurementInches,
  source: z.enum(["user", "auto_prior", "device"]),
  createdAt: z.string(),
});

export const calibrationStateSchema = z.object({
  status: calibrationStatusSchema,
  scaleFactor: z.number().positive(),
  scaleConfidence: z.number().min(0).max(1),
  references: z.array(referenceMeasurementSchema),
  updatedAt: z.string(),
});

export const roomModelSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  roomId: z.string(),
  version: z.number().int().positive(),
  supersedesId: z.string().nullable(),
  schemaVersion: z.literal(1),
  source: spatialSourceSchema,
  captureSource: captureSourceSchema,
  status: roomModelStatusSchema,
  calibration: calibrationStateSchema,
  units: z.literal("in"),
  bounds: z.object({
    widthIn: z.number().positive(),
    lengthIn: z.number().positive(),
    heightIn: z.number().positive(),
  }),
  floorPolygon: z.array(vec2Schema).min(3),
  ceilingHeightIn: z.number().positive(),
  entities: z.array(roomEntitySchema),
  confidence: z.number().min(0).max(1),
  roomType: z
    .enum([
      "living_room", "bedroom", "kitchen", "bathroom", "office",
      "commercial", "terrace", "exterior", "whole_home", "other",
    ])
    .nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// ---------------------------------------------------------------------------
// API request bodies
// ---------------------------------------------------------------------------

export const reconstructRequestSchema = z.object({
  captureIds: z.array(z.string()).min(1).max(30),
  roomTypeHint: z
    .enum([
      "living_room", "bedroom", "kitchen", "bathroom", "office",
      "commercial", "terrace", "exterior", "whole_home", "other",
    ])
    .optional(),
});

export const captureUploadSchema = z.object({
  captures: z
    .array(
      z.object({
        /** demo mode passes a data URL directly; real mode passes a storage path */
        url: z.string().min(1),
        width: z.number().int().positive(),
        height: z.number().int().positive(),
      }),
    )
    .min(1)
    .max(30),
});

export const calibrateRequestSchema = z.object({
  measurements: z
    .array(
      z.object({
        entityId: z.string(),
        kind: measurementKindSchema,
        valueIn: measurementInches,
      }),
    )
    .min(1)
    .max(6),
});

/** Deliberately small edit vocabulary — this is NOT a CAD (§37). */
export const roomModelEditSchema = z.discriminatedUnion("op", [
  z.object({ op: z.literal("move_wall"), wallId: z.string(), offsetIn: z.number().min(-600).max(600) }),
  z.object({ op: z.literal("set_ceiling_height"), heightIn: measurementInches }),
  z.object({
    op: z.literal("add_opening"),
    wallId: z.string(),
    kind: z.enum(["window", "door"]),
    rect: z.object({
      uIn: z.number().nonnegative(),
      vIn: z.number().nonnegative(),
      widthIn: z.number().positive().max(600),
      heightIn: z.number().positive().max(240),
    }),
  }),
  z.object({
    op: z.literal("update_opening"),
    openingId: z.string(),
    rect: z.object({
      uIn: z.number().nonnegative().optional(),
      vIn: z.number().nonnegative().optional(),
      widthIn: z.number().positive().max(600).optional(),
      heightIn: z.number().positive().max(240).optional(),
    }),
  }),
  z.object({ op: z.literal("remove_opening"), openingId: z.string() }),
  z.object({
    op: z.literal("override_dimension"),
    entityId: z.string(),
    field: z.enum(["lengthIn", "heightIn", "widthIn"]),
    valueIn: measurementInches,
  }),
  z.object({ op: z.literal("mark_reviewed"), entityId: z.string() }),
]);

export const materialAssignmentSchema = z.object({
  roomEntityId: z.string(),
  productId: z.string(),
});

export type ReconstructRequest = z.infer<typeof reconstructRequestSchema>;
export type CalibrateRequest = z.infer<typeof calibrateRequestSchema>;
export type RoomModelEdit = z.infer<typeof roomModelEditSchema>;

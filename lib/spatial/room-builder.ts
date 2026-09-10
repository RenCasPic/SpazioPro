/**
 * Parametric room construction. Turns a small set of numbers (bounds +
 * openings) into a full Semantic 3D Room Model. Shared by:
 *   - DemoSpatialProvider (offline, deterministic)
 *   - the guided manual fallback (§37)
 *   - tests
 *
 * One code path for "make a box room" — see docs/3d-room-reconstruction.md §33.
 */

import type {
  CalibrationStatus,
  CaptureSource,
  ProjectType,
  RoomEntity,
  RoomModel,
  RoomModelStatus,
  SpatialSource,
  Vec2,
} from "@/types";
import { computeEntityDimensions } from "@/lib/calculations/surfaces";
import { uid } from "@/lib/utils";

const IN_PER_FT = 12;

export interface OpeningSpec {
  /** index into the wall list (0 = first floor edge) */
  wallIndex: number;
  kind: "window" | "door";
  widthIn: number;
  heightIn: number;
  /** offset from the wall's start corner to the opening's left edge */
  uIn: number;
  /** sill height from the floor (0 for a door) */
  vIn: number;
  confidence?: number;
}

export interface BuildRoomInput {
  projectId: string;
  roomId: string;
  widthIn: number;
  lengthIn: number;
  heightIn: number;
  openings?: OpeningSpec[];
  roomType?: ProjectType | null;
  source?: SpatialSource;
  captureSource?: CaptureSource;
  status?: RoomModelStatus;
  calibrationStatus?: CalibrationStatus;
  /** aggregate model confidence; per-entity defaults derive from it */
  confidence?: number;
  scaleFactor?: number;
  supersedesId?: string | null;
  version?: number;
}

/** Rectangular room: floor, ceiling, 4 walls, plus any openings. */
export function buildRectangularRoom(input: BuildRoomInput): RoomModel {
  const {
    projectId,
    roomId,
    widthIn: W,
    lengthIn: L,
    heightIn: H,
    openings = [],
    roomType = null,
    source = "demo",
    captureSource = "demo",
    status = "awaiting_validation",
    calibrationStatus = "uncalibrated",
    confidence = 0.82,
    scaleFactor = 1,
    supersedesId = null,
    version = 1,
  } = input;

  const now = new Date().toISOString();
  const floorPolygon: Vec2[] = [
    { x: 0, z: 0 },
    { x: W, z: 0 },
    { x: W, z: L },
    { x: 0, z: L },
  ];

  const roomEntity: RoomEntity = {
    id: "room_01",
    type: "room",
    label: roomLabel(roomType),
    parentId: null,
    childIds: [],
    quantifiable: false,
    geometry: {},
    dimensions: {},
    confidence,
    source,
    calibrationStatus,
    validationStatus: "unverified",
  };

  const floor = surface("floor_01", "floor", "floor", "Floor", floorPolygon, 0, confidence, source, calibrationStatus);
  const ceiling = surface("ceiling_01", "ceiling", "ceiling", "Ceiling", floorPolygon, H, confidence, source, calibrationStatus);

  // walls, one per floor edge, wound CCW
  const wallLabels = ["Front wall", "Right wall", "Back wall", "Left wall"];
  const walls: RoomEntity[] = floorPolygon.map((a, i) => {
    const b = floorPolygon[(i + 1) % floorPolygon.length];
    const lengthIn = Math.hypot(b.x - a.x, b.z - a.z);
    const id = `wall_0${i + 1}`;
    const wallConf = clamp(confidence + (i === 0 ? 0.06 : -0.02 * i));
    return {
      id,
      type: "wall",
      label: wallLabels[i] ?? `Wall ${i + 1}`,
      parentId: "room_01",
      childIds: [],
      surfaceKind: "wall",
      quantifiable: true,
      geometry: {
        plane: { normal: inwardNormal(a, b), offsetIn: 0 },
        polygon: [
          { u: 0, v: 0 },
          { u: lengthIn, v: 0 },
          { u: lengthIn, v: H },
          { u: 0, v: H },
        ],
      },
      dimensions: {},
      openingIds: [],
      confidence: wallConf,
      source,
      calibrationStatus,
      validationStatus: "unverified" as const,
    };
  });

  // openings → child entities of their host wall
  const openingEntities: RoomEntity[] = [];
  for (const spec of openings) {
    const wall = walls[spec.wallIndex];
    if (!wall) continue;
    const id = uid(spec.kind === "door" ? "door" : "window");
    const conf = spec.confidence ?? clamp(confidence - 0.1);
    openingEntities.push({
      id,
      type: spec.kind,
      label: spec.kind === "door" ? "Doorway" : "Window",
      parentId: wall.id,
      childIds: [],
      quantifiable: false,
      geometry: { position: { x: spec.uIn, y: spec.vIn, z: 0 }, rotationDeg: 0 },
      dimensions: { widthIn: spec.widthIn, heightIn: spec.heightIn },
      confidence: conf,
      source,
      calibrationStatus,
      validationStatus: conf < 0.75 ? "needs_verification" : "unverified",
    });
    wall.childIds.push(id);
    wall.openingIds!.push(id);
  }

  // resolve cached dimensions
  const allEntities = [roomEntity, floor, ceiling, ...walls, ...openingEntities];
  for (const e of allEntities) {
    e.dimensions = computeEntityDimensions(e, openingEntities);
  }
  roomEntity.childIds = [floor.id, ceiling.id, ...walls.map((w) => w.id)];

  return {
    id: uid("rm"),
    projectId,
    roomId,
    version,
    supersedesId,
    schemaVersion: 1,
    source,
    captureSource,
    status,
    calibration: {
      status: calibrationStatus,
      scaleFactor,
      scaleConfidence: calibrationStatus === "calibrated" ? 0.95 : calibrationStatus === "partially_calibrated" ? 0.7 : 0.4,
      references: [],
      updatedAt: now,
    },
    units: "in",
    bounds: { widthIn: W, lengthIn: L, heightIn: H },
    floorPolygon,
    ceilingHeightIn: H,
    entities: allEntities,
    confidence,
    roomType,
    createdAt: now,
    updatedAt: now,
  };
}

function surface(
  id: string,
  type: "floor" | "ceiling",
  surfaceKind: "floor" | "ceiling",
  label: string,
  outline: Vec2[],
  elevationIn: number,
  confidence: number,
  source: SpatialSource,
  calibrationStatus: CalibrationStatus,
): RoomEntity {
  return {
    id,
    type,
    label,
    parentId: "room_01",
    childIds: [],
    surfaceKind,
    quantifiable: true,
    geometry: {
      plane: { normal: { x: 0, y: type === "floor" ? 1 : -1, z: 0 }, offsetIn: elevationIn },
      polygon: outline.map((p) => ({ u: p.x, v: p.z })),
      position: { x: 0, y: elevationIn, z: 0 },
    },
    dimensions: {},
    confidence: clamp(confidence + (type === "floor" ? 0.08 : -0.04)),
    source,
    calibrationStatus,
    validationStatus: "unverified",
  };
}

function inwardNormal(a: Vec2, b: Vec2) {
  // rotate the edge direction +90° to point into a CCW polygon
  const dx = b.x - a.x;
  const dz = b.z - a.z;
  const len = Math.hypot(dx, dz) || 1;
  return { x: -dz / len, y: 0, z: dx / len };
}

function clamp(n: number): number {
  return Math.max(0, Math.min(1, Math.round(n * 100) / 100));
}

function roomLabel(type: ProjectType | null): string {
  if (!type || type === "other") return "Room";
  return type
    .split("_")
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");
}

// ---------------------------------------------------------------------------
// Presets for demo / fallback
// ---------------------------------------------------------------------------

export const DEMO_ROOM_PRESETS: Record<ProjectType, { w: number; l: number; h: number }> = {
  kitchen: { w: 12 * IN_PER_FT, l: 14 * IN_PER_FT, h: 9 * IN_PER_FT },
  bathroom: { w: 7 * IN_PER_FT, l: 9 * IN_PER_FT, h: 8 * IN_PER_FT },
  living_room: { w: 14 * IN_PER_FT, l: 18 * IN_PER_FT, h: 9 * IN_PER_FT },
  bedroom: { w: 11 * IN_PER_FT, l: 12 * IN_PER_FT, h: 9 * IN_PER_FT },
  office: { w: 10 * IN_PER_FT, l: 12 * IN_PER_FT, h: 9 * IN_PER_FT },
  commercial: { w: 16 * IN_PER_FT, l: 26 * IN_PER_FT, h: 11 * IN_PER_FT },
  terrace: { w: 10 * IN_PER_FT, l: 13 * IN_PER_FT, h: 9 * IN_PER_FT },
  exterior: { w: 20 * IN_PER_FT, l: 26 * IN_PER_FT, h: 10 * IN_PER_FT },
  whole_home: { w: 26 * IN_PER_FT, l: 33 * IN_PER_FT, h: 9 * IN_PER_FT },
  other: { w: 14 * IN_PER_FT, l: 18 * IN_PER_FT, h: 8 * IN_PER_FT },
};

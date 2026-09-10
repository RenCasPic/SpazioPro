/**
 * Deterministic room-model fixtures for tests, the demo seed and Storybook-ish
 * manual inspection. Every fixture is a pure function — no randomness. §34.
 */

import type { RoomModel } from "@/types";
import { buildRectangularRoom, type OpeningSpec } from "./room-builder";

interface FixtureOpts {
  projectId?: string;
  roomId?: string;
}

/** 14 ft × 18 ft × 8 ft, bare — the brief's demo room. */
export function fxSimpleRoom({ projectId = "prj_demo", roomId = "room_demo" }: FixtureOpts = {}): RoomModel {
  return buildRectangularRoom({
    projectId,
    roomId,
    widthIn: 168,
    lengthIn: 216,
    heightIn: 96,
    roomType: "other",
    source: "demo",
    status: "awaiting_validation",
    calibrationStatus: "uncalibrated",
    confidence: 0.84,
  });
}

/** Same room + a single doorway. */
export function fxRoomWithDoor(opts: FixtureOpts = {}): RoomModel {
  return withOpenings(opts, [{ wallIndex: 3, kind: "door", widthIn: 32, heightIn: 80, uIn: 12, vIn: 0, confidence: 0.9 }]);
}

/** Room + door + two windows. */
export function fxRoomWithWindows(opts: FixtureOpts = {}): RoomModel {
  return withOpenings(opts, [
    { wallIndex: 3, kind: "door", widthIn: 32, heightIn: 80, uIn: 12, vIn: 0, confidence: 0.9 },
    { wallIndex: 0, kind: "window", widthIn: 48, heightIn: 48, uIn: 40, vIn: 36, confidence: 0.86 },
    { wallIndex: 2, kind: "window", widthIn: 36, heightIn: 60, uIn: 60, vIn: 30, confidence: 0.83 },
  ]);
}

/** Room with a window the model isn't sure about → needs_verification. */
export function fxLowConfidenceWindow(opts: FixtureOpts = {}): RoomModel {
  return withOpenings(opts, [
    { wallIndex: 0, kind: "window", widthIn: 44, heightIn: 44, uIn: 50, vIn: 38, confidence: 0.62 },
  ]);
}

/** Uncalibrated — geometry only, scale unknown. */
export function fxUncalibratedRoom(opts: FixtureOpts = {}): RoomModel {
  const m = fxRoomWithWindows(opts);
  m.calibration.status = "uncalibrated";
  m.calibration.scaleConfidence = 0.4;
  m.entities.forEach((e) => (e.calibrationStatus = "uncalibrated"));
  return m;
}

/** Fully calibrated + every architectural entity verified. */
export function fxCalibratedRoom(opts: FixtureOpts = {}): RoomModel {
  const m = fxRoomWithWindows(opts);
  m.status = "ready";
  m.calibration.status = "calibrated";
  m.calibration.scaleFactor = 1;
  m.calibration.scaleConfidence = 0.95;
  m.entities.forEach((e) => {
    e.calibrationStatus = "calibrated";
    if (e.quantifiable) e.validationStatus = "verified";
  });
  return m;
}

export const ROOM_FIXTURES = {
  simple: fxSimpleRoom,
  door: fxRoomWithDoor,
  windows: fxRoomWithWindows,
  lowConfidenceWindow: fxLowConfidenceWindow,
  uncalibrated: fxUncalibratedRoom,
  calibrated: fxCalibratedRoom,
} as const;

function withOpenings(
  { projectId = "prj_demo", roomId = "room_demo" }: FixtureOpts,
  openings: OpeningSpec[],
): RoomModel {
  return buildRectangularRoom({
    projectId,
    roomId,
    widthIn: 168,
    lengthIn: 216,
    heightIn: 96,
    roomType: "other",
    openings,
    source: "demo",
    status: "awaiting_validation",
    calibrationStatus: "uncalibrated",
    confidence: 0.84,
  });
}

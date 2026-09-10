/**
 * DemoSpatialProvider — deterministic, offline, no dependencies. Produces a
 * repeatable Semantic 3D Room Model from the capture ids so the whole editor /
 * calibration / material / quantity / estimate path is developable and
 * testable with `AI_PROVIDER=demo` and no external services.
 *
 * No fake randomness — same input → same model. See §33–34.
 */

import type { ProjectType, RoomModel, RoomModelStatus } from "@/types";
import type { ReconstructInput, SpatialProvider } from "./provider";
import { DEMO_ROOM_PRESETS, buildRectangularRoom, type OpeningSpec } from "./room-builder";

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

const STAGES: RoomModelStatus[] = [
  "processing",
  "reconstructing",
  "segmenting",
  "building_model",
  "awaiting_validation",
];

const GUESSES: ProjectType[] = ["kitchen", "bathroom", "living_room", "bedroom", "office"];

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < Math.min(s.length, 4096); i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export const demoSpatialProvider: SpatialProvider = {
  id: "demo",
  isDemo: true,

  async reconstruct({ projectId, roomId, captures, roomTypeHint, onStage }: ReconstructInput): Promise<RoomModel> {
    const fast = process.env.VITEST === "true" || process.env.NODE_ENV === "test";
    for (const stage of STAGES) {
      await onStage?.(stage);
      await wait(fast ? 0 : 350);
    }

    const seed = hashString(captures.map((c) => c.id).join("|") || roomId);
    const roomType: ProjectType =
      roomTypeHint && roomTypeHint !== "other" ? roomTypeHint : GUESSES[seed % GUESSES.length];
    const preset = DEMO_ROOM_PRESETS[roomType];

    // deterministic: every 4th seed yields a low-confidence window (a real
    // fixture case for the "please verify this" flow).
    const windowConfidence = seed % 4 === 0 ? 0.68 : 0.82;

    const openings: OpeningSpec[] = [
      { wallIndex: 3, kind: "door", widthIn: 32, heightIn: 80, uIn: 14, vIn: 0, confidence: 0.88 },
      {
        wallIndex: 0,
        kind: "window",
        widthIn: 48,
        heightIn: 48,
        uIn: Math.max(12, preset.w / 2 - 24),
        vIn: 36,
        confidence: windowConfidence,
      },
    ];
    // bathrooms are small — skip the window
    if (roomType === "bathroom") openings.pop();

    return buildRectangularRoom({
      projectId,
      roomId,
      widthIn: preset.w,
      lengthIn: preset.l,
      heightIn: preset.h,
      roomType,
      openings,
      source: "demo",
      captureSource: captures.length ? "photo" : "demo",
      status: "awaiting_validation",
      calibrationStatus: "uncalibrated",
      confidence: 0.82,
    });
  },
};

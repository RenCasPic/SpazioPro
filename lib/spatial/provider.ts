/**
 * Spatial reconstruction provider seam. Mirrors lib/ai/provider.ts exactly:
 * `SPATIAL_PROVIDER=demo` (the default) needs no network, key or GPU. A real
 * provider (COLMAP, a commercial reconstruction API, mobile depth, ARKit …)
 * registers a case here and nothing else in SpazioPro changes.
 *
 * The UI never knows which provider is active — it only ever consumes a
 * RoomModel. See docs/3d-room-reconstruction.md §11, §47.
 */

import type { ProjectType, RoomModel, RoomModelStatus } from "@/types";

export interface ReconstructCapture {
  id: string;
  /** Storage path (real) or data URL (demo) */
  url: string;
  width: number;
  height: number;
}

export interface ReconstructInput {
  projectId: string;
  roomId: string;
  captures: ReconstructCapture[];
  roomTypeHint?: ProjectType;
  /** called as the job advances so the caller can persist job state */
  onStage?: (stage: RoomModelStatus) => void | Promise<void>;
}

export interface SpatialProvider {
  readonly id: string;
  readonly isDemo: boolean;

  /**
   * Photos/frames → an uncalibrated Semantic 3D Room Model. Absolute scale is
   * resolved afterwards by the calibration step, never here.
   */
  reconstruct(input: ReconstructInput): Promise<RoomModel>;
}

import { demoSpatialProvider } from "./demo-provider";

let cached: SpatialProvider | null = null;

export function getSpatialProvider(): SpatialProvider {
  if (cached) return cached;
  const id =
    process.env.NEXT_PUBLIC_SPATIAL_PROVIDER ?? process.env.SPATIAL_PROVIDER ?? "demo";
  switch (id) {
    // case "colmap": cached = colmapSpatialProvider; break;
    // case "reconstruction_api": cached = apiSpatialProvider; break;
    default:
      cached = demoSpatialProvider;
  }
  return cached;
}

/** test hook */
export function __resetSpatialProvider() {
  cached = null;
}

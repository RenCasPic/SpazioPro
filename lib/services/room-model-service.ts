import type {
  ProjectType,
  ReconstructionJob,
  RoomCapture,
  RoomModel,
} from "@/types";
import { mutateDb, readDb } from "@/lib/db/local-store";
import { getCurrentUserId } from "@/lib/auth/auth";
import { getSpatialProvider } from "@/lib/spatial/provider";
import { calibrateModel, type MeasurementInput } from "@/lib/spatial/calibrate";
import { assertTransition } from "@/lib/spatial/reconstruction";
import { roomService } from "./room-service";
import { uid } from "@/lib/utils";

async function ownedProject(projectId: string) {
  const userId = await getCurrentUserId();
  const project = readDb().projects.find((p) => p.id === projectId && p.userId === userId);
  if (!project) throw new Error("Project not found");
  return project;
}

/** Latest version of the model for a room, or null. */
function latest(roomId: string): RoomModel | null {
  const models = readDb().roomModels.filter((m) => m.roomId === roomId);
  if (!models.length) return null;
  return models.reduce((a, b) => (b.version > a.version ? b : a));
}

export const roomModelService = {
  async getForRoom(roomId: string): Promise<RoomModel | null> {
    const userId = await getCurrentUserId();
    const model = latest(roomId);
    if (!model) return null;
    const owns = readDb().projects.some((p) => p.id === model.projectId && p.userId === userId);
    return owns ? model : null;
  },

  async getForProject(projectId: string): Promise<RoomModel | null> {
    const project = await ownedProject(projectId);
    const room = readDb().rooms.find((r) => r.projectId === project.id);
    return room ? latest(room.id) : null;
  },

  async getById(modelId: string): Promise<RoomModel | null> {
    const userId = await getCurrentUserId();
    const model = readDb().roomModels.find((m) => m.id === modelId);
    if (!model) return null;
    const owns = readDb().projects.some((p) => p.id === model.projectId && p.userId === userId);
    return owns ? model : null;
  },

  async listVersions(roomId: string): Promise<RoomModel[]> {
    await getCurrentUserId();
    return readDb()
      .roomModels.filter((m) => m.roomId === roomId)
      .sort((a, b) => a.version - b.version);
  },

  async job(projectId: string): Promise<ReconstructionJob | null> {
    const project = await ownedProject(projectId);
    const jobs = readDb().reconstructionJobs.filter((j) => j.projectId === project.id);
    return jobs.length ? jobs.reduce((a, b) => (b.startedAt > a.startedAt ? b : a)) : null;
  },

  /** Register uploaded captures (demo: data URLs; real: storage paths). */
  async addCaptures(
    projectId: string,
    captures: Array<{ url: string; width: number; height: number }>,
  ): Promise<RoomCapture[]> {
    const project = await ownedProject(projectId);
    const now = new Date().toISOString();
    const rows: RoomCapture[] = captures.map((c, i) => ({
      id: uid("cap"),
      projectId: project.id,
      roomModelId: null,
      kind: "photo",
      url: c.url,
      width: c.width,
      height: c.height,
      ordinal: i,
      createdAt: now,
    }));
    mutateDb((db) => {
      db.roomCaptures = db.roomCaptures.filter((c) => c.projectId !== project.id || c.roomModelId !== null);
      db.roomCaptures.push(...rows);
    });
    return rows;
  },

  /**
   * Run reconstruction through the active SpatialProvider, persist the model,
   * and write its bounds back into the Room row. Demo runs synchronously.
   */
  async reconstruct(
    projectId: string,
    opts: { captureIds?: string[]; roomTypeHint?: ProjectType } = {},
  ): Promise<{ model: RoomModel; job: ReconstructionJob }> {
    const project = await ownedProject(projectId);
    const room = await roomService.primary(project.id);
    if (!room) throw new Error("Project has no room");

    const db = readDb();
    const captures = db.roomCaptures.filter(
      (c) => c.projectId === project.id && (!opts.captureIds || opts.captureIds.includes(c.id)),
    );

    const provider = getSpatialProvider();
    const startedAt = new Date().toISOString();
    const jobId = uid("rjob");
    const job: ReconstructionJob = {
      id: jobId,
      projectId: project.id,
      roomId: room.id,
      roomModelId: null,
      provider: provider.id,
      status: "uploaded",
      stage: "uploaded",
      captureIds: captures.map((c) => c.id),
      imageCount: captures.length,
      error: null,
      errorCode: null,
      startedAt,
      completedAt: null,
      durationMs: null,
    };
    mutateDb((store) => store.reconstructionJobs.push(job));

    try {
      const model = await provider.reconstruct({
        projectId: project.id,
        roomId: room.id,
        captures: captures.map((c) => ({ id: c.id, url: c.url, width: c.width, height: c.height })),
        roomTypeHint: opts.roomTypeHint ?? project.projectType,
        onStage: (stage) => {
          mutateDb((store) => {
            const j = store.reconstructionJobs.find((x) => x.id === jobId);
            if (j) {
              assertTransition(j.status, stage);
              j.status = stage;
              j.stage = stage;
            }
          });
        },
      });

      const completedAt = new Date().toISOString();
      mutateDb((store) => {
        // supersede any previous model for this room by keeping only the newest as "active";
        // history rows stay for reproducibility.
        store.roomModels.push(model);
        store.roomCaptures
          .filter((c) => c.projectId === project.id)
          .forEach((c) => (c.roomModelId = model.id));
        const j = store.reconstructionJobs.find((x) => x.id === jobId)!;
        j.status = model.status;
        j.stage = model.status;
        j.roomModelId = model.id;
        j.completedAt = completedAt;
        j.durationMs = Date.parse(completedAt) - Date.parse(startedAt);
      });

      await this.applyToRoom(model.id);
      return { model, job: readDb().reconstructionJobs.find((x) => x.id === jobId)! };
    } catch (e) {
      mutateDb((store) => {
        const j = store.reconstructionJobs.find((x) => x.id === jobId);
        if (j) {
          j.status = "failed";
          j.error = e instanceof Error ? e.message : "Reconstruction failed";
          j.errorCode = "reconstruction_failed";
          j.completedAt = new Date().toISOString();
        }
      });
      throw e;
    }
  },

  /** Confirm measurements → new model version, rescaled, written back to the Room. */
  async calibrate(modelId: string, measurements: MeasurementInput[]): Promise<RoomModel> {
    const model = await this.getById(modelId);
    if (!model) throw new Error("Room model not found");

    const next = calibrateModel(model, measurements);
    const versioned: RoomModel = {
      ...next,
      id: uid("rm"),
      version: model.version + 1,
      supersedesId: model.id,
      status: "ready",
    };

    mutateDb((store) => {
      store.roomModels.push(versioned);
      const j = store.reconstructionJobs.find((x) => x.roomId === model.roomId);
      if (j) j.roomModelId = versioned.id;
    });
    await this.applyToRoom(versioned.id);
    return versioned;
  },

  /** Persist a caller-supplied new version (edit ops build these). */
  async saveVersion(previousId: string, next: RoomModel): Promise<RoomModel> {
    const prev = await this.getById(previousId);
    if (!prev) throw new Error("Room model not found");
    const versioned: RoomModel = {
      ...next,
      id: uid("rm"),
      version: prev.version + 1,
      supersedesId: prev.id,
      updatedAt: new Date().toISOString(),
    };
    mutateDb((store) => store.roomModels.push(versioned));
    await this.applyToRoom(versioned.id);
    return versioned;
  },

  /**
   * Write the model's bounds + surface areas into the existing Room row so the
   * estimate / quantities / PDF keep working through the same contract.
   */
  async applyToRoom(modelId: string): Promise<void> {
    const model = readDb().roomModels.find((m) => m.id === modelId);
    if (!model) return;
    const floor = model.entities.find((e) => e.type === "floor");
    const ceiling = model.entities.find((e) => e.type === "ceiling");
    const walls = model.entities.filter((e) => e.type === "wall");
    const wallArea = walls.reduce((s, w) => s + (w.dimensions.grossAreaSqFt ?? 0), 0);
    const perimeter = walls.reduce((s, w) => s + (w.dimensions.perimeterLinFt ?? 0), 0);

    await roomService.setDimensions(
      model.roomId,
      {
        widthIn: model.bounds.widthIn,
        lengthIn: model.bounds.lengthIn,
        heightIn: model.bounds.heightIn,
      },
      model.calibration.status === "calibrated" ? "mixed" : "ai_estimate",
    );
    mutateDb((db) => {
      const room = db.rooms.find((r) => r.id === model.roomId);
      if (!room) return;
      if (floor?.dimensions.grossAreaSqFt) room.floorAreaSqFt = floor.dimensions.grossAreaSqFt;
      if (ceiling?.dimensions.grossAreaSqFt) room.ceilingAreaSqFt = ceiling.dimensions.grossAreaSqFt;
      if (wallArea) room.wallAreaSqFt = Math.round(wallArea);
      if (perimeter) room.perimeterLinFt = Math.round(perimeter);
    });
  },

  async remove(roomId: string): Promise<void> {
    await getCurrentUserId();
    mutateDb((db) => {
      const ids = new Set(db.roomModels.filter((m) => m.roomId === roomId).map((m) => m.id));
      db.roomModels = db.roomModels.filter((m) => m.roomId !== roomId);
      db.reconstructionJobs = db.reconstructionJobs.filter((j) => j.roomId !== roomId);
      db.roomCaptures = db.roomCaptures.filter((c) => !c.roomModelId || !ids.has(c.roomModelId));
    });
  },
};

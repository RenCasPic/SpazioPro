import type { MeasurementSource, RoomAnalysis, RoomDimensions } from "@/types";
import { mutateDb, readDb } from "@/lib/db/local-store";
import { getCurrentUserId } from "@/lib/auth/auth";
import { surfaceAreas } from "@/lib/calculations/quantities";

export const roomService = {
  async primary(projectId: string) {
    await getCurrentUserId();
    return readDb().rooms.find((r) => r.projectId === projectId) ?? null;
  },

  async setDimensions(
    roomId: string,
    dims: Partial<RoomDimensions>,
    source: MeasurementSource = "manual",
  ): Promise<void> {
    mutateDb((db) => {
      const room = db.rooms.find((r) => r.id === roomId);
      if (!room) return;
      Object.assign(room, dims);
      const a = surfaceAreas({ width: room.width, length: room.length, height: room.height });
      room.floorArea = a.floorArea;
      room.wallArea = a.wallArea;
      room.ceilingArea = a.ceilingArea;
      room.perimeter = a.perimeter;
      room.measurementSource = source;
      room.updatedAt = new Date().toISOString();
    });
  },

  async applyAnalysis(roomId: string, analysis: RoomAnalysis): Promise<void> {
    mutateDb((db) => {
      const room = db.rooms.find((r) => r.id === roomId);
      if (!room) return;
      room.aiAnalysis = analysis;
      const d = analysis.approximateDimensions;
      if (d?.width && d?.length && d?.height) {
        room.width = d.width;
        room.length = d.length;
        room.height = d.height;
        const a = surfaceAreas({ width: d.width, length: d.length, height: d.height });
        room.floorArea = a.floorArea;
        room.wallArea = a.wallArea;
        room.ceilingArea = a.ceilingArea;
        room.perimeter = a.perimeter;
        room.measurementSource = "ai_estimate";
      }
      room.updatedAt = new Date().toISOString();
    });
  },
};

import type { MeasurementSource, RoomAnalysis, RoomDimensions } from "@/types";
import { mutateDb, readDb } from "@/lib/db/local-store";
import { getCurrentUserId } from "@/lib/auth/auth";
import { surfaceAreas } from "@/lib/calculations/dimensions";

function recompute(room: {
  widthIn: number;
  lengthIn: number;
  heightIn: number;
  floorAreaSqFt: number;
  wallAreaSqFt: number;
  ceilingAreaSqFt: number;
  perimeterLinFt: number;
}) {
  const a = surfaceAreas({ widthIn: room.widthIn, lengthIn: room.lengthIn, heightIn: room.heightIn });
  room.floorAreaSqFt = a.floorAreaSqFt;
  room.wallAreaSqFt = a.wallAreaSqFt;
  room.ceilingAreaSqFt = a.ceilingAreaSqFt;
  room.perimeterLinFt = a.perimeterLinFt;
}

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
      if (dims.widthIn != null) room.widthIn = dims.widthIn;
      if (dims.lengthIn != null) room.lengthIn = dims.lengthIn;
      if (dims.heightIn != null) room.heightIn = dims.heightIn;
      recompute(room);
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
      if (d?.widthIn && d?.lengthIn && d?.heightIn) {
        room.widthIn = d.widthIn;
        room.lengthIn = d.lengthIn;
        room.heightIn = d.heightIn;
        recompute(room);
        room.measurementSource = "ai_estimate";
      }
      room.updatedAt = new Date().toISOString();
    });
  },
};

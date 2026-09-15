import type { LaborCategory, MeasurementSourceKind, TakeoffMeasurement, Unit } from "@/types";
import { mutateDb, readDb } from "@/lib/db/local-store";
import { getCurrentUserId } from "@/lib/auth/auth";
import { uid } from "@/lib/utils";

async function assertOwner(projectId: string): Promise<void> {
  const userId = await getCurrentUserId();
  const project = readDb().projects.find((p) => p.id === projectId);
  if (!project || project.userId !== userId) throw new Error("Project not found");
}

export interface NewTakeoffMeasurement {
  projectId: string;
  roomId?: string | null;
  category: LaborCategory;
  label: string;
  unit: Unit;
  quantity: number;
  source?: MeasurementSourceKind;
  sourceRef?: string | null;
  confidence?: number;
  notes?: string;
}

/**
 * The TAKEOFF layer: "how much work/material exists", with its source and
 * confidence — never a price. Estimate items opt in to a measurement's
 * quantity via `ProjectItem.takeoffMeasurementId` (see lib/calculations/estimate.ts).
 */
export const takeoffService = {
  async list(projectId: string): Promise<TakeoffMeasurement[]> {
    await assertOwner(projectId);
    return readDb()
      .takeoffMeasurements.filter((m) => m.projectId === projectId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  },

  /** Every measurement across the user's projects — for the cross-project Takeoffs view. */
  async listAll(): Promise<TakeoffMeasurement[]> {
    const userId = await getCurrentUserId();
    const db = readDb();
    const ownedIds = new Set(db.projects.filter((p) => p.userId === userId).map((p) => p.id));
    return db.takeoffMeasurements
      .filter((m) => ownedIds.has(m.projectId))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  },

  async add(input: NewTakeoffMeasurement): Promise<TakeoffMeasurement> {
    await assertOwner(input.projectId);
    const now = new Date().toISOString();
    const source = input.source ?? "manual";
    const measurement: TakeoffMeasurement = {
      id: uid("tko"),
      projectId: input.projectId,
      roomId: input.roomId ?? null,
      category: input.category,
      label: input.label,
      unit: input.unit,
      quantity: input.quantity,
      source,
      sourceRef: input.sourceRef ?? null,
      confidence: input.confidence ?? (source === "manual" ? 1 : 0.75),
      // a number the professional typed themselves needs no further review
      verificationStatus: source === "manual" ? "verified" : "needs_verification",
      notes: input.notes ?? "",
      createdAt: now,
      updatedAt: now,
    };
    mutateDb((db) => db.takeoffMeasurements.push(measurement));
    return measurement;
  },

  async update(
    id: string,
    patch: Partial<
      Pick<
        TakeoffMeasurement,
        "label" | "quantity" | "unit" | "category" | "notes" | "verificationStatus"
      >
    >,
  ): Promise<void> {
    mutateDb((db) => {
      const m = db.takeoffMeasurements.find((x) => x.id === id);
      if (m) Object.assign(m, patch, { updatedAt: new Date().toISOString() });
    });
  },

  async verify(id: string): Promise<void> {
    await this.update(id, { verificationStatus: "verified" });
  },

  async remove(id: string): Promise<void> {
    mutateDb((db) => {
      db.takeoffMeasurements = db.takeoffMeasurements.filter((m) => m.id !== id);
      // an item that pointed at this measurement falls back to its room's own
      // dimensions rather than silently keeping a stale, now-orphaned quantity
      for (const item of db.items) {
        if (item.takeoffMeasurementId === id) {
          item.takeoffMeasurementId = null;
          item.updatedAt = new Date().toISOString();
        }
      }
    });
  },

  /** Take-off → Estimate bridge: point an item's auto-quantity at this measurement. */
  async linkToItem(measurementId: string, itemId: string): Promise<void> {
    mutateDb((db) => {
      const item = db.items.find((i) => i.id === itemId);
      if (item) {
        item.takeoffMeasurementId = measurementId;
        item.quantityAuto = true;
        item.updatedAt = new Date().toISOString();
      }
    });
  },
};

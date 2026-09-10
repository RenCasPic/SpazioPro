import { describe, expect, it } from "vitest";
import { applyModelEdit } from "@/lib/spatial/edit";
import { fxRoomWithWindows, fxSimpleRoom } from "@/lib/spatial/fixtures";
import { roomModelEditSchema } from "@/lib/validations/room-model";

describe("applyModelEdit", () => {
  it("set_ceiling_height updates the model, bounds and every wall", () => {
    const m = fxSimpleRoom(); // 96 in ceiling
    const r = applyModelEdit(m, { op: "set_ceiling_height", heightIn: 120 });
    expect(r.ceilingHeightIn).toBe(120);
    expect(r.bounds.heightIn).toBe(120);
    const wall = r.entities.find((e) => e.type === "wall")!;
    expect(wall.dimensions.heightIn).toBe(120);
    expect(wall.dimensions.grossAreaSqFt).toBeGreaterThan(
      m.entities.find((e) => e.type === "wall")!.dimensions.grossAreaSqFt!,
    );
    expect(m.ceilingHeightIn).toBe(96); // input untouched
  });

  it("add_opening then the wall's net area drops", () => {
    const m = fxSimpleRoom();
    const wall = m.entities.find((e) => e.type === "wall")!;
    const gross = wall.dimensions.grossAreaSqFt!;
    const r = applyModelEdit(m, {
      op: "add_opening",
      wallId: wall.id,
      kind: "window",
      rect: { uIn: 24, vIn: 36, widthIn: 36, heightIn: 48 },
    });
    const w2 = r.entities.find((e) => e.id === wall.id)!;
    expect(w2.openingIds).toHaveLength(1);
    expect(w2.dimensions.netAreaSqFt).toBeCloseTo(gross - 12, 1); // 36×48 = 12 sq ft
    expect(r.entities.filter((e) => e.type === "window")).toHaveLength(1);
  });

  it("remove_opening restores the wall's full area and unlinks it", () => {
    const m = fxRoomWithWindows();
    const win = m.entities.find((e) => e.type === "window")!;
    const wall = m.entities.find((e) => e.id === win.parentId)!;
    const gross = wall.dimensions.grossAreaSqFt!;
    const r = applyModelEdit(m, { op: "remove_opening", openingId: win.id });
    expect(r.entities.find((e) => e.id === win.id)).toBeUndefined();
    const w2 = r.entities.find((e) => e.id === wall.id)!;
    expect(w2.openingIds ?? []).not.toContain(win.id);
    expect(w2.dimensions.netAreaSqFt).toBeCloseTo(gross, 1);
  });

  it("override_dimension marks the entity verified and manual", () => {
    const m = fxSimpleRoom();
    const wall = m.entities.find((e) => e.type === "wall")!;
    const r = applyModelEdit(m, { op: "override_dimension", entityId: wall.id, field: "lengthIn", valueIn: 200 });
    const w2 = r.entities.find((e) => e.id === wall.id)!;
    expect(w2.dimensions.lengthIn).toBe(200);
    expect(w2.validationStatus).toBe("verified");
    expect(w2.source).toBe("manual");
  });

  it("mark_reviewed clears the review flag", () => {
    const m = fxRoomWithWindows();
    const wall = m.entities.find((e) => e.type === "wall")!;
    const r = applyModelEdit(m, { op: "mark_reviewed", entityId: wall.id });
    expect(r.entities.find((e) => e.id === wall.id)!.validationStatus).toBe("verified");
  });

  it("every op the schema accepts is handled", () => {
    const ops = [
      { op: "set_ceiling_height", heightIn: 100 },
      { op: "mark_reviewed", entityId: "wall_01" },
      { op: "move_wall", wallId: "wall_01", offsetIn: 5 },
    ] as const;
    const m = fxSimpleRoom();
    for (const op of ops) {
      const parsed = roomModelEditSchema.parse(op);
      expect(() => applyModelEdit(m, parsed)).not.toThrow();
    }
  });
});

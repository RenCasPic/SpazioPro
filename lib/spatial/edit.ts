/**
 * Apply a single edit operation to a Semantic 3D Room Model. Pure — returns a
 * fresh model, mutates nothing. The vocabulary is deliberately tiny (§37): a
 * homeowner nudging a wall or fixing a window, never a CAD.
 */

import type { RoomEntity, RoomModel } from "@/types";
import type { RoomModelEdit } from "@/lib/validations/room-model";
import { computeEntityDimensions } from "@/lib/calculations/surfaces";
import { round } from "@/lib/calculations/money";
import { uid } from "@/lib/utils";

export function applyModelEdit(model: RoomModel, edit: RoomModelEdit): RoomModel {
  const clone: RoomModel = JSON.parse(JSON.stringify(model));
  const openings = () => clone.entities.filter((e) => e.type === "window" || e.type === "door" || e.type === "opening");

  switch (edit.op) {
    case "set_ceiling_height": {
      clone.ceilingHeightIn = edit.heightIn;
      clone.bounds.heightIn = edit.heightIn;
      const ceiling = clone.entities.find((e) => e.type === "ceiling");
      if (ceiling?.geometry.position) ceiling.geometry.position.y = edit.heightIn;
      if (ceiling?.geometry.plane) ceiling.geometry.plane.offsetIn = edit.heightIn;
      for (const w of clone.entities.filter((e) => e.type === "wall")) {
        if (w.geometry.polygon) {
          const len = Math.max(...w.geometry.polygon.map((p) => p.u));
          w.geometry.polygon = [
            { u: 0, v: 0 },
            { u: len, v: 0 },
            { u: len, v: edit.heightIn },
            { u: 0, v: edit.heightIn },
          ];
        }
      }
      break;
    }

    case "move_wall": {
      const wall = clone.entities.find((e) => e.id === edit.wallId && e.type === "wall");
      if (!wall) break;
      // slide the two shared floor-polygon vertices along the wall normal
      const n = wall.geometry.plane?.normal ?? { x: 0, y: 0, z: 1 };
      const wallIndex = clone.entities.filter((e) => e.type === "wall").indexOf(wall);
      const poly = clone.floorPolygon;
      const a = wallIndex;
      const b = (wallIndex + 1) % poly.length;
      poly[a] = { x: round(poly[a].x + n.x * edit.offsetIn, 2), z: round(poly[a].z + n.z * edit.offsetIn, 2) };
      poly[b] = { x: round(poly[b].x + n.x * edit.offsetIn, 2), z: round(poly[b].z + n.z * edit.offsetIn, 2) };
      rebuildFromFloorPolygon(clone);
      break;
    }

    case "add_opening": {
      const wall = clone.entities.find((e) => e.id === edit.wallId && e.type === "wall");
      if (!wall) break;
      const id = uid(edit.kind);
      const opening: RoomEntity = {
        id,
        type: edit.kind,
        label: edit.kind === "door" ? "Doorway" : "Window",
        parentId: wall.id,
        childIds: [],
        quantifiable: false,
        geometry: { position: { x: edit.rect.uIn, y: edit.rect.vIn, z: 0 }, rotationDeg: 0 },
        dimensions: { widthIn: edit.rect.widthIn, heightIn: edit.rect.heightIn },
        confidence: 1,
        source: "manual",
        calibrationStatus: wall.calibrationStatus,
        validationStatus: "verified",
      };
      clone.entities.push(opening);
      wall.childIds.push(id);
      wall.openingIds = [...(wall.openingIds ?? []), id];
      break;
    }

    case "update_opening": {
      const o = clone.entities.find((e) => e.id === edit.openingId);
      if (!o) break;
      if (edit.rect.widthIn != null) o.dimensions.widthIn = edit.rect.widthIn;
      if (edit.rect.heightIn != null) o.dimensions.heightIn = edit.rect.heightIn;
      if (o.geometry.position) {
        if (edit.rect.uIn != null) o.geometry.position.x = edit.rect.uIn;
        if (edit.rect.vIn != null) o.geometry.position.y = edit.rect.vIn;
      }
      o.source = "manual";
      o.validationStatus = "verified";
      break;
    }

    case "remove_opening": {
      const o = clone.entities.find((e) => e.id === edit.openingId);
      clone.entities = clone.entities.filter((e) => e.id !== edit.openingId);
      if (o) {
        const wall = clone.entities.find((e) => e.id === o.parentId);
        if (wall) {
          wall.childIds = wall.childIds.filter((c) => c !== edit.openingId);
          wall.openingIds = (wall.openingIds ?? []).filter((c) => c !== edit.openingId);
        }
      }
      break;
    }

    case "override_dimension": {
      const e = clone.entities.find((x) => x.id === edit.entityId);
      if (!e) break;
      e.dimensions[edit.field] = edit.valueIn;
      e.source = "manual";
      e.validationStatus = "verified";
      // reflect on the geometry so recompute is consistent
      if (e.type === "wall" && e.geometry.polygon) {
        const len = edit.field === "lengthIn" ? edit.valueIn : Math.max(...e.geometry.polygon.map((p) => p.u));
        const h = edit.field === "heightIn" ? edit.valueIn : Math.max(...e.geometry.polygon.map((p) => p.v));
        e.geometry.polygon = [
          { u: 0, v: 0 },
          { u: len, v: 0 },
          { u: len, v: h },
          { u: 0, v: h },
        ];
      }
      break;
    }

    case "mark_reviewed": {
      const e = clone.entities.find((x) => x.id === edit.entityId);
      if (e) e.validationStatus = "verified";
      break;
    }
  }

  // recompute every cached dimension against the edited geometry
  const ops = openings();
  for (const e of clone.entities) {
    if (e.type === "window" || e.type === "door" || e.type === "opening") continue;
    e.dimensions = computeEntityDimensions(e, ops);
  }
  clone.confidence = aggregateConfidence(clone);
  clone.updatedAt = new Date().toISOString();
  return clone;
}

/** Rebuild wall polygons + bounds after the floor polygon changed. */
function rebuildFromFloorPolygon(model: RoomModel) {
  const poly = model.floorPolygon;
  const xs = poly.map((p) => p.x);
  const zs = poly.map((p) => p.z);
  model.bounds.widthIn = round(Math.max(...xs) - Math.min(...xs), 2);
  model.bounds.lengthIn = round(Math.max(...zs) - Math.min(...zs), 2);

  const walls = model.entities.filter((e) => e.type === "wall");
  walls.forEach((w, i) => {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    const len = Math.hypot(b.x - a.x, b.z - a.z);
    const h = model.ceilingHeightIn;
    w.geometry.polygon = [
      { u: 0, v: 0 },
      { u: len, v: 0 },
      { u: len, v: h },
      { u: 0, v: h },
    ];
  });

  for (const s of model.entities.filter((e) => e.type === "floor" || e.type === "ceiling")) {
    s.geometry.polygon = poly.map((p) => ({ u: p.x, v: p.z }));
  }
}

function aggregateConfidence(model: RoomModel): number {
  const q = model.entities.filter((e) => e.quantifiable);
  if (!q.length) return model.confidence;
  return round(q.reduce((s, e) => s + e.confidence, 0) / q.length, 3);
}

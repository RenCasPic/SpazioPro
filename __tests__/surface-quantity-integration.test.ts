import { beforeEach, describe, expect, it } from "vitest";
import { resetDb } from "@/lib/db/local-store";
import { projectService } from "@/lib/services/project-service";
import { itemService } from "@/lib/services/item-service";
import { roomModelService } from "@/lib/services/room-model-service";
import { estimateService } from "@/lib/services/estimate-service";
import { calculateEstimate, resolveItemQuantity } from "@/lib/calculations/estimate";
import { calculateWaste } from "@/lib/calculations/materials";
import { productById } from "@/data/catalog";
import type { ProjectItem, RoomEntity } from "@/types";

describe("3D surface → existing quantity engine", () => {
  beforeEach(() => resetDb());

  it("resolveItemQuantity prefers the linked entity's net area over the room AABB", () => {
    const entity: RoomEntity = {
      id: "floor_01",
      type: "floor",
      label: "Floor",
      parentId: "room_01",
      childIds: [],
      surfaceKind: "floor",
      quantifiable: true,
      geometry: {},
      dimensions: { grossAreaSqFt: 250, netAreaSqFt: 250, perimeterLinFt: 64 },
      confidence: 0.95,
      source: "photo",
      calibrationStatus: "calibrated",
      validationStatus: "verified",
    };
    const item = {
      kind: "surface", surface: "floor", unit: "sq_ft", quantityAuto: true,
      wastePercent: 10, roomEntityId: "floor_01", quantity: 0,
    } as unknown as ProjectItem;

    // room AABB would say 180 sq ft; the entity says 250
    expect(resolveItemQuantity(item, { widthIn: 144, lengthIn: 180, heightIn: 96 })).toBe(198);
    expect(resolveItemQuantity(item, { widthIn: 144, lengthIn: 180, heightIn: 96 }, entity)).toBe(275);
    expect(calculateWaste(250, 10)).toBe(275);
  });

  it("reconstruct → apply material to a wall → estimate quantity comes from that wall", async () => {
    const project = await projectService.create({
      name: "3D Kitchen",
      clientId: null,
      projectType: "kitchen",
      description: "",
      city: "Austin",
      stateCode: "TX",
      zipCode: "78701",
      estimateLanguage: "en-US",
    });

    await roomModelService.addCaptures(project.id, [
      { url: "data:,a", width: 1024, height: 768 },
      { url: "data:,b", width: 1024, height: 768 },
      { url: "data:,c", width: 1024, height: 768 },
    ]);
    const { model } = await roomModelService.reconstruct(project.id, { roomTypeHint: "kitchen" });
    expect(model.status).toBe("awaiting_validation");

    // calibrate so surfaces are quantity-ready
    const wall = model.entities.find((e) => e.type === "wall")!;
    const calibrated = await roomModelService.calibrate(model.id, [
      { entityId: wall.id, kind: "wall_length", valueIn: wall.dimensions.lengthIn! },
    ]);
    expect(calibrated.calibration.status).toBe("calibrated");

    const calWall = calibrated.entities.find((e) => e.id === wall.id)!;
    const tile = productById("wal-subway-tile")!; // sq_ft
    await itemService.add({ projectId: project.id, product: tile, surface: "wall", roomEntityId: calWall.id });

    const bundle = await projectService.get(project.id);
    expect(bundle!.roomModel!.id).toBe(calibrated.id);

    const item = bundle!.items.find((i) => i.roomEntityId === calWall.id)!;
    const expectedBase = calWall.dimensions.netAreaSqFt!;
    expect(item.quantity).toBeCloseTo(calculateWaste(expectedBase, tile.wastePercent), 1);

    // the full estimate uses it too
    const { breakdown } = calculateEstimate({
      items: bundle!.items,
      dimensions: {
        widthIn: bundle!.rooms[0].widthIn,
        lengthIn: bundle!.rooms[0].lengthIn,
        heightIn: bundle!.rooms[0].heightIn,
      },
      measurementSource: "mixed",
      laborLines: bundle!.config.laborLines,
      settings: bundle!.config.settings,
      currency: "USD",
      hasTaxJurisdiction: true,
      roomModel: bundle!.roomModel,
    });
    const line = breakdown.find((b) => b.item.roomEntityId === calWall.id)!;
    expect(line.quantity).toBeCloseTo(calculateWaste(expectedBase, tile.wastePercent), 1);
  });

  it("an uncalibrated model drags the estimate confidence down", async () => {
    const project = await projectService.create({
      name: "Uncal", clientId: null, projectType: "bathroom", description: "",
      city: "Austin", stateCode: "TX", zipCode: "78701", estimateLanguage: "en-US",
    });
    await roomModelService.addCaptures(project.id, [{ url: "data:,x", width: 800, height: 600 }]);
    await roomModelService.reconstruct(project.id, { roomTypeHint: "bathroom" });

    const live = await estimateService.computeLive(project.id);
    expect(live!.confidence.reasons).toContain("uncalibrated_model");
    expect(live!.confidence.level).toBe("low");
  });
});

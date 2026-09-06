import type { EditorTransform, Product, ProjectItem } from "@/types";
import type { SurfaceKind } from "@/lib/constants";
import { mutateDb, readDb } from "@/lib/db/local-store";
import { getCurrentUserId } from "@/lib/auth/auth";
import { categoryMeta } from "@/data/categories";
import { pricingService } from "@/lib/market/pricing-service";
import { laborRateService } from "@/lib/market/labor-rate-service";
import { baseSurfaceQuantity, surfaceAreas } from "@/lib/calculations/dimensions";
import { calculateWaste } from "@/lib/calculations/materials";
import type { RoomDimensions } from "@/types";
import type { Database } from "@/lib/db/schema";
import { uid } from "@/lib/utils";

/**
 * When a surface material is chosen we silently make sure the project also
 * accounts for tearing out what's there and hauling it away — the consumer
 * never has to think of these. Quantities track the surface area; we only
 * ever raise auto values, never stomp a number the user set by hand.
 */
function planTeardown(store: Database, projectId: string, surface: SurfaceKind, dims: RoomDimensions) {
  const config = store.configs.find((c) => c.projectId === projectId);
  if (!config) return;
  const a = surfaceAreas(dims);
  const area = surface === "wall" ? a.wallAreaSqFt : surface === "ceiling" ? a.ceilingAreaSqFt : a.floorAreaSqFt;

  const demo = config.laborLines.find((l) => l.category === "demolition");
  if (demo && demo.fromMarket) {
    demo.enabled = true;
    demo.quantity = Math.max(demo.quantity, Math.round(area));
  }
  const cleaning = config.laborLines.find((l) => l.category === "cleaning");
  if (cleaning) {
    cleaning.enabled = true;
    cleaning.quantity = Math.max(cleaning.quantity, 1);
  }
  if (config.settings.extras.disposal === 0) {
    config.settings.extras.disposal = Math.max(150, Math.round(area * 1.25));
  }
}

async function project(projectId: string) {
  const userId = await getCurrentUserId();
  const p = readDb().projects.find((x) => x.id === projectId && x.userId === userId);
  if (!p) throw new Error("Project not found");
  return p;
}

export const itemService = {
  async add(params: { projectId: string; product: Product; surface?: SurfaceKind }): Promise<ProjectItem> {
    const p = await project(params.projectId);
    const db = readDb();
    const room = db.rooms.find((r) => r.projectId === p.id);
    const dims = room
      ? { widthIn: room.widthIn, lengthIn: room.lengthIn, heightIn: room.heightIn }
      : { widthIn: 144, lengthIn: 180, heightIn: 108 };

    const meta = categoryMeta(params.product.category);
    const surface = params.surface ?? meta.surface;
    const price = pricingService.resolve(params.product.id, p.stateCode);
    const laborRate = laborRateService.rate(p.stateCode, params.product.laborCategory);
    const now = new Date().toISOString();

    const item: ProjectItem = {
      id: uid("itm"),
      projectId: p.id,
      roomId: room?.id ?? null,
      scenarioId: p.activeScenarioId,
      productId: params.product.id,
      name: params.product.name,
      category: params.product.category,
      kind: meta.kind,
      surface: meta.kind === "surface" ? surface : undefined,
      quantity:
        meta.kind === "surface"
          ? calculateWaste(baseSurfaceQuantity(surface, dims, params.product.unit), params.product.wastePercent)
          : 1,
      quantityAuto: meta.kind === "surface",
      unit: params.product.unit,
      unitPrice: price.money.amount,
      laborCost: laborRate && laborRate.unit === params.product.unit ? laborRate.cost : 0,
      currencyCode: "USD",
      wastePercent: params.product.wastePercent,
      priceSource: price.source,
      supplier: price.supplier,
      demoPrice: params.product.demo,
      transform: { x: 0.5, y: meta.kind === "object" ? 0.62 : 0.5, rotation: 0, scale: 1 },
      layer: db.items.filter((i) => i.projectId === p.id && i.scenarioId === p.activeScenarioId).length,
      createdAt: now,
      updatedAt: now,
    };

    mutateDb((store) => {
      if (meta.kind === "surface" && surface) {
        store.items = store.items.filter(
          (it) =>
            !(
              it.projectId === p.id &&
              it.scenarioId === p.activeScenarioId &&
              it.kind === "surface" &&
              it.surface === surface
            ),
        );
      }
      store.items.push(item);
      if (meta.kind === "surface" && surface) {
        planTeardown(store, p.id, surface, dims);
      }
      const proj = store.projects.find((x) => x.id === p.id)!;
      if (proj.status === "draft") proj.status = "designing";
    });
    return item;
  },

  async update(itemId: string, patch: Partial<ProjectItem>): Promise<void> {
    await getCurrentUserId();
    mutateDb((db) => {
      const item = db.items.find((i) => i.id === itemId);
      if (!item) return;
      Object.assign(item, patch, { updatedAt: new Date().toISOString() });
      if (patch.quantity !== undefined) item.quantityAuto = false;
    });
  },

  async setTransform(itemId: string, patch: Partial<EditorTransform>): Promise<void> {
    mutateDb((db) => {
      const item = db.items.find((i) => i.id === itemId);
      if (item) Object.assign(item.transform, patch);
    });
  },

  async remove(itemId: string): Promise<void> {
    mutateDb((db) => {
      db.items = db.items.filter((i) => i.id !== itemId);
    });
  },

  async duplicate(itemId: string): Promise<ProjectItem | null> {
    return mutateDb((db) => {
      const src = db.items.find((i) => i.id === itemId);
      if (!src) return null;
      const copy: ProjectItem = {
        ...JSON.parse(JSON.stringify(src)),
        id: uid("itm"),
        transform: {
          ...src.transform,
          x: Math.min(0.95, src.transform.x + 0.05),
          y: Math.min(0.95, src.transform.y + 0.05),
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      db.items.push(copy);
      return copy;
    });
  },

  async cloneScenarioItems(projectId: string, fromScenarioId: string, toScenarioId: string): Promise<void> {
    mutateDb((db) => {
      const source = db.items.filter((i) => i.projectId === projectId && i.scenarioId === fromScenarioId);
      for (const src of source) {
        db.items.push({
          ...JSON.parse(JSON.stringify(src)),
          id: uid("itm"),
          scenarioId: toScenarioId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    });
  },
};

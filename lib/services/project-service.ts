import type {
  DesignScenario,
  NewLocation,
  NewProject,
  Project,
  ProjectImage,
  ProjectItem,
  ProjectLocation,
  ProjectStatus,
  Room,
  ScenarioType,
} from "@/types";
import type { ProjectConfig } from "@/lib/db/schema";
import { mutateDb, readDb } from "@/lib/db/local-store";
import { createProject, createScenario, defaultSettings } from "@/lib/db/factories";
import { defaultLaborLines } from "@/data/labor";
import { getCurrentUserId } from "@/lib/auth/auth";
import { stateService } from "@/lib/market/country-service";
import { taxService } from "@/lib/market/tax-service";
import { laborRateService } from "@/lib/market/labor-rate-service";
import { pricingService } from "@/lib/market/pricing-service";
import { calculateEstimate } from "@/lib/calculations/estimate";
import { productById } from "@/data/catalog";

export interface ProjectBundle {
  project: Project;
  location: ProjectLocation | null;
  rooms: Room[];
  images: ProjectImage[];
  scenarios: DesignScenario[];
  items: ProjectItem[];
  config: ProjectConfig;
}

export interface ProjectListEntry {
  project: Project;
  location: ProjectLocation | null;
  clientName: string | null;
  thumbnailUrl: string | null;
  itemCount: number;
  /** headline grand total for the active scenario (USD) */
  headlineTotal: number;
}

async function assertOwner(projectId: string): Promise<Project> {
  const userId = await getCurrentUserId();
  const project = readDb().projects.find((p) => p.id === projectId);
  if (!project || project.userId !== userId) throw new Error("Project not found");
  return project;
}

export const projectService = {
  async list(): Promise<ProjectListEntry[]> {
    const userId = await getCurrentUserId();
    const db = readDb();
    return db.projects
      .filter((p) => p.userId === userId)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .map((project) => {
        const items = db.items.filter(
          (i) => i.projectId === project.id && i.scenarioId === project.activeScenarioId,
        );
        const room = db.rooms.find((r) => r.projectId === project.id);
        const config = db.configs.find((c) => c.projectId === project.id);
        let headlineTotal = 0;
        if (room && config) {
          headlineTotal = calculateEstimate({
            items,
            dimensions: { widthIn: room.widthIn, lengthIn: room.lengthIn, heightIn: room.heightIn },
            measurementSource: room.measurementSource,
            laborLines: config.laborLines,
            settings: config.settings,
            currency: "USD",
            hasTaxJurisdiction: true,
          }).totals.total;
        }
        return {
          project,
          location: db.locations.find((l) => l.projectId === project.id) ?? null,
          clientName: db.clients.find((c) => c.id === project.clientId)?.name ?? null,
          thumbnailUrl:
            db.images.find((i) => i.projectId === project.id && i.type === "original")?.originalUrl ?? null,
          itemCount: items.length,
          headlineTotal,
        };
      });
  },

  async get(projectId: string): Promise<ProjectBundle | null> {
    const userId = await getCurrentUserId();
    const db = readDb();
    const project = db.projects.find((p) => p.id === projectId && p.userId === userId);
    if (!project) return null;
    return {
      project,
      location: db.locations.find((l) => l.projectId === projectId) ?? null,
      rooms: db.rooms.filter((r) => r.projectId === projectId),
      images: db.images.filter((i) => i.projectId === projectId),
      scenarios: db.scenarios
        .filter((s) => s.projectId === projectId)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
      items: db.items.filter((i) => i.projectId === projectId),
      config:
        db.configs.find((c) => c.projectId === projectId) ?? {
          projectId,
          laborLines: defaultLaborLines(project.stateCode),
          settings: defaultSettings(0),
        },
    };
  },

  async create(input: NewProject): Promise<Project> {
    const userId = await getCurrentUserId();
    const created = createProject(userId, input);
    mutateDb((db) => {
      db.projects.push(created.project);
      db.locations.push(created.location);
      db.rooms.push(created.room);
      db.scenarios.push(...created.scenarios);
      db.configs.push(created.config);
    });
    return created.project;
  },

  async update(projectId: string, patch: Partial<Project>): Promise<Project> {
    await assertOwner(projectId);
    return mutateDb((db) => {
      const project = db.projects.find((p) => p.id === projectId)!;
      Object.assign(project, patch, { updatedAt: new Date().toISOString() });
      return project;
    });
  },

  async setStatus(projectId: string, status: ProjectStatus): Promise<void> {
    await this.update(projectId, { status });
  },

  async remove(projectId: string): Promise<void> {
    await assertOwner(projectId);
    mutateDb((db) => {
      db.projects = db.projects.filter((p) => p.id !== projectId);
      db.locations = db.locations.filter((l) => l.projectId !== projectId);
      db.rooms = db.rooms.filter((r) => r.projectId !== projectId);
      db.images = db.images.filter((i) => i.projectId !== projectId);
      db.scenarios = db.scenarios.filter((s) => s.projectId !== projectId);
      db.items = db.items.filter((i) => i.projectId !== projectId);
      db.estimates = db.estimates.filter((e) => e.projectId !== projectId);
      db.configs = db.configs.filter((c) => c.projectId !== projectId);
    });
  },

  async addScenario(projectId: string, type: ScenarioType, name?: string): Promise<DesignScenario> {
    await assertOwner(projectId);
    const scenario = createScenario(projectId, type, name);
    mutateDb((db) => {
      db.scenarios.push(scenario);
      const p = db.projects.find((x) => x.id === projectId)!;
      p.activeScenarioId = scenario.id;
      p.updatedAt = new Date().toISOString();
    });
    return scenario;
  },

  async setActiveScenario(projectId: string, scenarioId: string): Promise<void> {
    await this.update(projectId, { activeScenarioId: scenarioId });
  },

  /**
   * Change the property location and EXPLICITLY recalculate the market: state,
   * sales-tax rate, per-item prices and labor rates. Never silent — the UI
   * confirms first. Existing estimates keep their frozen snapshot.
   */
  async changeLocation(projectId: string, loc: NewLocation): Promise<Project> {
    await assertOwner(projectId);
    const stateCode = loc.stateCode.toUpperCase();
    const state = stateService.get(stateCode);
    const tax = taxService.getTaxRate({ stateCode, city: loc.city, zipCode: loc.zipCode });

    return mutateDb((db) => {
      const project = db.projects.find((p) => p.id === projectId)!;
      project.stateCode = stateCode;
      project.updatedAt = new Date().toISOString();

      let location = db.locations.find((l) => l.projectId === projectId);
      if (!location) {
        location = {
          id: `loc_${projectId}`,
          projectId,
          address: "",
          city: "",
          state: "",
          stateCode,
          county: null,
          zipCode: "",
          latitude: null,
          longitude: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        db.locations.push(location);
      }
      location.address = loc.address ?? "";
      location.city = loc.city;
      location.stateCode = stateCode;
      location.state = state?.name ?? stateCode;
      location.zipCode = loc.zipCode;
      location.updatedAt = new Date().toISOString();

      db.items
        .filter((i) => i.projectId === projectId)
        .forEach((item) => {
          const resolved = pricingService.resolve(item.productId, stateCode);
          item.unitPrice = resolved.money.amount;
          item.currencyCode = "USD";
          item.priceSource = resolved.source;
          item.supplier = resolved.supplier;
          const product = productById(item.productId);
          if (product) {
            const rate = laborRateService.rate(stateCode, product.laborCategory);
            item.laborCost = rate && rate.unit === item.unit ? rate.cost : 0;
          }
          item.updatedAt = new Date().toISOString();
        });

      const config = db.configs.find((c) => c.projectId === projectId);
      if (config) {
        config.laborLines = defaultLaborLines(stateCode).map((fresh) => {
          const prev = config.laborLines.find((l) => l.category === fresh.category);
          return prev ? { ...fresh, quantity: prev.quantity, enabled: prev.enabled } : fresh;
        });
        config.settings.salesTaxRate = tax.rate;
      }
      return project;
    });
  },
};

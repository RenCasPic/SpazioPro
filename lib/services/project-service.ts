import type {
  DesignScenario,
  NewProject,
  Project,
  ProjectImage,
  ProjectItem,
  ProjectStatus,
  Room,
  ScenarioType,
} from "@/types";
import type { ProjectConfig } from "@/lib/db/schema";
import { mutateDb, readDb } from "@/lib/db/local-store";
import { createProject, createScenario, defaultSettings } from "@/lib/db/factories";
import { defaultLaborLines } from "@/data/labor";
import { getCurrentUserId } from "@/lib/auth/auth";
import { countryService } from "@/lib/market/country-service";
import { taxService } from "@/lib/market/tax-service";
import { laborRateService } from "@/lib/market/labor-rate-service";
import { pricingService } from "@/lib/market/pricing-service";
import { productById } from "@/data/catalog";


export interface ProjectBundle {
  project: Project;
  rooms: Room[];
  images: ProjectImage[];
  scenarios: DesignScenario[];
  items: ProjectItem[];
  config: ProjectConfig;
}

export interface ProjectListEntry {
  project: Project;
  clientName: string | null;
  thumbnailUrl: string | null;
  itemCount: number;
}

async function assertOwner(projectId: string): Promise<Project> {
  const userId = await getCurrentUserId();
  const project = readDb().projects.find((p) => p.id === projectId);
  if (!project || project.userId !== userId) throw new Error("Proyecto no encontrado");
  return project;
}

export const projectService = {
  async list(): Promise<ProjectListEntry[]> {
    const userId = await getCurrentUserId();
    const db = readDb();
    return db.projects
      .filter((p) => p.userId === userId)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .map((project) => ({
        project,
        clientName: db.clients.find((c) => c.id === project.clientId)?.name ?? null,
        thumbnailUrl:
          db.images.find((i) => i.projectId === project.id && i.type === "original")?.originalUrl ??
          null,
        itemCount: db.items.filter(
          (i) => i.projectId === project.id && i.scenarioId === project.activeScenarioId,
        ).length,
      }));
  },

  async get(projectId: string): Promise<ProjectBundle | null> {
    const userId = await getCurrentUserId();
    const db = readDb();
    const project = db.projects.find((p) => p.id === projectId && p.userId === userId);
    if (!project) return null;
    return {
      project,
      rooms: db.rooms.filter((r) => r.projectId === projectId),
      images: db.images.filter((i) => i.projectId === projectId),
      scenarios: db.scenarios
        .filter((s) => s.projectId === projectId)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
      items: db.items.filter((i) => i.projectId === projectId),
      config:
        db.configs.find((c) => c.projectId === projectId) ?? {
          projectId,
          laborLines: defaultLaborLines(project.countryCode),
          settings: { ...defaultSettings(), vatRate: project.taxRate },
        },
    };
  },

  async create(input: NewProject): Promise<Project> {
    const userId = await getCurrentUserId();
    const created = createProject(userId, input);
    mutateDb((db) => {
      db.projects.push(created.project);
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
      db.rooms = db.rooms.filter((r) => r.projectId !== projectId);
      db.images = db.images.filter((i) => i.projectId !== projectId);
      db.scenarios = db.scenarios.filter((s) => s.projectId !== projectId);
      db.items = db.items.filter((i) => i.projectId !== projectId);
      db.estimates = db.estimates.filter((e) => e.projectId !== projectId);
      db.configs = db.configs.filter((c) => c.projectId !== projectId);
    });
  },

  async addScenario(projectId: string, type: ScenarioType, name?: string): Promise<DesignScenario> {
    const project = await assertOwner(projectId);
    const scenario = {
      ...createScenario(projectId, type, name),
      currencyCode: project.currencyCode,
    };
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
   * Change the project's country and EXPLICITLY recalculate the market:
   * currency, locale, tax rate, per-item prices and labour rates.
   * Never called silently — the UI confirms first.
   */
  async changeCountry(projectId: string, countryCode: string): Promise<Project> {
    await assertOwner(projectId);
    const country = countryService.require(countryCode);
    return mutateDb((db) => {
      const project = db.projects.find((p) => p.id === projectId)!;
      project.countryCode = country.code;
      project.currencyCode = country.currencyCode;
      project.locale = country.locale;
      project.taxRate = taxService.defaultRate(country.code);
      project.measurementSystem = country.measurementSystem;
      project.updatedAt = new Date().toISOString();

      db.scenarios
        .filter((s) => s.projectId === projectId)
        .forEach((s) => (s.currencyCode = country.currencyCode));

      db.items
        .filter((i) => i.projectId === projectId)
        .forEach((item) => {
          const resolved = pricingService.resolve(item.productId, country.code);
          item.unitPrice = resolved.money.amount;
          item.currencyCode = resolved.money.currency;
          item.priceSource = resolved.source;
          item.supplier = resolved.supplier;
          const product = productById(item.productId);
          if (product) {
            const rate = laborRateService.rate(country.code, product.laborCategory);
            item.laborCost = rate ? unitLabor(rate, item.unit) : 0;
          }
          item.updatedAt = new Date().toISOString();
        });

      const config = db.configs.find((c) => c.projectId === projectId);
      if (config) {
        config.laborLines = defaultLaborLines(country.code).map((fresh) => {
          const prev = config.laborLines.find((l) => l.category === fresh.category);
          return prev ? { ...fresh, quantity: prev.quantity, enabled: prev.enabled } : fresh;
        });
        config.settings.vatRate = project.taxRate;
      }
      return project;
    });
  },
};

function unitLabor(rate: { cost: number; unit: string }, itemUnit: string): number {
  // if the labour rate is per-hour but the item is per-m2, keep 0 (assign manually)
  return rate.unit === itemUnit ? rate.cost : 0;
}

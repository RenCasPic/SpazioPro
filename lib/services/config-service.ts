import type { EstimateSettings, LaborLine } from "@/types";
import type { ProjectConfig } from "@/lib/db/schema";
import { mutateDb, readDb } from "@/lib/db/local-store";
import { defaultLaborLines } from "@/data/labor";
import { defaultSettings } from "@/lib/db/factories";
import { uid } from "@/lib/utils";

function ensure(projectId: string): ProjectConfig {
  const db = readDb();
  let config = db.configs.find((c) => c.projectId === projectId);
  if (!config) {
    const project = db.projects.find((p) => p.id === projectId);
    config = {
      projectId,
      laborLines: defaultLaborLines(project?.countryCode ?? "ES"),
      settings: { ...defaultSettings(), vatRate: project?.taxRate ?? 21 },
    };
    mutateDb((store) => store.configs.push(config!));
  }
  return config;
}

export const configService = {
  async get(projectId: string): Promise<ProjectConfig> {
    return ensure(projectId);
  },

  async updateSettings(projectId: string, patch: Partial<EstimateSettings>): Promise<void> {
    ensure(projectId);
    mutateDb((db) => {
      const config = db.configs.find((c) => c.projectId === projectId)!;
      config.settings = { ...config.settings, ...patch };
    });
  },

  async updateLaborLine(projectId: string, lineId: string, patch: Partial<LaborLine>): Promise<void> {
    ensure(projectId);
    mutateDb((db) => {
      const config = db.configs.find((c) => c.projectId === projectId)!;
      const line = config.laborLines.find((l) => l.id === lineId);
      if (line) Object.assign(line, patch);
    });
  },

  async addLaborLine(projectId: string): Promise<void> {
    ensure(projectId);
    const currencyCode = readDb().projects.find((p) => p.id === projectId)?.currencyCode ?? "EUR";
    mutateDb((db) => {
      const c = db.configs.find((x) => x.projectId === projectId)!;
      c.laborLines.push({
        id: uid("lab"),
        label: "Nueva partida",
        category: "general",
        unit: "global",
        quantity: 1,
        unitCost: 0,
        currencyCode,
        enabled: true,
        fromMarket: false,
      });
    });
  },

  async removeLaborLine(projectId: string, lineId: string): Promise<void> {
    mutateDb((db) => {
      const config = db.configs.find((c) => c.projectId === projectId);
      if (config) config.laborLines = config.laborLines.filter((l) => l.id !== lineId);
    });
  },
};

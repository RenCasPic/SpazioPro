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
      laborLines: defaultLaborLines(project?.stateCode ?? "TX"),
      settings: defaultSettings(0),
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
      config.settings = {
        ...config.settings,
        ...patch,
        extras: { ...config.settings.extras, ...(patch.extras ?? {}) },
      };
    });
  },

  async updateLaborLine(projectId: string, lineId: string, patch: Partial<LaborLine>): Promise<void> {
    ensure(projectId);
    mutateDb((db) => {
      const line = db.configs.find((c) => c.projectId === projectId)?.laborLines.find((l) => l.id === lineId);
      if (line) Object.assign(line, patch);
    });
  },

  async addLaborLine(projectId: string): Promise<void> {
    ensure(projectId);
    mutateDb((db) => {
      db.configs
        .find((c) => c.projectId === projectId)!
        .laborLines.push({
          id: uid("lab"),
          label: "New line item",
          category: "general_labor",
          unit: "hour",
          quantity: 1,
          unitCost: 0,
          currencyCode: "USD",
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

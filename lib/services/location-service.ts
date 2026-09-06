import type { ProjectLocation } from "@/types";
import { readDb } from "@/lib/db/local-store";
import { getCurrentUserId } from "@/lib/auth/auth";
import { taxService } from "@/lib/market/tax-service";

export const locationService = {
  async forProject(projectId: string): Promise<ProjectLocation | null> {
    const userId = await getCurrentUserId();
    const db = readDb();
    const project = db.projects.find((p) => p.id === projectId && p.userId === userId);
    if (!project) return null;
    return db.locations.find((l) => l.projectId === projectId) ?? null;
  },

  /** Resolve the sales-tax rate for a project's location. */
  async taxRateForProject(projectId: string) {
    const loc = await this.forProject(projectId);
    if (!loc) return taxService.getTaxRate({});
    return taxService.getTaxRate({
      stateCode: loc.stateCode,
      city: loc.city,
      zipCode: loc.zipCode,
      county: loc.county ?? undefined,
    });
  },
};

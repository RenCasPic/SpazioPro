import type { LaborCategory, ScopeSection } from "@/types";
import { mutateDb, readDb } from "@/lib/db/local-store";
import { getCurrentUserId } from "@/lib/auth/auth";
import { uid } from "@/lib/utils";

async function assertOwner(projectId: string): Promise<void> {
  const userId = await getCurrentUserId();
  const project = readDb().projects.find((p) => p.id === projectId);
  if (!project || project.userId !== userId) throw new Error("Project not found");
}

export interface NewScopeSection {
  projectId: string;
  scenarioId: string;
  category: LaborCategory;
  name: string;
  markupPercent?: number;
  contingencyPercent?: number;
}

/**
 * Scope of Work sections — a trade grouping that can carry its own markup and
 * contingency (see lib/calculations/scopes.ts for the rollup math). A section
 * does not own items; it groups the project's existing items by the trade of
 * their product, so nothing is ever stored twice.
 */
export const scopeService = {
  async list(projectId: string): Promise<ScopeSection[]> {
    await assertOwner(projectId);
    return readDb()
      .scopeSections.filter((s) => s.projectId === projectId)
      .sort((a, b) => a.order - b.order);
  },

  async add(input: NewScopeSection): Promise<ScopeSection> {
    await assertOwner(input.projectId);
    const db = readDb();
    const order = db.scopeSections.filter((s) => s.projectId === input.projectId).length;
    const now = new Date().toISOString();
    const section: ScopeSection = {
      id: uid("scp"),
      projectId: input.projectId,
      scenarioId: input.scenarioId,
      category: input.category,
      name: input.name,
      markupPercent: input.markupPercent ?? 0,
      contingencyPercent: input.contingencyPercent ?? 0,
      notes: "",
      order,
      createdAt: now,
      updatedAt: now,
    };
    mutateDb((store) => store.scopeSections.push(section));
    return section;
  },

  async update(
    id: string,
    patch: Partial<Pick<ScopeSection, "name" | "markupPercent" | "contingencyPercent" | "notes" | "order">>,
  ): Promise<void> {
    mutateDb((db) => {
      const s = db.scopeSections.find((x) => x.id === id);
      if (s) Object.assign(s, patch, { updatedAt: new Date().toISOString() });
    });
  },

  async remove(id: string): Promise<void> {
    mutateDb((db) => {
      db.scopeSections = db.scopeSections.filter((s) => s.id !== id);
    });
  },
};

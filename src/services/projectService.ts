import type { Project, RoomType, Scenario } from "@/types";
import { uid } from "@/lib/utils";
import { defaultLaborLines } from "@/data/labor";

const STORAGE_KEY = "spaziopro.projects.v1";

/**
 * Persistence layer. Currently backed by localStorage so the app is fully
 * usable with zero backend. To move to Supabase, implement the same method
 * signatures against a `projects` table (see /supabase/schema.sql) and swap
 * the export — every caller already awaits these methods.
 */
export interface ProjectRepository {
  list(): Promise<Project[]>;
  get(id: string): Promise<Project | null>;
  save(project: Project): Promise<Project>;
  remove(id: string): Promise<void>;
}

function read(): Project[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Project[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function write(projects: Project[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  } catch {
    /* quota / private mode — ignore, state still lives in memory */
  }
}

export const localRepository: ProjectRepository = {
  async list() {
    return read().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  },
  async get(id) {
    return read().find((p) => p.id === id) ?? null;
  },
  async save(project) {
    const all = read();
    const idx = all.findIndex((p) => p.id === project.id);
    const next = { ...project, updatedAt: new Date().toISOString() };
    if (idx >= 0) all[idx] = next;
    else all.push(next);
    write(all);
    return next;
  },
  async remove(id) {
    write(read().filter((p) => p.id !== id));
  },
};

export const projectService: ProjectRepository = localRepository;

export function defaultScenarios(): Scenario[] {
  return [
    { id: uid("scn"), name: "Estándar", tier: "standard" },
    { id: uid("scn"), name: "Económico", tier: "economy" },
    { id: uid("scn"), name: "Premium", tier: "premium" },
  ];
}

export function createProject(input: { name: string; roomType: RoomType }): Project {
  const scenarios = defaultScenarios();
  const now = new Date().toISOString();
  return {
    id: uid("prj"),
    name: input.name.trim() || "Proyecto sin título",
    roomType: input.roomType,
    status: "draft",
    createdAt: now,
    updatedAt: now,
    dimensions: { width: 4, length: 5, height: 2.6, estimated: true },
    scenarios,
    activeScenarioId: scenarios[0].id,
    items: [],
    labor: defaultLaborLines(),
    settings: {
      vatPct: 21,
      transport: 120,
      discountPct: 0,
      companyName: "Estudio SpazioPro",
      companyTagline: "Reformas e interiorismo",
    },
  };
}

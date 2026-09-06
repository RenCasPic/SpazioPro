"use client";

import { create } from "zustand";
import type {
  LaborLine,
  Product,
  Project,
  ProjectItem,
  Scenario,
  SurfaceKind,
} from "@/types";
import { createProject, projectService } from "@/services/projectService";
import { categoryMeta } from "@/data/categories";
import { uid } from "@/lib/utils";
import { baseQuantityForSurface, withWaste } from "@/lib/calc";

/* ------------------------------------------------------------------ */
/*  Dashboard store                                                     */
/* ------------------------------------------------------------------ */

interface ProjectsState {
  projects: Project[];
  loaded: boolean;
  refresh: () => Promise<void>;
  create: (input: { name: string; roomType: Project["roomType"] }) => Promise<Project>;
  remove: (id: string) => Promise<void>;
}

export const useProjects = create<ProjectsState>((set) => ({
  projects: [],
  loaded: false,
  async refresh() {
    const projects = await projectService.list();
    set({ projects, loaded: true });
  },
  async create(input) {
    const project = createProject(input);
    const saved = await projectService.save(project);
    set((s) => ({ projects: [saved, ...s.projects] }));
    return saved;
  },
  async remove(id) {
    await projectService.remove(id);
    set((s) => ({ projects: s.projects.filter((p) => p.id !== id) }));
  },
}));

/* ------------------------------------------------------------------ */
/*  Editor store (single active project + undo/redo)                    */
/* ------------------------------------------------------------------ */

interface EditorState {
  project: Project | null;
  past: Project[];
  future: Project[];
  status: "idle" | "loading" | "ready" | "missing";
  selectedItemId: string | null;
  activeSurface: SurfaceKind | null;

  load: (id: string) => Promise<void>;
  select: (id: string | null) => void;
  setActiveSurface: (s: SurfaceKind | null) => void;

  mutate: (fn: (draft: Project) => void, opts?: { history?: boolean }) => void;
  undo: () => void;
  redo: () => void;

  addProduct: (product: Product, surface?: SurfaceKind) => void;
  updateItem: (id: string, patch: Partial<ProjectItem>) => void;
  transformItem: (id: string, patch: Partial<ProjectItem["transform"]>) => void;
  removeItem: (id: string) => void;
  duplicateItem: (id: string) => void;

  setScenario: (id: string) => void;
  addScenario: (name: string) => void;

  setDimensions: (patch: Partial<Project["dimensions"]>) => void;
  updateLabor: (id: string, patch: Partial<LaborLine>) => void;
  addLabor: () => void;
  removeLabor: (id: string) => void;
  updateSettings: (patch: Partial<Project["settings"]>) => void;
  setStatus: (status: Project["status"]) => void;
}

const MAX_HISTORY = 50;
let saveTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleSave(project: Project) {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    void projectService.save(project);
  }, 400);
}

function clone<T>(v: T): T {
  return typeof structuredClone === "function"
    ? structuredClone(v)
    : JSON.parse(JSON.stringify(v));
}

export const useEditor = create<EditorState>((set, get) => ({
  project: null,
  past: [],
  future: [],
  status: "idle",
  selectedItemId: null,
  activeSurface: null,

  async load(id) {
    set({ status: "loading" });
    const project = await projectService.get(id);
    if (!project) {
      set({ status: "missing", project: null });
      return;
    }
    set({ project, past: [], future: [], status: "ready", selectedItemId: null });
  },

  select(id) {
    set({ selectedItemId: id });
  },

  setActiveSurface(s) {
    set({ activeSurface: s });
  },

  mutate(fn, opts = { history: true }) {
    const current = get().project;
    if (!current) return;
    const draft = clone(current);
    fn(draft);
    draft.updatedAt = new Date().toISOString();
    set((s) => ({
      project: draft,
      past: opts.history ? [...s.past, current].slice(-MAX_HISTORY) : s.past,
      future: opts.history ? [] : s.future,
    }));
    scheduleSave(draft);
  },

  undo() {
    const { past, project, future } = get();
    if (!past.length || !project) return;
    const previous = past[past.length - 1];
    set({
      project: previous,
      past: past.slice(0, -1),
      future: [project, ...future].slice(0, MAX_HISTORY),
    });
    scheduleSave(previous);
  },

  redo() {
    const { future, project, past } = get();
    if (!future.length || !project) return;
    const next = future[0];
    set({
      project: next,
      future: future.slice(1),
      past: [...past, project].slice(-MAX_HISTORY),
    });
    scheduleSave(next);
  },

  addProduct(product, surface) {
    const { project } = get();
    if (!project) return;
    const meta = categoryMeta(product.category);
    const kind = meta.kind;
    const resolvedSurface = surface ?? meta.surface;
    const wastePct = product.category === "tile" || product.category === "stone" ? 12 : product.category === "paint" ? 5 : 10;

    const item: ProjectItem = {
      id: uid("itm"),
      productId: product.id,
      scenarioId: project.activeScenarioId,
      kind,
      surface: kind === "surface" ? resolvedSurface : undefined,
      name: product.name,
      category: product.category,
      brand: product.brand,
      unit: product.unit,
      unitPrice: product.price,
      laborPrice: product.labor,
      quantity:
        kind === "surface"
          ? withWaste(baseQuantityForSurface(resolvedSurface, project.dimensions, product.unit), wastePct)
          : 1,
      quantityAuto: kind === "surface",
      wastePct,
      transform: {
        x: 50,
        y: kind === "object" ? 62 : 50,
        scale: 1,
        rotation: 0,
      },
    };

    get().mutate((d) => {
      if (kind === "surface" && resolvedSurface) {
        // one surface material per surface per scenario — replace
        d.items = d.items.filter(
          (it) =>
            !(
              it.kind === "surface" &&
              it.surface === resolvedSurface &&
              it.scenarioId === d.activeScenarioId
            ),
        );
      }
      d.items.push(item);
      if (d.status === "draft") d.status = "designing";
    });
    set({ selectedItemId: item.id });
  },

  updateItem(id, patch) {
    get().mutate((d) => {
      const it = d.items.find((x) => x.id === id);
      if (!it) return;
      Object.assign(it, patch);
      if (patch.quantity !== undefined) it.quantityAuto = false;
    });
  },

  transformItem(id, patch) {
    get().mutate(
      (d) => {
        const it = d.items.find((x) => x.id === id);
        if (it) Object.assign(it.transform, patch);
      },
      { history: false },
    );
  },

  removeItem(id) {
    get().mutate((d) => {
      d.items = d.items.filter((x) => x.id !== id);
    });
    if (get().selectedItemId === id) set({ selectedItemId: null });
  },

  duplicateItem(id) {
    const src = get().project?.items.find((x) => x.id === id);
    if (!src) return;
    const copy: ProjectItem = {
      ...clone(src),
      id: uid("itm"),
      transform: { ...src.transform, x: Math.min(92, src.transform.x + 6), y: Math.min(92, src.transform.y + 6) },
    };
    get().mutate((d) => {
      d.items.push(copy);
    });
    set({ selectedItemId: copy.id });
  },

  setScenario(id) {
    get().mutate((d) => {
      d.activeScenarioId = id;
    }, { history: false });
    set({ selectedItemId: null });
  },

  addScenario(name) {
    const scn: Scenario = { id: uid("scn"), name: name.trim() || "Escenario", tier: "custom" };
    get().mutate((d) => {
      d.scenarios.push(scn);
      d.activeScenarioId = scn.id;
    });
  },

  setDimensions(patch) {
    get().mutate((d) => {
      Object.assign(d.dimensions, patch);
      if (patch.width !== undefined || patch.length !== undefined || patch.height !== undefined) {
        d.dimensions.estimated = false;
      }
    });
  },

  updateLabor(id, patch) {
    get().mutate((d) => {
      const l = d.labor.find((x) => x.id === id);
      if (l) Object.assign(l, patch);
    });
  },

  addLabor() {
    get().mutate((d) => {
      d.labor.push({ id: uid("lab"), label: "Nueva partida", unit: "global", quantity: 1, price: 0, enabled: true });
    });
  },

  removeLabor(id) {
    get().mutate((d) => {
      d.labor = d.labor.filter((x) => x.id !== id);
    });
  },

  updateSettings(patch) {
    get().mutate((d) => {
      Object.assign(d.settings, patch);
    });
  },

  setStatus(status) {
    get().mutate((d) => {
      d.status = status;
    }, { history: false });
  },
}));

/** Items belonging to the active scenario. */
export function activeItems(project: Project): ProjectItem[] {
  return project.items.filter((it) => it.scenarioId === project.activeScenarioId);
}

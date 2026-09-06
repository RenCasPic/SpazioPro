"use client";

import { create } from "zustand";
import type {
  DesignScenario,
  EditorTransform,
  EstimateSettings,
  LaborLine,
  Product,
  ProjectItem,
  RoomDimensions,
  ScenarioType,
} from "@/types";
import type { SurfaceKind } from "@/lib/constants";
import { projectService, type ProjectBundle } from "@/lib/services/project-service";
import { itemService } from "@/lib/services/item-service";
import { roomService } from "@/lib/services/room-service";
import { configService } from "@/lib/services/config-service";
import { imageService } from "@/lib/services/image-service";
import { restoreProjectState, type EditorSnapshot } from "@/lib/services/editor-state";
import { imageGeneration } from "@/lib/ai/image-generation";

type Status = "idle" | "loading" | "ready" | "missing";

interface EditorState {
  bundle: ProjectBundle | null;
  status: Status;
  selectedItemId: string | null;
  activeSurface: SurfaceKind | null;
  past: EditorSnapshot[];
  future: EditorSnapshot[];
  applying: string | null;

  load: (projectId: string) => Promise<void>;
  reload: () => Promise<void>;
  select: (id: string | null) => void;
  setActiveSurface: (s: SurfaceKind | null) => void;

  addProduct: (product: Product, surface?: SurfaceKind) => Promise<void>;
  updateItem: (id: string, patch: Partial<ProjectItem>, opts?: { history?: boolean }) => Promise<void>;
  setTransform: (id: string, patch: Partial<EditorTransform>) => void;
  commitTransform: () => void;
  removeItem: (id: string) => Promise<void>;
  duplicateItem: (id: string) => Promise<void>;

  setDimensions: (dims: Partial<RoomDimensions>) => Promise<void>;
  setScenario: (id: string) => Promise<void>;
  addScenario: (type: ScenarioType, name?: string) => Promise<DesignScenario | undefined>;
  changeCountry: (code: string) => Promise<void>;

  updateLaborLine: (id: string, patch: Partial<LaborLine>) => Promise<void>;
  addLaborLine: () => Promise<void>;
  removeLaborLine: (id: string) => Promise<void>;
  updateSettings: (patch: Partial<EstimateSettings>) => Promise<void>;

  undo: () => void;
  redo: () => void;
}

const MAX_HISTORY = 40;

function snapshot(bundle: ProjectBundle): EditorSnapshot {
  return {
    items: bundle.items.map((i) => structuredClone(i)),
    laborLines: bundle.config.laborLines.map((l) => ({ ...l })),
    settings: { ...bundle.config.settings, transport: { ...bundle.config.settings.transport } },
  };
}

export const useEditor = create<EditorState>((set, get) => ({
  bundle: null,
  status: "idle",
  selectedItemId: null,
  activeSurface: null,
  past: [],
  future: [],
  applying: null,

  async load(projectId) {
    set({ status: "loading" });
    const bundle = await projectService.get(projectId);
    set({
      bundle,
      status: bundle ? "ready" : "missing",
      past: [],
      future: [],
      selectedItemId: null,
      activeSurface: null,
    });
  },

  async reload() {
    const id = get().bundle?.project.id;
    if (!id) return;
    set({ bundle: await projectService.get(id) });
  },

  select(id) {
    set({ selectedItemId: id });
  },
  setActiveSurface(s) {
    set({ activeSurface: s, selectedItemId: null });
  },

  async addProduct(product, surface) {
    const bundle = get().bundle;
    if (!bundle) return;
    pushHistory(get, set);
    set({ applying: product.id });
    try {
      const image = bundle.images.find((i) => i.type === "original");
      const item = await itemService.add({ projectId: bundle.project.id, product, surface });
      if (item.kind === "surface" && image) {
        const res = await imageGeneration.applyMaterial({
          imageUrl: image.originalUrl,
          product,
          surface: item.surface,
        });
        if (res.cssFilter) await imageService.setDesignFilter(bundle.project.id, res.cssFilter);
      }
      await get().reload();
      set({ selectedItemId: item.id, applying: null });
    } catch {
      set({ applying: null });
    }
  },

  async updateItem(id, patch, opts = { history: true }) {
    if (opts.history) pushHistory(get, set);
    await itemService.update(id, patch);
    await get().reload();
  },

  setTransform(id, patch) {
    set((s) => {
      if (!s.bundle) return s;
      const items = s.bundle.items.map((it) =>
        it.id === id ? { ...it, transform: { ...it.transform, ...patch } } : it,
      );
      return { bundle: { ...s.bundle, items } };
    });
  },

  commitTransform() {
    const bundle = get().bundle;
    const id = get().selectedItemId;
    if (!bundle || !id) return;
    pushHistory(get, set);
    const item = bundle.items.find((i) => i.id === id);
    if (item) void itemService.setTransform(id, item.transform).then(() => get().reload());
  },

  async removeItem(id) {
    pushHistory(get, set);
    await itemService.remove(id);
    if (get().selectedItemId === id) set({ selectedItemId: null });
    await get().reload();
  },

  async duplicateItem(id) {
    pushHistory(get, set);
    const copy = await itemService.duplicate(id);
    await get().reload();
    if (copy) set({ selectedItemId: copy.id });
  },

  async setDimensions(dims) {
    const bundle = get().bundle;
    const room = bundle?.rooms[0];
    if (!room) return;
    pushHistory(get, set);
    await roomService.setDimensions(room.id, dims, "manual");
    await get().reload();
  },

  async setScenario(id) {
    const bundle = get().bundle;
    if (!bundle) return;
    await projectService.setActiveScenario(bundle.project.id, id);
    set({ selectedItemId: null });
    await get().reload();
  },

  async addScenario(type, name) {
    const bundle = get().bundle;
    if (!bundle) return;
    const scenario = await projectService.addScenario(bundle.project.id, type, name);
    await itemService.cloneScenarioItems(bundle.project.id, bundle.project.activeScenarioId, scenario.id);
    await get().reload();
    return scenario;
  },

  async changeCountry(code) {
    const bundle = get().bundle;
    if (!bundle) return;
    await projectService.changeCountry(bundle.project.id, code);
    await get().reload();
  },

  async updateLaborLine(id, patch) {
    const bundle = get().bundle;
    if (!bundle) return;
    pushHistory(get, set);
    await configService.updateLaborLine(bundle.project.id, id, patch);
    await get().reload();
  },
  async addLaborLine() {
    const bundle = get().bundle;
    if (!bundle) return;
    pushHistory(get, set);
    await configService.addLaborLine(bundle.project.id);
    await get().reload();
  },
  async removeLaborLine(id) {
    const bundle = get().bundle;
    if (!bundle) return;
    pushHistory(get, set);
    await configService.removeLaborLine(bundle.project.id, id);
    await get().reload();
  },
  async updateSettings(patch) {
    const bundle = get().bundle;
    if (!bundle) return;
    pushHistory(get, set);
    await configService.updateSettings(bundle.project.id, patch);
    await get().reload();
  },

  undo() {
    const { past, bundle, future } = get();
    if (!past.length || !bundle) return;
    const previous = past[past.length - 1];
    restoreProjectState(bundle.project.id, previous);
    set({ past: past.slice(0, -1), future: [snapshot(bundle), ...future].slice(0, MAX_HISTORY) });
    void get().reload();
  },

  redo() {
    const { future, bundle, past } = get();
    if (!future.length || !bundle) return;
    const next = future[0];
    restoreProjectState(bundle.project.id, next);
    set({ future: future.slice(1), past: [...past, snapshot(bundle)].slice(-MAX_HISTORY) });
    void get().reload();
  },
}));

function pushHistory(
  get: () => EditorState,
  set: (partial: Partial<EditorState>) => void,
) {
  const bundle = get().bundle;
  if (!bundle) return;
  set({ past: [...get().past, snapshot(bundle)].slice(-MAX_HISTORY), future: [] });
}

/** Items of the currently active scenario. */
export function activeItems(bundle: ProjectBundle): ProjectItem[] {
  return bundle.items.filter((i) => i.scenarioId === bundle.project.activeScenarioId);
}

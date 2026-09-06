import type { EstimateSettings, LaborLine, ProjectItem } from "@/types";
import { mutateDb } from "@/lib/db/local-store";

export interface EditorSnapshot {
  items: ProjectItem[];
  laborLines: LaborLine[];
  settings: EstimateSettings;
}

/** Overwrite the mutable editor/budget state of a project (used by undo/redo). */
export function restoreProjectState(projectId: string, snapshot: EditorSnapshot): void {
  mutateDb((db) => {
    db.items = [
      ...db.items.filter((i) => i.projectId !== projectId),
      ...snapshot.items.map((i) => ({ ...i })),
    ];
    const config = db.configs.find((c) => c.projectId === projectId);
    if (config) {
      config.laborLines = snapshot.laborLines.map((l) => ({ ...l }));
      config.settings = { ...snapshot.settings, extras: { ...snapshot.settings.extras } };
    }
  });
}

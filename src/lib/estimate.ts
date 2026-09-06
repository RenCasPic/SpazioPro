import type { EstimateTotals, Project } from "@/types";
import { computeTotals } from "./calc";

export function scenarioItems(project: Project, scenarioId: string) {
  return project.items.filter((it) => it.scenarioId === scenarioId);
}

export function totalsForScenario(project: Project, scenarioId: string): EstimateTotals {
  return computeTotals(
    scenarioItems(project, scenarioId),
    project.labor,
    project.settings,
    project.dimensions,
  );
}

export function activeTotals(project: Project): EstimateTotals {
  return totalsForScenario(project, project.activeScenarioId);
}

/** Best headline figure for dashboard cards. */
export function headlineBudget(project: Project): number {
  return activeTotals(project).total;
}

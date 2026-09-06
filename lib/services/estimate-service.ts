import type {
  ConfidenceReport,
  Estimate,
  EstimateItem,
  EstimateTotals,
  ProjectItem,
} from "@/types";
import { mutateDb, readDb } from "@/lib/db/local-store";
import { getCurrentUserId } from "@/lib/auth/auth";
import { projectService, type ProjectBundle } from "./project-service";
import { transportService } from "@/lib/market/transport-service";
import { marketService } from "@/lib/market/market-service";
import {
  calculateEstimate,
  confidenceReport,
  resolveItemQuantity,
  type EstimateInput,
} from "@/lib/calculations/estimate";
import { nextEstimateNumber } from "@/lib/format";
import { uid } from "@/lib/utils";

function inputFor(bundle: ProjectBundle, scenarioId: string): EstimateInput {
  const room = bundle.rooms[0];
  const dimensions = room
    ? { width: room.width, length: room.length, height: room.height }
    : { width: 4, length: 5, height: 2.6 };
  return {
    items: bundle.items.filter((i) => i.scenarioId === scenarioId),
    dimensions,
    measurementSource: room?.measurementSource ?? "ai_estimate",
    laborLines: bundle.config.laborLines,
    transportRate: transportService.rateForCountry(bundle.project.countryCode),
    settings: bundle.config.settings,
    currency: bundle.project.currencyCode,
  };
}

export interface LiveEstimate {
  totals: EstimateTotals;
  confidence: ConfidenceReport;
  itemTotals: Record<string, { quantity: number; material: number; labor: number; total: number }>;
}

export const estimateService = {
  /** Non-persisted totals for the budget screen (recalculates on every read). */
  async computeLive(projectId: string, scenarioId?: string): Promise<LiveEstimate | null> {
    const bundle = await projectService.get(projectId);
    if (!bundle) return null;
    const sid = scenarioId ?? bundle.project.activeScenarioId;
    const input = inputFor(bundle, sid);
    const { totals, breakdown } = calculateEstimate(input);
    return {
      totals,
      confidence: confidenceReport(input),
      itemTotals: Object.fromEntries(
        breakdown.map((b) => [
          b.item.id,
          { quantity: b.quantity, material: b.materialCost, labor: b.laborCost, total: b.total },
        ]),
      ),
    };
  },

  async totalsForScenario(projectId: string, scenarioId: string): Promise<EstimateTotals | null> {
    const bundle = await projectService.get(projectId);
    if (!bundle) return null;
    return calculateEstimate(inputFor(bundle, scenarioId)).totals;
  },

  async list(projectId?: string): Promise<Estimate[]> {
    const userId = await getCurrentUserId();
    const db = readDb();
    const ownProjects = new Set(
      db.projects.filter((p) => p.userId === userId).map((p) => p.id),
    );
    return db.estimates
      .filter((e) => ownProjects.has(e.projectId) && (!projectId || e.projectId === projectId))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async get(estimateId: string): Promise<Estimate | null> {
    const userId = await getCurrentUserId();
    const db = readDb();
    const estimate = db.estimates.find((e) => e.id === estimateId);
    if (!estimate) return null;
    const project = db.projects.find((p) => p.id === estimate.projectId);
    return project?.userId === userId ? estimate : null;
  },

  /**
   * Generate a NEW estimate. Freezes a full market snapshot and a per-line
   * price snapshot so the document never changes retroactively.
   */
  async generate(projectId: string, scenarioId?: string): Promise<Estimate> {
    const userId = await getCurrentUserId();
    const bundle = await projectService.get(projectId);
    if (!bundle || bundle.project.userId !== userId) throw new Error("Proyecto no encontrado");

    const sid = scenarioId ?? bundle.project.activeScenarioId;
    const input = inputFor(bundle, sid);
    const { totals, breakdown } = calculateEstimate(input);
    const now = new Date().toISOString();

    const productIds = [...new Set(input.items.map((i) => i.productId))];
    const snapshot = marketService.snapshot(
      bundle.project.countryCode,
      bundle.config.settings.vatRate,
      productIds,
    );

    const estimateId = uid("est");
    const items: EstimateItem[] = breakdown.map((b) => lineFrom(b.item, b, estimateId, now));

    const estimate: Estimate = {
      id: estimateId,
      projectId,
      scenarioId: sid,
      estimateNumber: nextEstimateNumber(readDb().estimates.map((e) => e.estimateNumber)),
      countryCode: bundle.project.countryCode,
      currencyCode: bundle.project.currencyCode,
      taxRate: bundle.config.settings.vatRate,
      subtotalMaterials: totals.materials,
      subtotalLabor: totals.labor,
      subtotalTransport: totals.transport,
      subtotalOther: totals.other,
      discount: totals.discount,
      taxAmount: totals.tax,
      total: totals.total,
      notes: bundle.config.settings.notes,
      status: "final",
      marketSnapshot: snapshot,
      items,
      createdAt: now,
      updatedAt: now,
    };

    mutateDb((db) => {
      db.estimates.push(estimate);
      const scenario = db.scenarios.find((s) => s.id === sid);
      if (scenario) {
        scenario.totalEstimate = totals.total;
        scenario.updatedAt = now;
      }
      const project = db.projects.find((p) => p.id === projectId)!;
      if (project.status === "draft" || project.status === "designing" || project.status === "estimating") {
        project.status = "quoted";
      }
      project.updatedAt = now;
    });

    return estimate;
  },

  async setStatus(estimateId: string, status: Estimate["status"]): Promise<void> {
    mutateDb((db) => {
      const e = db.estimates.find((x) => x.id === estimateId);
      if (e) {
        e.status = status;
        e.updatedAt = new Date().toISOString();
      }
    });
  },
};

function lineFrom(
  item: ProjectItem,
  b: { quantity: number; materialCost: number; laborCost: number; total: number },
  estimateId: string,
  now: string,
): EstimateItem {
  return {
    id: uid("eli"),
    estimateId,
    projectItemId: item.id,
    description: item.name,
    category: item.category,
    quantity: b.quantity,
    unit: item.unit,
    unitPrice: item.unitPrice,
    laborPrice: item.laborCost,
    total: b.total,
    priceSnapshot: {
      price: item.unitPrice,
      currency: item.currencyCode,
      supplier: item.supplier,
      source: item.priceSource,
      capturedAt: now,
    },
  };
}

export { resolveItemQuantity };

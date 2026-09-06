import type {
  ConfidenceReport,
  Estimate,
  EstimateItem,
  EstimateKind,
  EstimateTotals,
  ProjectItem,
} from "@/types";
import type { Locale } from "@/lib/i18n/config";
import { mutateDb, readDb } from "@/lib/db/local-store";
import { getCurrentUserId } from "@/lib/auth/auth";
import { projectService, type ProjectBundle } from "./project-service";
import { marketService } from "@/lib/market/market-service";
import { taxService } from "@/lib/market/tax-service";
import {
  calculateEstimate,
  confidenceReport,
  resolveItemQuantity,
  type EstimateInput,
} from "@/lib/calculations/estimate";
import { nextEstimateNumber } from "@/lib/format";
import { uid } from "@/lib/utils";

function taxResolved(bundle: ProjectBundle) {
  const loc = bundle.location;
  if (!loc) return { rate: 0, matchedOn: "none" as const };
  const r = taxService.getTaxRate({
    stateCode: loc.stateCode,
    city: loc.city,
    zipCode: loc.zipCode,
    county: loc.county ?? undefined,
  });
  return { rate: r.rate, matchedOn: r.matchedOn };
}

function inputFor(bundle: ProjectBundle, scenarioId: string): EstimateInput {
  const room = bundle.rooms[0];
  const dimensions = room
    ? { widthIn: room.widthIn, lengthIn: room.lengthIn, heightIn: room.heightIn }
    : { widthIn: 144, lengthIn: 180, heightIn: 108 };
  const tax = taxResolved(bundle);
  return {
    items: bundle.items.filter((i) => i.scenarioId === scenarioId),
    dimensions,
    measurementSource: room?.measurementSource ?? "ai_estimate",
    laborLines: bundle.config.laborLines,
    settings: bundle.config.settings,
    currency: "USD",
    hasTaxJurisdiction: tax.matchedOn !== "none",
  };
}

export interface LiveEstimate {
  totals: EstimateTotals;
  confidence: ConfidenceReport;
  itemTotals: Record<string, { quantity: number; material: number; labor: number; total: number }>;
}

export const estimateService = {
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
    const own = new Set(db.projects.filter((p) => p.userId === userId).map((p) => p.id));
    return db.estimates
      .filter((e) => own.has(e.projectId) && (!projectId || e.projectId === projectId))
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

  async generate(
    projectId: string,
    opts: { scenarioId?: string; kind?: EstimateKind; language?: Locale } = {},
  ): Promise<Estimate> {
    const userId = await getCurrentUserId();
    const bundle = await projectService.get(projectId);
    if (!bundle || bundle.project.userId !== userId) throw new Error("Project not found");

    const sid = opts.scenarioId ?? bundle.project.activeScenarioId;
    const kind: EstimateKind = opts.kind ?? "estimate";
    const language: Locale = opts.language ?? bundle.project.estimateLanguage;
    const input = inputFor(bundle, sid);
    const { totals, breakdown } = calculateEstimate(input);
    const now = new Date().toISOString();

    const loc = bundle.location;
    const location = {
      stateCode: loc?.stateCode ?? bundle.project.stateCode,
      city: loc?.city ?? "",
      zipCode: loc?.zipCode ?? "",
      county: loc?.county ?? null,
    };
    const productIds = [...new Set(input.items.map((i) => i.productId))];
    const snapshot = marketService.snapshot(location, productIds);

    const estimateId = uid("est");
    const items: EstimateItem[] = breakdown.map((b) => lineFrom(b.item, b, estimateId, now));
    const s = bundle.config.settings;

    const estimate: Estimate = {
      id: estimateId,
      projectId,
      scenarioId: sid,
      kind,
      estimateNumber: nextEstimateNumber(readDb().estimates.map((e) => e.estimateNumber)),
      language,
      countryCode: "US",
      stateCode: location.stateCode,
      city: location.city,
      zipCode: location.zipCode,
      currencyCode: "USD",
      salesTaxRate: s.salesTaxRate,
      scopeOfWork: s.scopeOfWork,
      subtotalMaterials: totals.materials,
      subtotalLabor: totals.labor,
      subtotalEquipment: totals.equipment,
      subtotalDelivery: totals.delivery,
      subtotalDisposal: totals.disposal,
      subtotalPermits: totals.permits,
      subtotalOther: totals.other,
      discount: totals.discount,
      taxAmount: totals.tax,
      total: totals.total,
      notes: s.notes,
      status: "final",
      marketSnapshot: snapshot,
      items,
      createdAt: now,
      updatedAt: now,
    };

    mutateDb((db) => {
      db.estimates.push(estimate);
      const scenario = db.scenarios.find((x) => x.id === sid);
      if (scenario) {
        scenario.totalEstimate = totals.total;
        scenario.updatedAt = now;
      }
      const project = db.projects.find((p) => p.id === projectId)!;
      if (["draft", "designing", "estimating"].includes(project.status)) project.status = "quoted";
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

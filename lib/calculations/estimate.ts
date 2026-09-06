import type {
  ConfidenceReport,
  CurrencyCode,
  EstimateSettings,
  EstimateTotals,
  LaborLine,
  MeasurementSource,
  ProjectItem,
  RoomDimensions,
} from "@/types";
import { baseSurfaceQuantity } from "./dimensions";
import { calculateWaste, calculateMaterialCost } from "./materials";
import { calculateItemLabor, calculateLabor } from "./labor";
import { applyDiscount, calculateTaxes } from "./taxes";
import { round, sum } from "./money";

export interface EstimateInput {
  items: ProjectItem[];
  dimensions: RoomDimensions;
  measurementSource: MeasurementSource;
  laborLines: LaborLine[];
  settings: EstimateSettings;
  currency: CurrencyCode;
  /** whether a sales-tax jurisdiction was resolved for the project location */
  hasTaxJurisdiction: boolean;
}

export interface ItemBreakdown {
  item: ProjectItem;
  quantity: number;
  materialCost: number;
  laborCost: number;
  total: number;
}

export function resolveItemQuantity(item: ProjectItem, dimensions: RoomDimensions): number {
  if (item.kind === "object" || !item.quantityAuto) return item.quantity;
  const base = baseSurfaceQuantity(item.surface, dimensions, item.unit);
  return calculateWaste(base, item.wastePercent);
}

export function itemBreakdown(item: ProjectItem, dimensions: RoomDimensions): ItemBreakdown {
  const quantity = resolveItemQuantity(item, dimensions);
  const materialCost = calculateMaterialCost(quantity, item.unitPrice);
  const laborCost = calculateItemLabor(quantity, item.laborCost);
  return { item, quantity, materialCost, laborCost, total: round(materialCost + laborCost) };
}

export function calculateEstimate(input: EstimateInput): {
  totals: EstimateTotals;
  breakdown: ItemBreakdown[];
} {
  const breakdown = input.items.map((it) => itemBreakdown(it, input.dimensions));

  const materials = round(sum(breakdown.map((b) => b.materialCost)));
  const itemLabor = sum(breakdown.map((b) => b.laborCost));
  const extraLabor = calculateLabor(input.laborLines);
  const labor = round(itemLabor + extraLabor);

  const { equipment, delivery, disposal, permits, other } = input.settings.extras;
  const extrasTotal = round(equipment + delivery + disposal + permits + other);

  const subtotal = round(materials + labor + extrasTotal);
  const discount = applyDiscount(subtotal, input.settings.discountPercent);
  const taxable = round(subtotal - discount);
  const tax = calculateTaxes(taxable, input.settings.salesTaxRate);
  const total = round(taxable + tax);

  return {
    breakdown,
    totals: {
      materials,
      labor,
      equipment: round(equipment),
      delivery: round(delivery),
      disposal: round(disposal),
      permits: round(permits),
      other: round(other),
      subtotal,
      discount,
      taxable,
      tax,
      total,
      currency: input.currency,
    },
  };
}

/** Returns i18n keys under `estimates.confidence_reasons`. */
export function confidenceReport(input: EstimateInput): ConfidenceReport {
  const reasons: string[] = [];

  if (input.measurementSource !== "manual") reasons.push("ai_dimensions");
  if (input.items.some((i) => i.priceSource === "converted")) reasons.push("converted_price");
  if (input.items.some((i) => i.priceSource === "missing")) reasons.push("missing_price");
  if (input.items.some((i) => i.demoPrice)) reasons.push("demo_price");
  if (input.laborLines.some((l) => l.enabled && !l.fromMarket && l.unitCost === 0)) reasons.push("no_labor_rate");
  if (!input.items.length) reasons.push("no_items");
  if (!input.hasTaxJurisdiction) reasons.push("no_tax");

  const level: ConfidenceReport["level"] =
    input.items.some((i) => i.priceSource === "missing") || reasons.length >= 4
      ? "low"
      : reasons.length >= 1
        ? "medium"
        : "high";

  return { level, reasons };
}

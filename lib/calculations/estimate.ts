import type {
  ConfidenceReport,
  CurrencyCode,
  EstimateSettings,
  EstimateTotals,
  LaborLine,
  MeasurementSource,
  ProjectItem,
  RoomDimensions,
  RoomEntity,
  RoomModel,
} from "@/types";
import { baseSurfaceQuantity } from "./dimensions";
import { entitySurfaceQuantity } from "./surfaces";
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
  /** when present, surface items linked to an entity take their quantity from it */
  roomModel?: RoomModel | null;
}

export interface ItemBreakdown {
  item: ProjectItem;
  quantity: number;
  materialCost: number;
  laborCost: number;
  total: number;
}

export function resolveItemQuantity(
  item: ProjectItem,
  dimensions: RoomDimensions,
  entity?: RoomEntity | null,
): number {
  if (item.kind === "object" || !item.quantityAuto) return item.quantity;
  const base = entity
    ? entitySurfaceQuantity(entity, item.unit)
    : baseSurfaceQuantity(item.surface, dimensions, item.unit);
  return calculateWaste(base, item.wastePercent);
}

export function itemBreakdown(
  item: ProjectItem,
  dimensions: RoomDimensions,
  entities?: RoomEntity[],
): ItemBreakdown {
  const entity =
    item.roomEntityId && entities ? entities.find((e) => e.id === item.roomEntityId) : undefined;
  const quantity = resolveItemQuantity(item, dimensions, entity);
  const materialCost = calculateMaterialCost(quantity, item.unitPrice);
  const laborCost = calculateItemLabor(quantity, item.laborCost);
  return { item, quantity, materialCost, laborCost, total: round(materialCost + laborCost) };
}

export function calculateEstimate(input: EstimateInput): {
  totals: EstimateTotals;
  breakdown: ItemBreakdown[];
} {
  const breakdown = input.items.map((it) =>
    itemBreakdown(it, input.dimensions, input.roomModel?.entities),
  );

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

  const model = input.roomModel;
  if (model) {
    if (model.calibration.status === "uncalibrated") reasons.push("uncalibrated_model");
    else if (model.calibration.status === "partially_calibrated") reasons.push("partial_calibration");
    if (model.source === "demo") reasons.push("demo_model");
    if (
      model.entities.some(
        (e) => e.quantifiable && e.validationStatus !== "verified" && e.confidence < 0.9,
      )
    ) {
      reasons.push("unreviewed_geometry");
    }
  }

  const level: ConfidenceReport["level"] =
    input.items.some((i) => i.priceSource === "missing") ||
    model?.calibration.status === "uncalibrated" ||
    reasons.length >= 4
      ? "low"
      : reasons.length >= 1
        ? "medium"
        : "high";

  return { level, reasons };
}

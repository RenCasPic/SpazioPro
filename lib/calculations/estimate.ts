import type {
  ConfidenceReport,
  CurrencyCode,
  EstimateSettings,
  EstimateTotals,
  LaborLine,
  MeasurementSource,
  ProjectItem,
  RoomDimensions,
  TransportRate,
} from "@/types";
import { baseSurfaceQuantity } from "./quantities";
import { calculateWaste, calculateMaterialCost } from "./materials";
import { calculateItemLabor, calculateLabor } from "./labor";
import { calculateTransport } from "./transport";
import { applyDiscount, calculateTaxes } from "./taxes";
import { round, sum } from "./money";

export interface EstimateInput {
  items: ProjectItem[];
  dimensions: RoomDimensions;
  measurementSource: MeasurementSource;
  laborLines: LaborLine[];
  transportRate: TransportRate;
  settings: EstimateSettings;
  currency: CurrencyCode;
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
  const transport = calculateTransport(input.transportRate, input.settings.transport);
  const other = 0;

  const subtotal = round(materials + labor + transport + other);
  const discount = applyDiscount(subtotal, input.settings.discountPercent);
  const taxable = round(subtotal - discount);
  const tax = calculateTaxes(taxable, input.settings.vatRate);
  const total = round(taxable + tax);

  return {
    breakdown,
    totals: {
      materials,
      labor,
      transport,
      other,
      subtotal,
      discount,
      taxable,
      tax,
      total,
      currency: input.currency,
    },
  };
}

export function confidenceReport(input: EstimateInput): ConfidenceReport {
  const warnings: string[] = [];

  if (input.measurementSource !== "manual") {
    warnings.push("Las dimensiones son una estimación aproximada por IA, no una medición certificada.");
  }
  if (input.items.some((i) => i.priceSource === "converted")) {
    warnings.push("Algunos precios proceden de una conversión de divisa de referencia, no de un precio local.");
  }
  if (input.items.some((i) => i.priceSource === "missing")) {
    warnings.push("Hay elementos sin precio de mercado disponible.");
  }
  if (input.items.some((i) => i.demoPrice)) {
    warnings.push("El catálogo utiliza precios de demostración.");
  }
  if (input.laborLines.some((l) => l.enabled && !l.fromMarket && l.unitCost === 0)) {
    warnings.push("Hay partidas de mano de obra sin tarifa asignada.");
  }
  if (!input.items.length) {
    warnings.push("El presupuesto todavía no tiene elementos.");
  }

  const level: ConfidenceReport["level"] =
    input.items.some((i) => i.priceSource === "missing") || warnings.length >= 4
      ? "low"
      : warnings.length >= 1
        ? "medium"
        : "high";

  return { level, warnings };
}

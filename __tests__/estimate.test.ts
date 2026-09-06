import { describe, expect, it } from "vitest";
import { calculateEstimate, confidenceReport, type EstimateInput } from "@/lib/calculations/estimate";
import { calculateTaxes, applyDiscount } from "@/lib/calculations/taxes";
import { toInches } from "@/lib/calculations/units";
import type { ProjectItem } from "@/types";

const ft = (feet: number) => toInches({ feet, inches: 0 });

function surfaceItem(over: Partial<ProjectItem> = {}): ProjectItem {
  return {
    id: "i1",
    projectId: "p",
    roomId: null,
    scenarioId: "s",
    productId: "prod",
    name: "Flooring",
    category: "lvp",
    kind: "surface",
    surface: "floor",
    quantity: 0,
    quantityAuto: true,
    unit: "sq_ft",
    unitPrice: 3.29,
    laborCost: 4.5,
    currencyCode: "USD",
    wastePercent: 10,
    priceSource: "market",
    supplier: "Metro Flooring Supply",
    demoPrice: true,
    transform: { x: 0.5, y: 0.5, rotation: 0, scale: 1 },
    layer: 0,
    createdAt: "",
    updatedAt: "",
    ...over,
  };
}

const base: EstimateInput = {
  items: [surfaceItem()],
  dimensions: { widthIn: ft(12), lengthIn: ft(15), heightIn: ft(9) },
  measurementSource: "manual",
  laborLines: [],
  settings: {
    salesTaxRate: 8.25,
    discountPercent: 0,
    extras: { equipment: 0, delivery: 0, disposal: 0, permits: 0, other: 0 },
    scopeOfWork: "",
    notes: "",
  },
  currency: "USD",
  hasTaxJurisdiction: true,
};

describe("estimate engine (US)", () => {
  it("auto quantity = 180 sq ft + 10% = 198 sq ft", () => {
    const { totals } = calculateEstimate(base);
    expect(totals.materials).toBe(198 * 3.29);
    expect(totals.labor).toBe(198 * 4.5);
  });

  it("applies discount before sales tax on the taxable base", () => {
    const input: EstimateInput = { ...base, settings: { ...base.settings, discountPercent: 10 } };
    const { totals } = calculateEstimate(input);
    const subtotal = 198 * (3.29 + 4.5);
    expect(totals.subtotal).toBe(Math.round(subtotal * 100) / 100);
    expect(totals.discount).toBe(applyDiscount(totals.subtotal, 10));
    expect(totals.taxable).toBe(Math.round((totals.subtotal - totals.discount) * 100) / 100);
    expect(totals.tax).toBe(calculateTaxes(totals.taxable, 8.25));
    expect(totals.total).toBe(Math.round((totals.taxable + totals.tax) * 100) / 100);
  });

  it("includes equipment / delivery / disposal / permits / other buckets", () => {
    const input: EstimateInput = {
      ...base,
      settings: { ...base.settings, extras: { equipment: 300, delivery: 150, disposal: 200, permits: 450, other: 100 } },
    };
    const { totals } = calculateEstimate(input);
    expect(totals.equipment).toBe(300);
    expect(totals.permits).toBe(450);
    const materialsPlusLabor = 198 * (3.29 + 4.5);
    expect(totals.subtotal).toBe(Math.round((materialsPlusLabor + 1200) * 100) / 100);
  });

  it("manual object quantity is used verbatim", () => {
    const obj = surfaceItem({ kind: "object", surface: undefined, quantityAuto: false, quantity: 3, unitPrice: 200, laborCost: 0 });
    const { totals } = calculateEstimate({ ...base, items: [obj] });
    expect(totals.materials).toBe(600);
  });

  it("currency stays USD", () => {
    expect(calculateEstimate(base).totals.currency).toBe("USD");
  });
});

describe("confidence report", () => {
  it("high when measurements real, prices local, non-demo, jurisdiction resolved", () => {
    const r = confidenceReport({ ...base, items: [surfaceItem({ demoPrice: false })] });
    expect(r.level).toBe("high");
    expect(r.reasons).toHaveLength(0);
  });

  it("low when a price is missing", () => {
    const r = confidenceReport({ ...base, items: [surfaceItem({ priceSource: "missing" })] });
    expect(r.level).toBe("low");
  });

  it("warns when no tax jurisdiction was resolved", () => {
    const r = confidenceReport({ ...base, hasTaxJurisdiction: false, items: [surfaceItem({ demoPrice: false })] });
    expect(r.reasons).toContain("no_tax");
  });

  it("flags AI-estimated dimensions", () => {
    const r = confidenceReport({ ...base, measurementSource: "ai_estimate", items: [surfaceItem({ demoPrice: false })] });
    expect(r.reasons).toContain("ai_dimensions");
  });
});

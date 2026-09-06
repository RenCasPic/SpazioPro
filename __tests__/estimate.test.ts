import { describe, expect, it } from "vitest";
import { calculateEstimate, confidenceReport, type EstimateInput } from "@/lib/calculations/estimate";
import { calculateTaxes, applyDiscount } from "@/lib/calculations/taxes";
import type { ProjectItem } from "@/types";

function surfaceItem(over: Partial<ProjectItem> = {}): ProjectItem {
  return {
    id: "i1",
    projectId: "p",
    roomId: null,
    scenarioId: "s",
    productId: "prod",
    name: "Suelo",
    category: "floor",
    kind: "surface",
    surface: "floor",
    quantity: 0,
    quantityAuto: true,
    unit: "m2",
    unitPrice: 32,
    laborCost: 16,
    currencyCode: "EUR",
    wastePercent: 10,
    priceSource: "market",
    supplier: "Demo",
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
  dimensions: { width: 4.2, length: 5.1, height: 2.6 },
  measurementSource: "manual",
  laborLines: [],
  transportRate: { countryCode: "ES", baseFee: 45, perKm: 1.2, perM3: 18, currencyCode: "EUR" },
  settings: {
    vatRate: 21,
    discountPercent: 0,
    transport: { enabled: false, distanceKm: 0, volumeM3: 0, manualOverride: null },
    notes: "",
  },
  currency: "EUR",
};

describe("estimate engine", () => {
  it("computes material + labour from auto quantity (21.42 +10% = 23.56 m²)", () => {
    const { totals } = calculateEstimate(base);
    expect(totals.materials).toBe(23.56 * 32);
    expect(totals.labor).toBe(23.56 * 16);
  });

  it("applies discount before tax and tax on the taxable base", () => {
    const input: EstimateInput = {
      ...base,
      settings: { ...base.settings, discountPercent: 10 },
    };
    const { totals } = calculateEstimate(input);
    const subtotal = 23.56 * 48; // materials + labour, no transport
    expect(totals.subtotal).toBe(Math.round(subtotal * 100) / 100);
    expect(totals.discount).toBe(applyDiscount(totals.subtotal, 10));
    expect(totals.taxable).toBe(Math.round((totals.subtotal - totals.discount) * 100) / 100);
    expect(totals.tax).toBe(calculateTaxes(totals.taxable, 21));
    expect(totals.total).toBe(Math.round((totals.taxable + totals.tax) * 100) / 100);
  });

  it("adds configurable transport only when enabled", () => {
    const enabled: EstimateInput = {
      ...base,
      settings: {
        ...base.settings,
        transport: { enabled: true, distanceKm: 10, volumeM3: 5, manualOverride: null },
      },
    };
    const { totals } = calculateEstimate(enabled);
    expect(totals.transport).toBe(45 + 1.2 * 10 + 18 * 5); // 147
  });

  it("manual object quantity is used verbatim", () => {
    const obj = surfaceItem({ kind: "object", surface: undefined, quantityAuto: false, quantity: 3, unitPrice: 100, laborCost: 0 });
    const { totals } = calculateEstimate({ ...base, items: [obj] });
    expect(totals.materials).toBe(300);
  });

  it("currency is carried through, never assumed", () => {
    const { totals } = calculateEstimate({ ...base, currency: "PYG" });
    expect(totals.currency).toBe("PYG");
  });
});

describe("confidence report", () => {
  it("is high when measurements are real and prices local (non-demo)", () => {
    const r = confidenceReport({ ...base, items: [surfaceItem({ demoPrice: false })] });
    expect(r.level).toBe("high");
    expect(r.warnings).toHaveLength(0);
  });

  it("drops to low when a price is missing", () => {
    const r = confidenceReport({ ...base, items: [surfaceItem({ priceSource: "missing" })] });
    expect(r.level).toBe("low");
  });

  it("warns about AI-estimated dimensions", () => {
    const r = confidenceReport({ ...base, measurementSource: "ai_estimate", items: [surfaceItem({ demoPrice: false })] });
    expect(r.warnings.join(" ")).toMatch(/estimación aproximada por IA/i);
    expect(r.level).toBe("medium");
  });
});

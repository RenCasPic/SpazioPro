import { describe, expect, it } from "vitest";
import {
  calculateEstimate,
  confidenceReport,
  itemBreakdown,
  nextEstimateVersion,
  resolveItemQuantity,
  type EstimateInput,
} from "@/lib/calculations/estimate";
import type { RoomEntity, TakeoffMeasurement } from "@/types";
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

describe("professional cost model: direct cost → overhead → markup → selling price", () => {
  it("consumer estimates (0% / 0%) are numerically unchanged: sellingPrice === directCost === subtotal", () => {
    const { totals } = calculateEstimate(base);
    expect(totals.directCost).toBe(totals.subtotal);
    expect(totals.sellingPrice).toBe(totals.subtotal);
    expect(totals.overhead).toBe(0);
    expect(totals.markup).toBe(0);
  });

  it("the brief's example: $42,000 direct + 10% overhead + 15% markup = $53,130 selling price", () => {
    const obj = surfaceItem({
      kind: "object",
      surface: undefined,
      quantityAuto: false,
      quantity: 1,
      unitPrice: 42000,
      laborCost: 0,
    });
    const input: EstimateInput = {
      ...base,
      items: [obj],
      settings: { ...base.settings, overheadPercent: 10, markupPercent: 15 },
    };
    const { totals } = calculateEstimate(input);
    expect(totals.directCost).toBe(42000);
    expect(totals.overhead).toBe(4200);
    expect(totals.sellingPrice).toBe(53130);
  });

  it("discount and tax apply to the selling price, not the direct cost", () => {
    const obj = surfaceItem({ kind: "object", surface: undefined, quantityAuto: false, quantity: 1, unitPrice: 10000, laborCost: 0 });
    const input: EstimateInput = {
      ...base,
      items: [obj],
      settings: { ...base.settings, overheadPercent: 10, markupPercent: 0, discountPercent: 5, salesTaxRate: 0 },
    };
    const { totals } = calculateEstimate(input);
    expect(totals.sellingPrice).toBe(11000); // 10,000 + 10%
    expect(totals.discount).toBe(550); // 5% of 11,000, not of 10,000
    expect(totals.total).toBe(10450);
  });
});

describe("takeoff → estimate: two layers, one bridge", () => {
  function takeoff(over: Partial<TakeoffMeasurement> = {}): TakeoffMeasurement {
    return {
      id: "tk_1",
      projectId: "p",
      roomId: null,
      category: "flooring_installation",
      label: "Flooring",
      unit: "sq_ft",
      quantity: 100,
      source: "manual",
      sourceRef: null,
      confidence: 0.95,
      verificationStatus: "verified",
      notes: "",
      createdAt: "",
      updatedAt: "",
      ...over,
    };
  }

  it("a linked takeoff measurement supplies the quantity, waste still applies", () => {
    const item = surfaceItem({ takeoffMeasurementId: "tk_1", wastePercent: 10 });
    const dims = base.dimensions;
    expect(resolveItemQuantity(item, dims, null, takeoff())).toBe(110);
  });

  it("without a link, the room dimensions are used as before", () => {
    const item = surfaceItem({ wastePercent: 10 });
    expect(resolveItemQuantity(item, base.dimensions)).toBe(198); // 180 + 10%, same as the existing test
  });

  it("takeoff outranks a 3D room-model entity when both are linked", () => {
    const entity = {
      dimensions: { netAreaSqFt: 999, grossAreaSqFt: 999 },
    } as RoomEntity;
    const item = surfaceItem({ roomEntityId: "wall_01", takeoffMeasurementId: "tk_1", wastePercent: 0 });
    expect(resolveItemQuantity(item, base.dimensions, entity, takeoff())).toBe(100);
  });

  it("itemBreakdown resolves the linked measurement when passed the takeoff list", () => {
    const item = surfaceItem({ takeoffMeasurementId: "tk_1", wastePercent: 0, unitPrice: 5, laborCost: 2 });
    const b = itemBreakdown(item, base.dimensions, undefined, [takeoff()]);
    expect(b.quantity).toBe(100);
    expect(b.materialCost).toBe(500);
    expect(b.laborCost).toBe(200);
  });

  it("an unverified linked measurement is flagged on the estimate's confidence", () => {
    const item = surfaceItem({ takeoffMeasurementId: "tk_1", demoPrice: false });
    const r = confidenceReport({
      ...base,
      items: [item],
      takeoffMeasurements: [takeoff({ verificationStatus: "needs_verification" })],
    });
    expect(r.reasons).toContain("unverified_takeoff");
  });
});

describe("estimate versioning — a chain, never a silent edit", () => {
  it("v1 has no predecessor", () => {
    expect(nextEstimateVersion([])).toEqual({ versionNumber: 1, supersedesId: null });
  });

  it("chains to the highest existing version regardless of array order", () => {
    const existing = [
      { id: "est_1", versionNumber: 1 },
      { id: "est_3", versionNumber: 3 },
      { id: "est_2", versionNumber: 2 },
    ];
    expect(nextEstimateVersion(existing)).toEqual({ versionNumber: 4, supersedesId: "est_3" });
  });
});

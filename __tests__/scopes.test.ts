import { describe, expect, it } from "vitest";
import { itemBreakdown } from "@/lib/calculations/estimate";
import { computeScopeRollup, itemsForScope } from "@/lib/calculations/scopes";
import type { LaborLine, ProjectItem, ScopeSection } from "@/types";

const dims = { widthIn: 144, lengthIn: 180, heightIn: 108 }; // 12 × 15 × 9 ft

function item(productId: string, laborCategoryHint: string, over: Partial<ProjectItem> = {}): ProjectItem {
  return {
    id: `itm_${productId}`,
    projectId: "p",
    roomId: null,
    scenarioId: "s",
    productId,
    name: productId,
    category: "lvp",
    kind: "object",
    quantity: 1,
    quantityAuto: false,
    unit: "ea",
    unitPrice: 100,
    laborCost: 0,
    currencyCode: "USD",
    wastePercent: 0,
    priceSource: "market",
    supplier: null,
    demoPrice: true,
    transform: { x: 0.5, y: 0.5, rotation: 0, scale: 1 },
    layer: 0,
    createdAt: "",
    updatedAt: "",
    ...over,
  };
}

function scope(over: Partial<ScopeSection> = {}): ScopeSection {
  return {
    id: "scope_1",
    projectId: "p",
    scenarioId: "s",
    category: "flooring_installation",
    name: "Flooring",
    markupPercent: 0,
    contingencyPercent: 0,
    notes: "",
    order: 0,
    createdAt: "",
    updatedAt: "",
    ...over,
  };
}

describe("scope rollups group the SAME item breakdown, never recompute it", () => {
  it("only items whose product trade matches the scope are counted", () => {
    const flooring = item("flr-lvp-coastal", "flooring_installation", { unitPrice: 3.29, laborCost: 4.5 });
    const paint = item("wal-paint-eggshell", "painting", { unitPrice: 62, laborCost: 0 });
    const flooringScope = scope();
    expect(itemsForScope(flooringScope, [flooring, paint])).toEqual([flooring]);
  });

  it("direct cost is the sum of the scope's item totals — no separate pricing", () => {
    const flooring = item("flr-lvp-coastal", "flooring_installation", { unitPrice: 3.29, laborCost: 4.5 });
    const b = itemBreakdown(flooring, dims);
    const rollup = computeScopeRollup(scope(), [b]);
    expect(rollup.directCost).toBe(b.total);
    expect(rollup.itemCount).toBe(1);
  });

  it("contingency then markup stack on top of direct cost, in that order", () => {
    const flooring = item("flr-lvp-coastal", "flooring_installation", { unitPrice: 100, laborCost: 0 });
    const b = itemBreakdown(flooring, dims); // qty 1 (kind object) × $100 = $100 direct cost
    const s = scope({ contingencyPercent: 10, markupPercent: 20 });
    const rollup = computeScopeRollup(s, [b]);
    expect(rollup.directCost).toBe(100);
    expect(rollup.contingency).toBe(10); // 10% of 100
    expect(rollup.markup).toBe(22); // 20% of 110
    expect(rollup.sellingPrice).toBe(132);
  });

  it("enabled labor lines in the scope's category add to direct cost", () => {
    const s = scope();
    const laborLines: LaborLine[] = [
      { id: "l1", label: "Extra install", category: "flooring_installation", unit: "hour", quantity: 4, unitCost: 25, currencyCode: "USD", enabled: true, fromMarket: false },
      { id: "l2", label: "Painting hours", category: "painting", unit: "hour", quantity: 4, unitCost: 55, currencyCode: "USD", enabled: true, fromMarket: false },
    ];
    const rollup = computeScopeRollup(s, [], laborLines);
    expect(rollup.directCost).toBe(100); // only l1 (4 × $25) belongs to this scope
  });

  it("a scope with no matching items has zero direct cost, not an error", () => {
    const rollup = computeScopeRollup(scope({ category: "hvac" }), []);
    expect(rollup.directCost).toBe(0);
    expect(rollup.sellingPrice).toBe(0);
  });
});

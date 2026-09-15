/**
 * Scope of Work rollups — how much a single trade section costs, with its own
 * contingency and markup layered on top of the SAME item breakdown the
 * estimate engine already computed. Never a second cost calculation: this
 * groups and re-labels `ItemBreakdown` rows that `calculateEstimate()`
 * produced, it does not recompute quantities or prices.
 */

import type { LaborLine, ProjectItem, ScopeSection } from "@/types";
import { productById } from "@/data/catalog";
import type { ItemBreakdown } from "./estimate";
import { round, sum } from "./money";

export interface ScopeRollup {
  scopeId: string;
  itemCount: number;
  directCost: number;
  contingency: number;
  markup: number;
  sellingPrice: number;
}

/** Items belonging to a scope — by the trade (LaborCategory) of their product. */
export function itemsForScope(scope: ScopeSection, items: ProjectItem[]): ProjectItem[] {
  return items.filter((item) => {
    const product = productById(item.productId);
    return product?.laborCategory === scope.category;
  });
}

/** Labor lines belonging to a scope — by their own category. */
export function laborLinesForScope(scope: ScopeSection, laborLines: LaborLine[]): LaborLine[] {
  return laborLines.filter((l) => l.enabled && l.category === scope.category);
}

export function computeScopeRollup(
  scope: ScopeSection,
  breakdown: ItemBreakdown[],
  laborLines: LaborLine[] = [],
): ScopeRollup {
  const scopedItemIds = new Set(itemsForScope(scope, breakdown.map((b) => b.item)).map((i) => i.id));
  const rows = breakdown.filter((b) => scopedItemIds.has(b.item.id));
  const laborExtra = sum(laborLinesForScope(scope, laborLines).map((l) => l.quantity * l.unitCost));

  const directCost = round(sum(rows.map((b) => b.total)) + laborExtra);
  const contingency = round(directCost * (scope.contingencyPercent / 100));
  const withContingency = round(directCost + contingency);
  const markup = round(withContingency * (scope.markupPercent / 100));
  const sellingPrice = round(withContingency + markup);

  return { scopeId: scope.id, itemCount: rows.length, directCost, contingency, markup, sellingPrice };
}

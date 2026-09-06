import type { LaborLine } from "@/types";
import { round, sum } from "./money";

export function calculateLaborLine(line: Pick<LaborLine, "quantity" | "unitCost">): number {
  return round(line.quantity * line.unitCost);
}

export function calculateLabor(lines: LaborLine[]): number {
  return round(sum(lines.filter((l) => l.enabled).map(calculateLaborLine)));
}

/** Labour embedded in a priced item (quantity × per-unit labour cost). */
export function calculateItemLabor(quantity: number, laborCost: number): number {
  return round(quantity * laborCost);
}

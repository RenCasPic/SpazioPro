import { round } from "./money";

/**
 * Apply a waste percentage to a base quantity.
 *   21.42 m² + 10% → 23.56 m²
 */
export function calculateWaste(baseQuantity: number, wastePercent: number): number {
  return round(baseQuantity * (1 + wastePercent / 100));
}

export function calculateMaterialQuantity(
  baseQuantity: number,
  wastePercent: number,
): number {
  return calculateWaste(baseQuantity, wastePercent);
}

export function calculateMaterialCost(quantity: number, unitPrice: number): number {
  return round(quantity * unitPrice);
}

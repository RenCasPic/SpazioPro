import { round } from "./money";

/** Tax amount over a taxable base. Rate is a percentage (e.g. 21 → 21%). */
export function calculateTaxes(taxableBase: number, ratePercent: number): number {
  return round(taxableBase * (ratePercent / 100));
}

export function applyDiscount(subtotal: number, discountPercent: number): number {
  return round(subtotal * (discountPercent / 100));
}

import type { CurrencyCode } from "@/types";

const ZERO_DECIMAL: CurrencyCode[] = ["PYG", "CLP", "COP"];

/** Round to a currency's natural precision. Only for presentation / totals. */
export function roundMoney(value: number, currency: CurrencyCode): number {
  const digits = ZERO_DECIMAL.includes(currency) ? 0 : 2;
  const factor = Math.pow(10, digits);
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

/** Generic half-up rounding to `digits` decimals. Never round mid-calculation. */
export function round(value: number, digits = 2): number {
  const factor = Math.pow(10, digits);
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

export function sum(values: number[]): number {
  return values.reduce((a, b) => a + b, 0);
}

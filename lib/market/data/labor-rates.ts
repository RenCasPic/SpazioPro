import type { LaborCategory, LaborRate } from "@/types";
import { COUNTRIES } from "./countries";
import { FX_RATES } from "./fx-rates";

/** Base labour cost per unit, expressed in EUR for a Western-European market. */
const BASE_RATES: Array<{ category: LaborCategory; unit: string; eur: number }> = [
  { category: "painting", unit: "m2", eur: 7 },
  { category: "flooring", unit: "m2", eur: 16 },
  { category: "tiling", unit: "m2", eur: 28 },
  { category: "carpentry", unit: "h", eur: 32 },
  { category: "electrical", unit: "h", eur: 38 },
  { category: "plumbing", unit: "h", eur: 40 },
  { category: "masonry", unit: "m2", eur: 22 },
  { category: "assembly", unit: "h", eur: 30 },
  { category: "demolition", unit: "m2", eur: 14 },
  { category: "general", unit: "h", eur: 26 },
];

/**
 * Relative labour cost index per country (1 = Western Europe baseline).
 * Data-driven so pricing logic never branches on country codes.
 */
const LABOR_INDEX: Record<string, number> = {
  ES: 0.85, PT: 0.7, FR: 1.1, IT: 0.95, DE: 1.25, GB: 1.15,
  US: 1.35, MX: 0.4, AR: 0.32, CL: 0.5, UY: 0.55, CO: 0.3, PE: 0.28, PY: 0.25, BR: 0.42,
};

export const LABOR_RATES: LaborRate[] = COUNTRIES.flatMap((country) => {
  const index = LABOR_INDEX[country.code] ?? 1;
  const perEur = FX_RATES.find((f) => f.currency === country.currencyCode)?.perEur ?? 1;
  return BASE_RATES.map((r) => ({
    countryCode: country.code,
    category: r.category,
    unit: r.unit,
    cost: roundLocal(r.eur * index * perEur, country.currencyCode),
    currencyCode: country.currencyCode,
  }));
});

function roundLocal(value: number, currency: string): number {
  // zero-decimal currencies round to whole units
  const zeroDecimal = ["PYG", "CLP", "COP", "ARS"];
  return zeroDecimal.includes(currency)
    ? Math.round(value / 50) * 50
    : Math.round(value * 100) / 100;
}

export const laborRatesForCountry = (code: string): LaborRate[] =>
  LABOR_RATES.filter((r) => r.countryCode === code.toUpperCase());

export const laborRate = (code: string, category: LaborCategory): LaborRate | undefined =>
  LABOR_RATES.find((r) => r.countryCode === code.toUpperCase() && r.category === category);

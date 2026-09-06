import type { LaborCategory, LaborRate, LaborUnit } from "@/types";
import { STATES } from "./states";

/** National baseline US labour costs (USD). */
const BASE: Array<{ category: LaborCategory; unit: LaborUnit; cost: number }> = [
  { category: "general_labor", unit: "hour", cost: 45 },
  { category: "painting", unit: "sq_ft", cost: 3.25 },
  { category: "drywall", unit: "sq_ft", cost: 2.4 },
  { category: "flooring_installation", unit: "sq_ft", cost: 4.5 },
  { category: "tile_installation", unit: "sq_ft", cost: 9.5 },
  { category: "carpentry", unit: "hour", cost: 70 },
  { category: "electrical", unit: "hour", cost: 95 },
  { category: "plumbing", unit: "hour", cost: 100 },
  { category: "hvac", unit: "hour", cost: 110 },
  { category: "demolition", unit: "sq_ft", cost: 2.75 },
  { category: "framing", unit: "sq_ft", cost: 6.0 },
  { category: "cabinet_installation", unit: "linear_ft", cost: 90 },
  { category: "countertop_installation", unit: "linear_ft", cost: 45 },
  { category: "finish_carpentry", unit: "linear_ft", cost: 8.5 },
  { category: "cleaning", unit: "project", cost: 350 },
  { category: "delivery", unit: "project", cost: 150 },
  { category: "assembly", unit: "hour", cost: 55 },
];

/** State cost-of-labour index (1 = national baseline). */
const STATE_INDEX: Record<string, number> = {
  CA: 1.35, NY: 1.4, MA: 1.3, WA: 1.28, CT: 1.25, NJ: 1.24, IL: 1.18, CO: 1.15,
  OR: 1.14, MD: 1.16, DC: 1.42, HI: 1.35, AK: 1.3, MN: 1.12, VA: 1.08, NV: 1.1,
  AZ: 1.02, FL: 1.0, TX: 1.0, GA: 0.96, NC: 0.95, TN: 0.9, OH: 0.94, PA: 1.03,
  MI: 0.97, WI: 0.98, IN: 0.9, MO: 0.9, SC: 0.9, AL: 0.85, MS: 0.82, AR: 0.83,
  KY: 0.86, LA: 0.9, OK: 0.85, KS: 0.88, NE: 0.9, IA: 0.9, ID: 0.92, UT: 1.0,
  NM: 0.9, ME: 1.02, NH: 1.1, VT: 1.05, RI: 1.18, DE: 1.08, WV: 0.83, ND: 0.98,
  SD: 0.9, MT: 0.95, WY: 0.95,
};

export const LABOR_RATES: LaborRate[] = [
  // national defaults
  ...BASE.map<LaborRate>((b) => ({
    countryCode: "US",
    stateCode: null,
    category: b.category,
    unit: b.unit,
    cost: b.cost,
    currencyCode: "USD",
  })),
  // per-state
  ...STATES.flatMap<LaborRate>((state) => {
    const idx = STATE_INDEX[state.code] ?? 1;
    return BASE.map<LaborRate>((b) => ({
      countryCode: "US",
      stateCode: state.code,
      category: b.category,
      unit: b.unit,
      cost: Math.round(b.cost * idx * 100) / 100,
      currencyCode: "USD",
    }));
  }),
];

export function laborRatesForState(stateCode: string | null | undefined): LaborRate[] {
  const code = stateCode?.toUpperCase();
  const stateRows = code ? LABOR_RATES.filter((r) => r.stateCode === code) : [];
  return stateRows.length ? stateRows : LABOR_RATES.filter((r) => r.stateCode === null);
}

export function laborRate(stateCode: string | null | undefined, category: LaborCategory): LaborRate | undefined {
  return laborRatesForState(stateCode).find((r) => r.category === category);
}

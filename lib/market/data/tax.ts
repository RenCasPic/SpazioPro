import type { TaxJurisdiction, TaxRate } from "@/types";
import { uid } from "@/lib/utils";

/**
 * Demo tax data. The US has no national sales tax; the rate is resolved from
 * the project's jurisdiction (state → county → city → ZIP). Real deployments
 * connect a tax-rate provider behind the same TaxService interface.
 *
 * State rows carry an average combined (state + local) rate. City/ZIP rows
 * override with a more specific combined rate. Five states have no sales tax.
 */
const STATE_COMBINED: Record<string, number> = {
  AL: 9.24, AK: 0, AZ: 8.4, AR: 9.47, CA: 8.85, CO: 7.78, CT: 6.35, DE: 0,
  DC: 6.0, FL: 7.02, GA: 7.38, HI: 4.44, ID: 6.03, IL: 8.85, IN: 7.0, IA: 6.94,
  KS: 8.7, KY: 6.0, LA: 9.55, ME: 5.5, MD: 6.0, MA: 6.25, MI: 6.0, MN: 7.53,
  MS: 7.07, MO: 8.33, MT: 0, NE: 6.94, NV: 8.23, NH: 0, NJ: 6.6, NM: 7.72,
  NY: 8.53, NC: 6.98, ND: 6.97, OH: 7.24, OK: 8.99, OR: 0, PA: 6.34, RI: 7.0,
  SC: 7.44, SD: 6.4, TN: 9.55, TX: 8.2, UT: 7.19, VT: 6.36, VA: 5.75, WA: 9.4,
  WV: 6.55, WI: 5.43, WY: 5.44,
};

interface Override {
  stateCode: string;
  city?: string;
  zipCode?: string;
  county?: string;
  name: string;
  rate: number;
}

const OVERRIDES: Override[] = [
  { stateCode: "CA", city: "Los Angeles", county: "Los Angeles County", name: "Los Angeles, CA", rate: 9.5 },
  { stateCode: "CA", zipCode: "90001", city: "Los Angeles", name: "Los Angeles 90001, CA", rate: 10.25 },
  { stateCode: "CA", city: "San Francisco", name: "San Francisco, CA", rate: 8.625 },
  { stateCode: "NY", city: "New York", name: "New York City, NY", rate: 8.875 },
  { stateCode: "NY", zipCode: "10001", city: "New York", name: "New York 10001, NY", rate: 8.875 },
  { stateCode: "TX", city: "Austin", name: "Austin, TX", rate: 8.25 },
  { stateCode: "TX", zipCode: "78701", city: "Austin", name: "Austin 78701, TX", rate: 8.25 },
  { stateCode: "TX", city: "Houston", name: "Houston, TX", rate: 8.25 },
  { stateCode: "IL", city: "Chicago", name: "Chicago, IL", rate: 10.25 },
  { stateCode: "IL", zipCode: "60601", city: "Chicago", name: "Chicago 60601, IL", rate: 10.25 },
  { stateCode: "FL", city: "Miami", name: "Miami, FL", rate: 7.0 },
  { stateCode: "WA", city: "Seattle", name: "Seattle, WA", rate: 10.35 },
  { stateCode: "WA", zipCode: "98101", city: "Seattle", name: "Seattle 98101, WA", rate: 10.35 },
  { stateCode: "CO", city: "Denver", name: "Denver, CO", rate: 8.81 },
  { stateCode: "MA", city: "Boston", name: "Boston, MA", rate: 6.25 },
  { stateCode: "GA", city: "Atlanta", name: "Atlanta, GA", rate: 8.9 },
  { stateCode: "AZ", city: "Phoenix", name: "Phoenix, AZ", rate: 8.6 },
];

export const TAX_JURISDICTIONS: TaxJurisdiction[] = [];
export const TAX_RATES: TaxRate[] = [];

function addJurisdiction(j: Omit<TaxJurisdiction, "id" | "countryCode" | "active">, rate: number) {
  const id = uid("jur");
  TAX_JURISDICTIONS.push({ id, countryCode: "US", active: true, ...j });
  TAX_RATES.push({
    jurisdictionId: id,
    rate,
    effectiveFrom: "2026-01-01T00:00:00.000Z",
    effectiveUntil: null,
    source: "SpazioPro demo tax table",
    active: true,
  });
}

for (const [stateCode, rate] of Object.entries(STATE_COMBINED)) {
  addJurisdiction(
    { stateCode, county: null, city: null, zipCode: null, name: `${stateCode} statewide` },
    rate,
  );
}
for (const o of OVERRIDES) {
  addJurisdiction(
    {
      stateCode: o.stateCode,
      county: o.county ?? null,
      city: o.city ?? null,
      zipCode: o.zipCode ?? null,
      name: o.name,
    },
    o.rate,
  );
}

export function rateFor(jurisdictionId: string): TaxRate | undefined {
  return TAX_RATES.find((r) => r.jurisdictionId === jurisdictionId && r.active);
}

export const NO_SALES_TAX_STATES = ["AK", "DE", "MT", "NH", "OR"];

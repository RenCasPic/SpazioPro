import type { TaxJurisdiction, TaxRate, TaxRateResult } from "@/types";
import { TAX_JURISDICTIONS, TAX_RATES, rateFor, NO_SALES_TAX_STATES } from "./data/tax";

export interface TaxQuery {
  stateCode?: string;
  county?: string;
  city?: string;
  zipCode?: string;
}

/**
 * Resolves the sales-tax rate for a US location. Matches the most specific
 * jurisdiction available: ZIP → city → county → state. Demo data; swap for a
 * real tax-rate provider behind this same interface.
 */
export const taxService = {
  jurisdictions(): TaxJurisdiction[] {
    return TAX_JURISDICTIONS.filter((j) => j.active);
  },

  rates(): TaxRate[] {
    return TAX_RATES;
  },

  getTaxRate(q: TaxQuery): TaxRateResult {
    const state = q.stateCode?.toUpperCase();
    const list = TAX_JURISDICTIONS.filter((j) => j.active && (!state || j.stateCode === state));

    const byZip = q.zipCode ? list.find((j) => j.zipCode === q.zipCode) : undefined;
    const byCity =
      q.city && q.city.trim()
        ? list.find((j) => !j.zipCode && j.city?.toLowerCase() === q.city!.trim().toLowerCase())
        : undefined;
    const byCounty =
      q.county && q.county.trim()
        ? list.find((j) => !j.zipCode && !j.city && j.county?.toLowerCase() === q.county!.trim().toLowerCase())
        : undefined;
    const byState = list.find((j) => !j.zipCode && !j.city && !j.county);

    const match = byZip ?? byCity ?? byCounty ?? byState;
    const matchedOn: TaxRateResult["matchedOn"] = byZip
      ? "zip"
      : byCity
        ? "city"
        : byCounty
          ? "county"
          : byState
            ? "state"
            : "none";

    if (!match) {
      return {
        rate: 0,
        jurisdiction: {
          id: "none",
          countryCode: "US",
          stateCode: state ?? "",
          county: null,
          city: null,
          zipCode: null,
          name: state ? `${state} (no rate on file)` : "Unknown",
          active: false,
        },
        matchedOn: "none",
        source: "none",
      };
    }

    const rate = rateFor(match.id);
    return {
      rate: rate?.rate ?? 0,
      jurisdiction: match,
      matchedOn,
      source: rate?.source ?? "none",
    };
  },

  isNoSalesTaxState(stateCode: string): boolean {
    return NO_SALES_TAX_STATES.includes(stateCode.toUpperCase());
  },
};

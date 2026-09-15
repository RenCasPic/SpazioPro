import type { CompanyLaborRate, LaborCategory, LaborRate } from "@/types";
import { laborRate, laborRatesForState } from "./data/labor-rates";

/** A company's own override always wins: state-specific first, then company-wide. */
function companyOverride(
  overrides: CompanyLaborRate[] | undefined,
  category: LaborCategory,
  stateCode: string | null | undefined,
): CompanyLaborRate | undefined {
  if (!overrides?.length) return undefined;
  const code = stateCode?.toUpperCase() ?? null;
  return (
    overrides.find((o) => o.category === category && o.stateCode === code) ??
    overrides.find((o) => o.category === category && o.stateCode === null)
  );
}

/**
 * `overrides` is injected by the caller (the service layer) — this module
 * stays pure and never touches the database itself. The override amends only
 * the cost; unit and currency still come from the market rate it replaces.
 */
export const laborRateService = {
  forState(stateCode: string | null | undefined): LaborRate[] {
    return laborRatesForState(stateCode);
  },
  rate(
    stateCode: string | null | undefined,
    category: LaborCategory,
    overrides?: CompanyLaborRate[],
  ): LaborRate | undefined {
    const base = laborRate(stateCode, category);
    const override = companyOverride(overrides, category, stateCode);
    if (!override) return base;
    if (base) return { ...base, cost: override.cost };
    return {
      countryCode: "US",
      stateCode: stateCode?.toUpperCase() ?? null,
      category,
      unit: "hour",
      cost: override.cost,
      currencyCode: "USD",
    };
  },
  cost(
    stateCode: string | null | undefined,
    category: LaborCategory,
    overrides?: CompanyLaborRate[],
  ): number | null {
    return this.rate(stateCode, category, overrides)?.cost ?? null;
  },
};

import type { LaborCategory, LaborRate } from "@/types";
import { laborRate, laborRatesForCountry } from "./data/labor-rates";

export const laborRateService = {
  forCountry(code: string): LaborRate[] {
    return laborRatesForCountry(code);
  },
  rate(code: string, category: LaborCategory): LaborRate | undefined {
    return laborRate(code, category);
  },
  /** Cost per unit for a labour category in a country, or null if none defined. */
  cost(code: string, category: LaborCategory): number | null {
    return laborRate(code, category)?.cost ?? null;
  },
};

import type { LaborCategory, LaborRate } from "@/types";
import { laborRate, laborRatesForState } from "./data/labor-rates";

export const laborRateService = {
  forState(stateCode: string | null | undefined): LaborRate[] {
    return laborRatesForState(stateCode);
  },
  rate(stateCode: string | null | undefined, category: LaborCategory): LaborRate | undefined {
    return laborRate(stateCode, category);
  },
  cost(stateCode: string | null | undefined, category: LaborCategory): number | null {
    return laborRate(stateCode, category)?.cost ?? null;
  },
};

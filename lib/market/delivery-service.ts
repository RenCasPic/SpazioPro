import type { DeliveryRate } from "@/types";
import { deliveryRateForState } from "./data/delivery-rates";
import { round } from "@/lib/calculations/money";

export interface DeliveryConfig {
  enabled: boolean;
  distanceMiles: number;
  volumeCuYd: number;
  manualOverride: number | null;
}

export const deliveryService = {
  rateForState(stateCode: string | null | undefined): DeliveryRate {
    return deliveryRateForState(stateCode);
  },

  estimate(stateCode: string | null | undefined, config: DeliveryConfig): number {
    if (!config.enabled) return 0;
    if (config.manualOverride != null) return round(Math.max(0, config.manualOverride));
    const rate = deliveryRateForState(stateCode);
    return round(
      rate.baseFee +
        rate.perMile * Math.max(0, config.distanceMiles) +
        rate.perCuYd * Math.max(0, config.volumeCuYd),
    );
  },
};

import type { DeliveryRate } from "@/types";
import { STATES } from "./states";

const BASE = { baseFee: 85, perMile: 2.5, perCuYd: 45 };

const STATE_INDEX: Record<string, number> = {
  CA: 1.25, NY: 1.3, HI: 1.6, AK: 1.7, WA: 1.2, MA: 1.2, CT: 1.18, NJ: 1.18,
  FL: 1.0, TX: 0.95, GA: 0.95, NC: 0.92, TN: 0.9, OH: 0.92, IL: 1.05,
};

export const DELIVERY_RATES: DeliveryRate[] = [
  { countryCode: "US", stateCode: null, baseFee: BASE.baseFee, perMile: BASE.perMile, perCuYd: BASE.perCuYd, currencyCode: "USD" },
  ...STATES.map<DeliveryRate>((s) => {
    const idx = STATE_INDEX[s.code] ?? 1;
    return {
      countryCode: "US",
      stateCode: s.code,
      baseFee: Math.round(BASE.baseFee * idx),
      perMile: Math.round(BASE.perMile * idx * 100) / 100,
      perCuYd: Math.round(BASE.perCuYd * idx),
      currencyCode: "USD",
    };
  }),
];

export function deliveryRateForState(stateCode: string | null | undefined): DeliveryRate {
  const code = stateCode?.toUpperCase();
  return (
    DELIVERY_RATES.find((r) => r.stateCode === code) ??
    DELIVERY_RATES.find((r) => r.stateCode === null)!
  );
}

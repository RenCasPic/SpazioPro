import type { TransportConfig, TransportRate } from "@/types";
import { transportRateForCountry } from "./data/transport-rates";

export const transportService = {
  rateForCountry(code: string): TransportRate {
    return transportRateForCountry(code);
  },

  /**
   * Transport cost from market parameters. Architecture is ready for city /
   * zone / carrier inputs; today it uses base fee + distance + volume.
   */
  estimate(code: string, config: TransportConfig): number {
    if (!config.enabled) return 0;
    if (config.manualOverride != null) return Math.max(0, config.manualOverride);
    const rate = transportRateForCountry(code);
    const value =
      rate.baseFee + rate.perKm * Math.max(0, config.distanceKm) + rate.perM3 * Math.max(0, config.volumeM3);
    return Math.round(value * 100) / 100;
  },
};

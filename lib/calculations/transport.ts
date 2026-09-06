import type { TransportConfig, TransportRate } from "@/types";
import { round } from "./money";

export function calculateTransport(rate: TransportRate, config: TransportConfig): number {
  if (!config.enabled) return 0;
  if (config.manualOverride != null) return round(Math.max(0, config.manualOverride));
  const value =
    rate.baseFee +
    rate.perKm * Math.max(0, config.distanceKm) +
    rate.perM3 * Math.max(0, config.volumeM3);
  return round(value);
}

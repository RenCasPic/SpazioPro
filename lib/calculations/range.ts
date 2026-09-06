import type { ConfidenceReport } from "@/types";

/**
 * Consumers should never see false precision. We turn a point total into a
 * range whose width reflects how confident the estimate is, and we round the
 * ends to "nice" numbers so it reads like a human quote, not a spreadsheet.
 */
const BAND: Record<ConfidenceReport["level"], number> = {
  high: 0.08,
  medium: 0.18,
  low: 0.3,
};

function niceStep(n: number): number {
  if (n < 2000) return 100;
  if (n < 10000) return 250;
  if (n < 50000) return 500;
  return 1000;
}

export interface CostRange {
  low: number;
  high: number;
  mid: number;
  /** half-width as a fraction of the midpoint */
  band: number;
}

export function costRange(total: number, level: ConfidenceReport["level"]): CostRange {
  const band = BAND[level];
  const rawLow = total * (1 - band);
  const rawHigh = total * (1 + band);
  const step = niceStep(total);
  const low = Math.max(0, Math.floor(rawLow / step) * step);
  const high = Math.ceil(rawHigh / step) * step;
  return { low, high, mid: total, band };
}

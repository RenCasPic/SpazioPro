import type { FxRate } from "@/types";

/**
 * Reference FX only (base USD). The US flow never converts — every price is
 * already in USD. Kept for the future multi-country architecture.
 */
const CAPTURED_AT = "2026-09-01T00:00:00.000Z";

export const FX_RATES: FxRate[] = [
  { currency: "USD", perUsd: 1, capturedAt: CAPTURED_AT },
  { currency: "CAD", perUsd: 1.36, capturedAt: CAPTURED_AT },
  { currency: "MXN", perUsd: 18.9, capturedAt: CAPTURED_AT },
  { currency: "EUR", perUsd: 0.92, capturedAt: CAPTURED_AT },
  { currency: "GBP", perUsd: 0.78, capturedAt: CAPTURED_AT },
];

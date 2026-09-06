import type { FxRate } from "@/types";

/**
 * Reference exchange rates only (base EUR). Used for informational conversion
 * when a market has no local price. A converted figure NEVER replaces a real
 * local price and is always flagged as `source: "converted"`.
 */
const CAPTURED_AT = "2026-09-01T00:00:00.000Z";

export const FX_RATES: FxRate[] = [
  { currency: "EUR", perEur: 1, capturedAt: CAPTURED_AT },
  { currency: "USD", perEur: 1.08, capturedAt: CAPTURED_AT },
  { currency: "GBP", perEur: 0.84, capturedAt: CAPTURED_AT },
  { currency: "PYG", perEur: 8250, capturedAt: CAPTURED_AT },
  { currency: "ARS", perEur: 1180, capturedAt: CAPTURED_AT },
  { currency: "CLP", perEur: 1010, capturedAt: CAPTURED_AT },
  { currency: "UYU", perEur: 43.5, capturedAt: CAPTURED_AT },
  { currency: "MXN", perEur: 20.4, capturedAt: CAPTURED_AT },
  { currency: "COP", perEur: 4350, capturedAt: CAPTURED_AT },
  { currency: "PEN", perEur: 4.05, capturedAt: CAPTURED_AT },
  { currency: "BRL", perEur: 5.9, capturedAt: CAPTURED_AT },
];

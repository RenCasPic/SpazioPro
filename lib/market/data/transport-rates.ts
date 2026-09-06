import type { TransportRate } from "@/types";
import { COUNTRIES } from "./countries";
import { FX_RATES } from "./fx-rates";

/** Base transport parameters in EUR for a Western-European market. */
const BASE = { baseFee: 45, perKm: 1.2, perM3: 18 };

const TRANSPORT_INDEX: Record<string, number> = {
  ES: 0.9, PT: 0.8, FR: 1.1, IT: 1, DE: 1.15, GB: 1.2,
  US: 1.25, MX: 0.55, AR: 0.5, CL: 0.6, UY: 0.6, CO: 0.45, PE: 0.45, PY: 0.4, BR: 0.55,
};

export const TRANSPORT_RATES: TransportRate[] = COUNTRIES.map((country) => {
  const index = TRANSPORT_INDEX[country.code] ?? 1;
  const perEur = FX_RATES.find((f) => f.currency === country.currencyCode)?.perEur ?? 1;
  const zeroDecimal = ["PYG", "CLP", "COP", "ARS"].includes(country.currencyCode);
  const scale = (v: number) => {
    const local = v * index * perEur;
    return zeroDecimal ? Math.round(local / 50) * 50 : Math.round(local * 100) / 100;
  };
  return {
    countryCode: country.code,
    baseFee: scale(BASE.baseFee),
    perKm: scale(BASE.perKm),
    perM3: scale(BASE.perM3),
    currencyCode: country.currencyCode,
  };
});

export const transportRateForCountry = (code: string): TransportRate =>
  TRANSPORT_RATES.find((r) => r.countryCode === code.toUpperCase()) ?? TRANSPORT_RATES[0];

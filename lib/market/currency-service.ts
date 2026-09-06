import type { CurrencyCode, Money } from "@/types";
import { FX_RATES } from "./data/fx-rates";
import { countryByCode, COUNTRIES } from "./data/countries";

const ZERO_DECIMAL: CurrencyCode[] = ["PYG", "CLP", "COP"];

export const currencyService = {
  rates() {
    return FX_RATES;
  },

  symbol(currency: CurrencyCode): string {
    return COUNTRIES.find((c) => c.currencyCode === currency)?.currencySymbol ?? currency;
  },

  fractionDigits(currency: CurrencyCode): number {
    return ZERO_DECIMAL.includes(currency) ? 0 : 2;
  },

  /**
   * Reference conversion only. The result must always be treated as
   * informational — a real local price takes precedence (see pricing-service).
   */
  convert(value: Money, to: CurrencyCode): Money {
    if (value.currency === to) return value;
    const from = FX_RATES.find((r) => r.currency === value.currency);
    const dest = FX_RATES.find((r) => r.currency === to);
    if (!from || !dest) throw new Error(`Sin tipo de cambio para ${value.currency}→${to}`);
    const inEur = value.amount / from.perEur;
    const amount = inEur * dest.perEur;
    return { amount: round(amount, to), currency: to };
  },

  format(value: Money, locale?: string): string {
    const loc =
      locale ??
      COUNTRIES.find((c) => c.currencyCode === value.currency)?.locale ??
      "es-ES";
    return new Intl.NumberFormat(loc, {
      style: "currency",
      currency: value.currency,
      maximumFractionDigits: this.fractionDigits(value.currency),
      minimumFractionDigits: this.fractionDigits(value.currency),
    }).format(Number.isFinite(value.amount) ? value.amount : 0);
  },

  formatFor(amount: number, countryCode: string): string {
    const country = countryByCode(countryCode);
    if (!country) return String(amount);
    return this.format({ amount, currency: country.currencyCode }, country.locale);
  },
};

function round(value: number, currency: CurrencyCode): number {
  const d = ZERO_DECIMAL.includes(currency) ? 0 : 2;
  const f = Math.pow(10, d);
  return Math.round((value + Number.EPSILON) * f) / f;
}

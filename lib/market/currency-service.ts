import type { CurrencyCode, Money } from "@/types";
import { FX_RATES } from "./data/fx-rates";

export const currencyService = {
  rates() {
    return FX_RATES;
  },

  symbol(currency: CurrencyCode): string {
    return { USD: "$", CAD: "$", MXN: "$", EUR: "€", GBP: "£" }[currency] ?? currency;
  },

  /** Reference conversion only — a real local price always wins (pricing-service). */
  convert(value: Money, to: CurrencyCode): Money {
    if (value.currency === to) return value;
    const from = FX_RATES.find((r) => r.currency === value.currency);
    const dest = FX_RATES.find((r) => r.currency === to);
    if (!from || !dest) throw new Error(`No FX rate for ${value.currency}→${to}`);
    const inUsd = value.amount / from.perUsd;
    return { amount: round(inUsd * dest.perUsd), currency: to };
  },

  format(value: Money, locale = "en-US"): string {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: value.currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number.isFinite(value.amount) ? value.amount : 0);
  },

  formatUsd(amount: number, locale = "en-US"): string {
    return this.format({ amount, currency: "USD" }, locale);
  },
};

function round(v: number): number {
  return Math.round((v + Number.EPSILON) * 100) / 100;
}

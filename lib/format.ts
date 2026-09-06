import type { CurrencyCode, MeasurementSystem, Money } from "@/types";
import type { Locale } from "@/lib/i18n/config";
import {
  formatArea as fmtArea,
  formatLinear as fmtLinear,
  formatImperialMeasurement,
} from "@/lib/calculations/units";

export const formatMoney = (value: Money, locale: Locale = "en-US") =>
  new Intl.NumberFormat(locale, {
    style: "currency",
    currency: value.currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value.amount) ? value.amount : 0);

export const formatUsd = (amount: number, locale: Locale = "en-US") =>
  formatMoney({ amount, currency: "USD" }, locale);

export const formatAmount = (amount: number, currency: CurrencyCode, locale: Locale = "en-US") =>
  formatMoney({ amount, currency }, locale);

export function formatNumber(n: number, digits = 2, locale: Locale = "en-US"): string {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(Number.isFinite(n) ? n : 0);
}

export function formatArea(sqft: number, system: MeasurementSystem = "imperial", locale: Locale = "en-US") {
  return fmtArea(sqft, system, locale);
}

export function formatLinear(linft: number, system: MeasurementSystem = "imperial", locale: Locale = "en-US") {
  return fmtLinear(linft, system, locale);
}

export function formatDimension(totalInches: number, system: MeasurementSystem = "imperial", locale: Locale = "en-US") {
  return formatImperialMeasurement(totalInches, system, locale);
}

export function formatDate(iso: string, locale: Locale = "en-US"): string {
  const d = new Date(iso);
  const now = new Date();
  const dtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  if (d.toDateString() === now.toDateString()) return dtf.format(0, "day");
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return dtf.format(-1, "day");
  return d.toLocaleDateString(locale, { month: "short", day: "numeric", year: "numeric" });
}

export function formatDateLong(iso: string, locale: Locale = "en-US"): string {
  return new Date(iso).toLocaleDateString(locale, { month: "long", day: "numeric", year: "numeric" });
}

let estimateCounter = 0;
export function nextEstimateNumber(existing: string[] = []): string {
  const year = new Date().getFullYear();
  const nums = existing
    .map((n) => Number(n.match(/SP-\d{4}-(\d+)/)?.[1] ?? 0))
    .filter((n) => Number.isFinite(n));
  estimateCounter = Math.max(0, ...nums, estimateCounter) + 1;
  return `SP-${year}-${String(estimateCounter).padStart(4, "0")}`;
}

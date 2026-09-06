import type { CurrencyCode, Money } from "@/types";
import { currencyService } from "@/lib/market/currency-service";

export const formatMoney = (value: Money, locale?: string) =>
  currencyService.format(value, locale);

export const formatAmount = (amount: number, currency: CurrencyCode, locale?: string) =>
  currencyService.format({ amount, currency }, locale);

export function formatNumber(n: number, digits = 2, locale = "es-ES"): string {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(Number.isFinite(n) ? n : 0);
}

export function formatArea(n: number, locale = "es-ES"): string {
  return `${formatNumber(n, 2, locale)} m²`;
}

export function formatDate(iso: string, locale = "es-ES"): string {
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return "Hoy";
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return "Ayer";
  return d.toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" });
}

export function formatDateLong(iso: string, locale = "es-ES"): string {
  return new Date(iso).toLocaleDateString(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

let estimateCounter = 0;
export function nextEstimateNumber(existing: string[] = []): string {
  const year = new Date().getFullYear();
  const nums = existing
    .map((n) => Number(n.match(/SP-\d{4}-(\d+)/)?.[1] ?? 0))
    .filter((n) => Number.isFinite(n));
  const max = Math.max(0, ...nums, estimateCounter);
  estimateCounter = max + 1;
  return `SP-${year}-${String(estimateCounter).padStart(4, "0")}`;
}

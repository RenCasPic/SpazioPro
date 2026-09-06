const eur = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const eur0 = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

const num2 = new Intl.NumberFormat("es-ES", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const formatCurrency = (n: number) => eur.format(Number.isFinite(n) ? n : 0);
export const formatCurrencyShort = (n: number) => eur0.format(Number.isFinite(n) ? n : 0);
export const formatNumber = (n: number) => num2.format(Number.isFinite(n) ? n : 0);

export function formatDate(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const isSameDay = d.toDateString() === today.toDateString();
  if (isSameDay) return "Hoy";
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return "Ayer";
  return d.toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });
}

export function estimateNumber(): string {
  const d = new Date();
  const y = d.getFullYear();
  const seq = Math.floor((d.getTime() / 1000) % 100000)
    .toString()
    .padStart(5, "0");
  return `PR-${y}-${seq}`;
}

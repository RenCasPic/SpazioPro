import type { ProductMarketPrice } from "@/types";
import { BASE_PRICE_EUR, CATALOG } from "./catalog";
import { FX_RATES } from "@/lib/market/data/fx-rates";
import { countryByCode } from "@/lib/market/data/countries";

/**
 * Countries that have EXPLICIT local market prices (the rest fall back to a
 * flagged FX conversion at resolution time). Each has a local price index vs
 * a straight FX conversion and a local supplier name.
 */
const LOCAL_MARKETS: Array<{ code: string; index: number; supplier: string }> = [
  { code: "ES", index: 1.0, supplier: "Distribución Ibérica de Materiales" },
  { code: "PY", index: 1.18, supplier: "Corralón Central Asunción" },
  { code: "MX", index: 1.09, supplier: "Materiales del Bajío" },
  { code: "AR", index: 1.32, supplier: "Pinturería y Obra Buenos Aires" },
  { code: "PT", index: 0.96, supplier: "Materiais Lisboa" },
];

function roundLocal(value: number, currency: string): number {
  return ["PYG", "CLP", "COP", "ARS"].includes(currency)
    ? Math.round(value / 100) * 100
    : Math.round(value * 100) / 100;
}

export const PRODUCT_MARKET_PRICES: ProductMarketPrice[] = CATALOG.flatMap((product) => {
  const baseEur = BASE_PRICE_EUR[product.id] ?? 0;
  return LOCAL_MARKETS.map(({ code, index, supplier }) => {
    const country = countryByCode(code)!;
    const perEur = FX_RATES.find((f) => f.currency === country.currencyCode)?.perEur ?? 1;
    // deterministic per-product jitter so prices aren't a flat multiple
    const jitter = 0.9 + ((hash(product.id + code) % 25) / 100);
    const price = roundLocal(baseEur * perEur * index * jitter, country.currencyCode);
    return {
      productId: product.id,
      countryCode: code,
      price,
      currencyCode: country.currencyCode,
      supplier,
      available: hash(product.id + code) % 11 !== 0, // ~9% unavailable
      minQuantity: product.unit === "ud" ? 1 : product.unit === "ml" ? 1 : 5,
      source: "market" as const,
    };
  });
});

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export const marketPricesForCountry = (code: string): ProductMarketPrice[] =>
  PRODUCT_MARKET_PRICES.filter((p) => p.countryCode === code.toUpperCase());

export const marketPrice = (productId: string, code: string): ProductMarketPrice | undefined =>
  PRODUCT_MARKET_PRICES.find(
    (p) => p.productId === productId && p.countryCode === code.toUpperCase(),
  );

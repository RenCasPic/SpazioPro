import type { ProductMarketPrice } from "@/types";
import { BASE_PRICE_USD, CATALOG } from "./catalog";

/**
 * US market prices in USD. A national price for every product, plus explicit
 * per-state overrides for a few high/low cost-of-living states. Availability
 * and lead time vary by market — a product is not assumed available everywhere.
 */
const STATE_PRICE_INDEX: Record<string, number> = {
  CA: 1.12, NY: 1.15, HI: 1.35, AK: 1.3, WA: 1.08, MA: 1.1, CT: 1.08, NJ: 1.07,
  TX: 0.97, FL: 1.0, GA: 0.95, NC: 0.94, TN: 0.92, OH: 0.93, AZ: 0.98, CO: 1.05,
  IL: 1.02, MI: 0.94, PA: 1.0, NV: 1.02, OR: 1.06, UT: 0.99, MN: 1.0, MO: 0.9,
  IN: 0.9, WI: 0.95, SC: 0.92, AL: 0.88, MS: 0.86, KY: 0.88, OK: 0.87, KS: 0.9,
};

const SUPPLIER_BY_GROUP: Record<string, string> = {
  flooring: "Metro Flooring Supply",
  walls: "BuildRight Materials",
  kitchen: "Kitchen & Bath Depot",
  bathroom: "Kitchen & Bath Depot",
  furniture: "Interior Trade Co.",
  lighting: "Lumen Trade Lighting",
};

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function round(n: number): number {
  return n >= 100 ? Math.round(n) : Math.round(n * 100) / 100;
}

export const PRODUCT_MARKET_PRICES: ProductMarketPrice[] = CATALOG.flatMap((product) => {
  const base = BASE_PRICE_USD[product.id] ?? 0;
  const supplier = SUPPLIER_BY_GROUP[product.group] ?? "National Supply";
  const leadBase = product.category === "cabinets" ? 21 : product.unit === "ea" ? 7 : 3;

  const national: ProductMarketPrice = {
    productId: product.id,
    countryCode: "US",
    stateCode: null,
    price: round(base),
    currencyCode: "USD",
    supplier,
    available: hash(product.id) % 13 !== 0,
    minQuantity: product.unit === "ea" ? 1 : product.unit === "gallon" ? 1 : 20,
    leadTimeDays: leadBase,
    source: "market",
  };

  const states = Object.entries(STATE_PRICE_INDEX).map<ProductMarketPrice>(([code, idx]) => {
    const jitter = 0.97 + ((hash(product.id + code) % 7) / 100);
    return {
      productId: product.id,
      countryCode: "US",
      stateCode: code,
      price: round(base * idx * jitter),
      currencyCode: "USD",
      supplier: `${supplier} — ${code}`,
      available: hash(product.id + code) % 11 !== 0,
      minQuantity: national.minQuantity,
      leadTimeDays: leadBase + (hash(product.id + code) % 5),
      source: "market",
    };
  });

  return [national, ...states];
});

export function marketPrice(productId: string, stateCode: string | null | undefined): ProductMarketPrice | undefined {
  const code = stateCode?.toUpperCase();
  return (
    (code && PRODUCT_MARKET_PRICES.find((p) => p.productId === productId && p.stateCode === code)) ||
    PRODUCT_MARKET_PRICES.find((p) => p.productId === productId && p.stateCode === null)
  );
}

export function marketPricesForState(stateCode: string | null): ProductMarketPrice[] {
  const code = stateCode?.toUpperCase() ?? null;
  return CATALOG.map((p) => marketPrice(p.id, code)!).filter(Boolean);
}

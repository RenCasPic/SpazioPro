import type { ResolvedPrice } from "@/types";
import { marketPrice } from "@/data/product-prices";
import { BASE_PRICE_USD } from "@/data/catalog";

/**
 * Resolves a US product price in USD for a state.
 *   1. explicit state market price
 *   2. explicit state supplier price
 *   3. national US market price
 *   4. (future) FX conversion — flagged as reference only
 */
export const pricingService = {
  resolve(productId: string, stateCode: string | null | undefined): ResolvedPrice {
    const capturedAt = new Date().toISOString();
    const row = marketPrice(productId, stateCode);

    if (row) {
      return {
        productId,
        money: { amount: row.price, currency: row.currencyCode },
        source: row.source,
        supplier: row.supplier,
        available: row.available,
        leadTimeDays: row.leadTimeDays,
        capturedAt,
      };
    }

    const base = BASE_PRICE_USD[productId];
    if (base == null) {
      return {
        productId,
        money: { amount: 0, currency: "USD" },
        source: "missing",
        supplier: null,
        available: false,
        leadTimeDays: 0,
        capturedAt,
      };
    }
    return {
      productId,
      money: { amount: base, currency: "USD" },
      source: "market",
      supplier: null,
      available: true,
      leadTimeDays: 5,
      capturedAt,
    };
  },

  resolveMany(productIds: string[], stateCode: string | null | undefined): Record<string, ResolvedPrice> {
    return Object.fromEntries(productIds.map((id) => [id, this.resolve(id, stateCode)]));
  },
};

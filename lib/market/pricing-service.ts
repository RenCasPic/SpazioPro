import type { CompanyProductPrice, ResolvedPrice } from "@/types";
import { marketPrice } from "@/data/product-prices";
import { BASE_PRICE_USD } from "@/data/catalog";

/** A company's own override always wins: state-specific first, then company-wide. */
function companyOverride(
  overrides: CompanyProductPrice[] | undefined,
  productId: string,
  stateCode: string | null | undefined,
): CompanyProductPrice | undefined {
  if (!overrides?.length) return undefined;
  const code = stateCode?.toUpperCase() ?? null;
  return (
    overrides.find((o) => o.productId === productId && o.stateCode === code) ??
    overrides.find((o) => o.productId === productId && o.stateCode === null)
  );
}

/**
 * Resolves a US product price in USD for a state.
 *   0. the company's own price override, when supplied
 *   1. explicit state market price
 *   2. explicit state supplier price
 *   3. national US market price
 *   4. (future) FX conversion — flagged as reference only
 *
 * `overrides` is injected by the caller (the service layer) — this module
 * stays pure and never touches the database itself.
 */
export const pricingService = {
  resolve(
    productId: string,
    stateCode: string | null | undefined,
    overrides?: CompanyProductPrice[],
  ): ResolvedPrice {
    const capturedAt = new Date().toISOString();

    const override = companyOverride(overrides, productId, stateCode);
    if (override) {
      return {
        productId,
        money: { amount: override.price, currency: "USD" },
        source: "company",
        supplier: null,
        available: true,
        leadTimeDays: 0,
        capturedAt,
      };
    }

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

  resolveMany(
    productIds: string[],
    stateCode: string | null | undefined,
    overrides?: CompanyProductPrice[],
  ): Record<string, ResolvedPrice> {
    return Object.fromEntries(productIds.map((id) => [id, this.resolve(id, stateCode, overrides)]));
  },
};

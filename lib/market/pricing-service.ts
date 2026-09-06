import type { Money, ResolvedPrice } from "@/types";
import { BASE_PRICE_EUR } from "@/data/catalog";
import { marketPrice } from "@/data/product-prices";
import { countryService } from "./country-service";
import { currencyService } from "./currency-service";

/**
 * Resolves a product price for a country following a strict priority:
 *
 *   1. explicit local market price for the country
 *   2. explicit local supplier price (same table, source === "supplier")
 *   3. stored market price in another currency (not used in demo)
 *   4. FX conversion from the EUR reference price — REFERENCE ONLY, flagged
 *
 * A converted price NEVER silently replaces a real local price.
 */
export const pricingService = {
  resolve(productId: string, countryCode: string): ResolvedPrice {
    const country = countryService.require(countryCode);
    const capturedAt = new Date().toISOString();

    const local = marketPrice(productId, countryCode);
    if (local) {
      return {
        productId,
        money: { amount: local.price, currency: local.currencyCode },
        source: local.source, // "market" | "supplier"
        supplier: local.supplier,
        available: local.available,
        capturedAt,
      };
    }

    const baseEur = BASE_PRICE_EUR[productId];
    if (baseEur == null) {
      return {
        productId,
        money: { amount: 0, currency: country.currencyCode },
        source: "missing",
        supplier: null,
        available: false,
        capturedAt,
      };
    }

    const from: Money = { amount: baseEur, currency: "EUR" };
    const converted = currencyService.convert(from, country.currencyCode);
    return {
      productId,
      money: converted,
      source: "converted",
      supplier: null,
      available: true,
      convertedFrom: from,
      capturedAt,
    };
  },

  resolveMany(productIds: string[], countryCode: string): Record<string, ResolvedPrice> {
    return Object.fromEntries(
      productIds.map((id) => [id, this.resolve(id, countryCode)]),
    );
  },
};

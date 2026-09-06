import type { Market, MarketSnapshot } from "@/types";
import { countryService } from "./country-service";
import { taxService } from "./tax-service";
import { laborRateService } from "./labor-rate-service";
import { transportService } from "./transport-service";
import { currencyService } from "./currency-service";
import { pricingService } from "./pricing-service";
import { CATALOG } from "@/data/catalog";

export const marketService = {
  /** Full market bundle for a country. */
  get(code: string): Market {
    const country = countryService.require(code);
    return {
      country,
      taxRates: taxService.ratesForCountry(code),
      laborRates: laborRateService.forCountry(code),
      transport: transportService.rateForCountry(code),
      fx: currencyService.rates(),
    };
  },

  /**
   * Freezes everything a historical estimate needs so it never changes
   * because a price / tax / FX rate / labour cost / transport rate moved.
   */
  snapshot(code: string, taxRate: number, productIds: string[]): MarketSnapshot {
    const country = countryService.require(code);
    const capturedAt = new Date().toISOString();
    const ids = productIds.length ? productIds : CATALOG.map((p) => p.id);
    return {
      countryCode: code,
      currencyCode: country.currencyCode,
      taxRate,
      taxRates: taxService.ratesForCountry(code),
      laborRates: laborRateService.forCountry(code),
      transportRate: transportService.rateForCountry(code),
      fxRates: currencyService.rates(),
      productPrices: ids.map((id) => {
        const p = pricingService.resolve(id, code);
        return {
          productId: id,
          price: p.money.amount,
          currencyCode: p.money.currency,
          supplier: p.supplier,
          source: p.source,
          capturedAt: p.capturedAt,
        };
      }),
      capturedAt,
    };
  },
};

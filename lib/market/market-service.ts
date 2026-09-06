import type { Market, MarketSnapshot } from "@/types";
import { countryService, stateService } from "./country-service";
import { taxService, type TaxQuery } from "./tax-service";
import { laborRateService } from "./labor-rate-service";
import { deliveryService } from "./delivery-service";
import { currencyService } from "./currency-service";
import { pricingService } from "./pricing-service";
import { CATALOG } from "@/data/catalog";

export const marketService = {
  get(stateCode: string): Market {
    return {
      country: countryService.default(),
      states: stateService.list(),
      laborRates: laborRateService.forState(stateCode),
      delivery: deliveryService.rateForState(stateCode),
      fx: currencyService.rates(),
    };
  },

  /**
   * Freezes everything a historical estimate needs so it never changes because
   * a price, tax rate, labour rate, delivery rate or FX rate moved.
   */
  snapshot(
    location: { stateCode: string; city: string; zipCode: string; county?: string | null },
    productIds: string[],
  ): MarketSnapshot {
    const taxQuery: TaxQuery = {
      stateCode: location.stateCode,
      city: location.city,
      zipCode: location.zipCode,
      county: location.county ?? undefined,
    };
    const tax = taxService.getTaxRate(taxQuery);
    const capturedAt = new Date().toISOString();
    const ids = productIds.length ? productIds : CATALOG.map((p) => p.id);

    return {
      countryCode: "US",
      currencyCode: "USD",
      stateCode: location.stateCode,
      city: location.city,
      zipCode: location.zipCode,
      salesTaxRate: tax.rate,
      taxJurisdiction: tax.matchedOn === "none" ? null : tax.jurisdiction,
      taxRates: taxService.rates(),
      laborRates: laborRateService.forState(location.stateCode),
      deliveryRate: deliveryService.rateForState(location.stateCode),
      fxRates: currencyService.rates(),
      productPrices: ids.map((id) => {
        const p = pricingService.resolve(id, location.stateCode);
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

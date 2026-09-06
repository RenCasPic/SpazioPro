import { describe, expect, it } from "vitest";
import { countryService, stateService } from "@/lib/market/country-service";
import { taxService } from "@/lib/market/tax-service";
import { pricingService } from "@/lib/market/pricing-service";
import { laborRateService } from "@/lib/market/labor-rate-service";
import { marketService } from "@/lib/market/market-service";
import { formatUsd } from "@/lib/format";

describe("US market", () => {
  it("the only seeded country is the United States (USD)", () => {
    expect(countryService.default().code).toBe("US");
    expect(countryService.default().currencyCode).toBe("USD");
    expect(stateService.list()).toHaveLength(51); // 50 + DC
  });

  it("sales tax resolves from the most specific jurisdiction (zip > city > state)", () => {
    const stateOnly = taxService.getTaxRate({ stateCode: "TX" });
    expect(stateOnly.matchedOn).toBe("state");

    const city = taxService.getTaxRate({ stateCode: "IL", city: "Chicago" });
    expect(city.matchedOn).toBe("city");
    expect(city.rate).toBe(10.25);

    const zip = taxService.getTaxRate({ stateCode: "CA", city: "Los Angeles", zipCode: "90001" });
    expect(zip.matchedOn).toBe("zip");
    expect(zip.rate).toBe(10.25);
  });

  it("no-sales-tax states resolve to 0%", () => {
    expect(taxService.getTaxRate({ stateCode: "OR" }).rate).toBe(0);
    expect(taxService.isNoSalesTaxState("MT")).toBe(true);
  });

  it("a state market price beats the national fallback", () => {
    const national = pricingService.resolve("flr-lvp-coastal", null);
    const ca = pricingService.resolve("flr-lvp-coastal", "CA");
    expect(national.money.currency).toBe("USD");
    expect(ca.money.currency).toBe("USD");
    expect(ca.money.amount).not.toBe(national.money.amount);
    expect(ca.source).toBe("market");
  });

  it("the same product costs more in CA than in AL", () => {
    const ca = pricingService.resolve("kit-quartz-counter", "CA").money.amount;
    const al = pricingService.resolve("kit-quartz-counter", "AL").money.amount;
    expect(ca).toBeGreaterThan(al);
  });

  it("prices format as USD in en-US and es-US", () => {
    expect(formatUsd(1250.5, "en-US")).toBe("$1,250.50");
    expect(formatUsd(1250.5, "es-US")).toMatch(/1,250\.50/);
  });

  it("labor rates differ by state (cost-of-living index)", () => {
    const nyPaint = laborRateService.cost("NY", "painting")!;
    const alPaint = laborRateService.cost("AL", "painting")!;
    expect(nyPaint).toBeGreaterThan(alPaint);
  });

  it("market snapshot freezes tax, prices, labor, delivery and location", () => {
    const snap = marketService.snapshot(
      { stateCode: "TX", city: "Austin", zipCode: "78701" },
      ["flr-lvp-coastal", "kit-quartz-counter"],
    );
    expect(snap.currencyCode).toBe("USD");
    expect(snap.stateCode).toBe("TX");
    expect(snap.salesTaxRate).toBe(8.25);
    expect(snap.taxJurisdiction?.name).toContain("Austin");
    expect(snap.productPrices).toHaveLength(2);
    expect(snap.laborRates.length).toBeGreaterThan(0);
    expect(snap.deliveryRate.currencyCode).toBe("USD");
  });
});

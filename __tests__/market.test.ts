import { describe, expect, it } from "vitest";
import { countryService } from "@/lib/market/country-service";
import { currencyService } from "@/lib/market/currency-service";
import { taxService } from "@/lib/market/tax-service";
import { pricingService } from "@/lib/market/pricing-service";
import { laborRateService } from "@/lib/market/labor-rate-service";
import { marketService } from "@/lib/market/market-service";

describe("multi-country market", () => {
  it("each country resolves to its own currency", () => {
    expect(countryService.require("ES").currencyCode).toBe("EUR");
    expect(countryService.require("PY").currencyCode).toBe("PYG");
    expect(countryService.require("MX").currencyCode).toBe("MXN");
    expect(countryService.require("AR").currencyCode).toBe("ARS");
  });

  it("tax rate comes from the market, not a universal constant", () => {
    expect(taxService.defaultRate("ES")).toBe(21);
    expect(taxService.defaultRate("PY")).toBe(10);
    expect(taxService.defaultRate("MX")).toBe(16);
    expect(taxService.defaultRate("US")).toBe(8);
  });

  it("a local market price takes priority over FX conversion", () => {
    // roble-natural has explicit ES/PY/MX prices, none for CL
    const es = pricingService.resolve("flr-roble-natural", "ES");
    const cl = pricingService.resolve("flr-roble-natural", "CL");
    expect(es.source).toBe("market");
    expect(es.money.currency).toBe("EUR");
    expect(cl.source).toBe("converted");
    expect(cl.money.currency).toBe("CLP");
    expect(cl.convertedFrom?.currency).toBe("EUR");
  });

  it("the same product costs different amounts in different countries", () => {
    const es = pricingService.resolve("sof-modular-3p", "ES").money.amount;
    const py = pricingService.resolve("sof-modular-3p", "PY").money.amount;
    expect(py).not.toBe(es);
    expect(py).toBeGreaterThan(es); // PYG figures are far larger
  });

  it("money always carries its currency and formats per locale", () => {
    const formatted = currencyService.format({ amount: 1250.5, currency: "EUR" }, "es-ES");
    expect(formatted).toMatch(/250,50/); // comma decimal separator (es-ES)
    expect(formatted).toMatch(/€/);
    // zero-decimal currencies render without decimals
    expect(currencyService.format({ amount: 8250000, currency: "PYG" })).not.toMatch(/,\d\d/);
  });

  it("FX conversion is reference-only and reversible-ish", () => {
    const eur = { amount: 100, currency: "EUR" as const };
    const usd = currencyService.convert(eur, "USD");
    expect(usd.currency).toBe("USD");
    expect(usd.amount).toBeCloseTo(108, 0);
  });

  it("labour rates differ by country", () => {
    const esPaint = laborRateService.cost("ES", "painting")!;
    const pyPaint = laborRateService.cost("PY", "painting")!;
    expect(esPaint).toBeGreaterThan(0);
    expect(pyPaint).toBeGreaterThan(0);
    expect(pyPaint).not.toBe(esPaint);
  });

  it("a market snapshot freezes prices, taxes, labour and FX", () => {
    const snap = marketService.snapshot("PY", 10, ["flr-roble-natural", "sof-modular-3p"]);
    expect(snap.currencyCode).toBe("PYG");
    expect(snap.taxRate).toBe(10);
    expect(snap.productPrices).toHaveLength(2);
    expect(snap.laborRates.length).toBeGreaterThan(0);
    expect(snap.fxRates.length).toBeGreaterThan(0);
    expect(snap.capturedAt).toBeTruthy();
  });
});

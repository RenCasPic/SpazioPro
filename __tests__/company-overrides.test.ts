import { describe, expect, it } from "vitest";
import { pricingService } from "@/lib/market/pricing-service";
import { laborRateService } from "@/lib/market/labor-rate-service";
import type { CompanyLaborRate, CompanyProductPrice } from "@/types";

const cpp = (over: Partial<CompanyProductPrice> = {}): CompanyProductPrice => ({
  id: "cpp_1",
  companyId: "co_1",
  productId: "flr-lvp-coastal",
  stateCode: null,
  price: 4.1,
  updatedAt: "",
  ...over,
});

const clr = (over: Partial<CompanyLaborRate> = {}): CompanyLaborRate => ({
  id: "clr_1",
  companyId: "co_1",
  category: "flooring_installation",
  stateCode: null,
  cost: 5.25,
  updatedAt: "",
  ...over,
});

describe("company price overrides — resolved before state/national market prices", () => {
  it("with no overrides, behaves exactly as before", () => {
    const withOverride = pricingService.resolve("flr-lvp-coastal", "TX", []);
    const without = pricingService.resolve("flr-lvp-coastal", "TX");
    expect(withOverride).toEqual(without);
  });

  it("a company-wide override (stateCode null) applies in every state", () => {
    const r = pricingService.resolve("flr-lvp-coastal", "TX", [cpp()]);
    expect(r.money.amount).toBe(4.1);
    expect(r.source).toBe("company");
  });

  it("a state-specific override outranks a company-wide one", () => {
    const overrides = [cpp({ price: 4.1 }), cpp({ id: "cpp_2", stateCode: "CA", price: 4.6 })];
    expect(pricingService.resolve("flr-lvp-coastal", "CA", overrides).money.amount).toBe(4.6);
    expect(pricingService.resolve("flr-lvp-coastal", "TX", overrides).money.amount).toBe(4.1);
  });

  it("an override for a different product never leaks in", () => {
    const r = pricingService.resolve("flr-oak-engineered", "TX", [cpp()]);
    expect(r.source).not.toBe("company");
  });
});

describe("company labor overrides — amend cost, keep the market unit", () => {
  it("with no overrides, behaves exactly as before", () => {
    expect(laborRateService.rate("TX", "flooring_installation", [])).toEqual(
      laborRateService.rate("TX", "flooring_installation"),
    );
  });

  it("overrides the cost but keeps the category's real unit (sq_ft, not invented)", () => {
    const base = laborRateService.rate("TX", "flooring_installation");
    const overridden = laborRateService.rate("TX", "flooring_installation", [clr()]);
    expect(overridden?.cost).toBe(5.25);
    expect(overridden?.unit).toBe(base?.unit);
  });

  it("a state-specific override outranks a company-wide one", () => {
    const overrides = [clr({ cost: 5.25 }), clr({ id: "clr_2", stateCode: "CA", cost: 6.1 })];
    expect(laborRateService.rate("CA", "flooring_installation", overrides)?.cost).toBe(6.1);
    expect(laborRateService.rate("TX", "flooring_installation", overrides)?.cost).toBe(5.25);
  });
});

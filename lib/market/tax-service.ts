import type { TaxRate } from "@/types";
import { taxRatesForCountry } from "./data/tax-rates";
import { countryService } from "./country-service";

export const taxService = {
  ratesForCountry(code: string): TaxRate[] {
    return taxRatesForCountry(code);
  },

  /** Standard rate for a country — never a hard-coded universal value. */
  defaultRate(code: string): number {
    const standard = taxRatesForCountry(code).find((t) => t.category === "standard");
    return standard?.rate ?? countryService.require(code).defaultTaxRate;
  },

  rateName(code: string): string {
    return taxRatesForCountry(code)[0]?.name ?? "Impuesto";
  },
};

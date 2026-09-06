import type { TaxRate } from "@/types";
import { COUNTRIES } from "./countries";

/**
 * Tax rates per country. Every country gets a "standard" rate (matching its
 * `defaultTaxRate`) plus, where relevant, a reduced construction rate that a
 * user can pick per project.
 */
const CONSTRUCTION_RATE: Record<string, number> = {
  ES: 10, // IVA reducido reformas vivienda
  PT: 6,
  FR: 10,
  IT: 10,
  DE: 19,
  GB: 5,
};

export const TAX_RATES: TaxRate[] = COUNTRIES.flatMap((c) => {
  const rows: TaxRate[] = [
    {
      countryCode: c.code,
      name: taxName(c.code),
      rate: c.defaultTaxRate,
      category: "standard",
      active: true,
    },
  ];
  if (CONSTRUCTION_RATE[c.code] != null && CONSTRUCTION_RATE[c.code] !== c.defaultTaxRate) {
    rows.push({
      countryCode: c.code,
      name: `${taxName(c.code)} reducido (reforma vivienda)`,
      rate: CONSTRUCTION_RATE[c.code],
      category: "construction",
      active: true,
    });
  }
  return rows;
});

function taxName(code: string): string {
  switch (code) {
    case "US":
      return "Sales Tax";
    case "GB":
      return "VAT";
    case "FR":
      return "TVA";
    case "DE":
      return "MwSt";
    case "IT":
      return "IVA";
    case "BR":
      return "ICMS/ISS";
    default:
      return "IVA";
  }
}

export const taxRatesForCountry = (code: string): TaxRate[] =>
  TAX_RATES.filter((t) => t.countryCode === code.toUpperCase() && t.active);

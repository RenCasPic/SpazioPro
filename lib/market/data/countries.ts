import type { Country } from "@/types";

/**
 * US-first. The architecture supports more countries later, but the MVP
 * only seeds the United States.
 */
export const COUNTRIES: Country[] = [
  {
    code: "US",
    name: "United States",
    currencyCode: "USD",
    currencySymbol: "$",
    locale: "en-US",
    measurementSystem: "imperial",
    active: true,
  },
];

export const US = COUNTRIES[0];

export const countryByCode = (code: string): Country | undefined =>
  COUNTRIES.find((c) => c.code === code.toUpperCase());

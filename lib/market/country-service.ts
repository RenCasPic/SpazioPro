import type { Country } from "@/types";
import { COUNTRIES, countryByCode } from "./data/countries";

export const countryService = {
  list(activeOnly = true): Country[] {
    return activeOnly ? COUNTRIES.filter((c) => c.active) : COUNTRIES;
  },
  get(code: string): Country | undefined {
    return countryByCode(code);
  },
  require(code: string): Country {
    const country = countryByCode(code);
    if (!country) throw new Error(`País no soportado: ${code}`);
    return country;
  },
};

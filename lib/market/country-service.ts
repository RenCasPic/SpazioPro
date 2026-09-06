import type { Country, State } from "@/types";
import { COUNTRIES, countryByCode, US } from "./data/countries";
import { STATES, stateByCode } from "./data/states";

export const countryService = {
  list(): Country[] {
    return COUNTRIES.filter((c) => c.active);
  },
  get(code: string): Country | undefined {
    return countryByCode(code);
  },
  require(code: string): Country {
    return countryByCode(code) ?? US;
  },
  default(): Country {
    return US;
  },
};

export const stateService = {
  list(): State[] {
    return STATES.filter((s) => s.active);
  },
  get(code: string): State | undefined {
    return stateByCode(code);
  },
  name(code: string): string {
    return stateByCode(code)?.name ?? code;
  },
};

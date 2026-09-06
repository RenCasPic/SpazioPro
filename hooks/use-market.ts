"use client";

import type { State } from "@/types";
import { stateService } from "@/lib/market/country-service";
import { taxService } from "@/lib/market/tax-service";

export function useStates(): State[] {
  return stateService.list();
}

export function useTaxRate(query: { stateCode?: string; city?: string; zipCode?: string }) {
  return taxService.getTaxRate(query);
}

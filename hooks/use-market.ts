"use client";

import { useQuery } from "@tanstack/react-query";
import type { Country, Market } from "@/types";
import { countryService } from "@/lib/market/country-service";
import { marketService } from "@/lib/market/market-service";

/** Countries are static data — resolved locally, no request needed. */
export function useCountries(): Country[] {
  return countryService.list();
}

export function useMarket(countryCode: string | undefined) {
  return useQuery<Market>({
    queryKey: ["market", countryCode],
    enabled: !!countryCode,
    queryFn: async () => {
      const res = await fetch(`/api/markets/${countryCode}`);
      if (!res.ok) return marketService.get(countryCode!);
      return res.json();
    },
    initialData: countryCode ? marketService.get(countryCode) : undefined,
  });
}

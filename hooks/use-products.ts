"use client";

import { useMemo } from "react";
import type { CatalogFilter } from "@/lib/market/catalog-service";
import { productService } from "@/lib/services/product-service";

/** Priced catalog for a market. Data is local so this resolves synchronously. */
export function useCatalog(filter: CatalogFilter) {
  // eslint-disable-next-line react-hooks/exhaustive-deps -- filter is destructured below
  return useMemo(() => productService.search(filter), [
    filter.countryCode,
    filter.group,
    filter.category,
    filter.query,
    filter.brand,
    filter.style,
    filter.maxPrice,
    filter.availableOnly,
  ]);
}

export function useCatalogFacets(countryCode: string) {
  return useMemo(
    () => ({
      brands: productService.brands(),
      styles: productService.styles(),
      priceRange: productService.priceRange(countryCode),
    }),
    [countryCode],
  );
}

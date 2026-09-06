"use client";

import { useMemo } from "react";
import type { CatalogFilter } from "@/lib/market/catalog-service";
import { productService } from "@/lib/services/product-service";

export function useCatalog(filter: CatalogFilter) {
  // eslint-disable-next-line react-hooks/exhaustive-deps -- filter fields listed
  return useMemo(() => productService.search(filter), [
    filter.stateCode,
    filter.group,
    filter.category,
    filter.query,
    filter.brand,
    filter.style,
    filter.maxPrice,
    filter.availableOnly,
  ]);
}

export function useCatalogFacets(stateCode: string | null) {
  return useMemo(
    () => ({
      brands: productService.brands(),
      styles: productService.styles(),
      priceRange: productService.priceRange(stateCode),
    }),
    [stateCode],
  );
}

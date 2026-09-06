import { catalogService, type CatalogFilter } from "@/lib/market/catalog-service";
import { pricingService } from "@/lib/market/pricing-service";

/** Facade used by hooks / API for the priced catalog. */
export const productService = {
  search: (filter: CatalogFilter) => catalogService.search(filter),
  get: (id: string) => catalogService.get(id),
  brands: () => catalogService.brands(),
  styles: () => catalogService.styles(),
  priceRange: (countryCode: string) => catalogService.priceRange(countryCode),
  price: (productId: string, countryCode: string) => pricingService.resolve(productId, countryCode),
};

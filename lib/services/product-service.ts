import { catalogService, type CatalogFilter } from "@/lib/market/catalog-service";
import { pricingService } from "@/lib/market/pricing-service";

export const productService = {
  search: (filter: CatalogFilter) => catalogService.search(filter),
  get: (id: string) => catalogService.get(id),
  brands: () => catalogService.brands(),
  styles: () => catalogService.styles(),
  priceRange: (stateCode: string | null) => catalogService.priceRange(stateCode),
  price: (productId: string, stateCode: string | null) => pricingService.resolve(productId, stateCode),
};

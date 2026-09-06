import type { Product, ProductCategory, ProductGroup, ResolvedPrice } from "@/types";
import { CATALOG, productById } from "@/data/catalog";
import { pricingService } from "./pricing-service";

export interface CatalogFilter {
  stateCode: string | null;
  group?: ProductGroup;
  category?: ProductCategory;
  query?: string;
  brand?: string;
  style?: string;
  maxPrice?: number;
  availableOnly?: boolean;
}

export interface CatalogEntry {
  product: Product;
  price: ResolvedPrice;
}

export const catalogService = {
  all(): Product[] {
    return CATALOG;
  },
  get(id: string): Product | undefined {
    return productById(id);
  },
  brands(): string[] {
    return [...new Set(CATALOG.map((p) => p.brand))].sort();
  },
  styles(): string[] {
    return [...new Set(CATALOG.map((p) => p.style))].sort();
  },

  search(filter: CatalogFilter): CatalogEntry[] {
    const q = filter.query?.trim().toLowerCase();
    return CATALOG.filter((p) => {
      if (filter.group && p.group !== filter.group) return false;
      if (filter.category && p.category !== filter.category) return false;
      if (filter.brand && p.brand !== filter.brand) return false;
      if (filter.style && p.style !== filter.style) return false;
      if (q) {
        const hay = `${p.name} ${p.brand} ${p.sku} ${p.description} ${p.style} ${p.color}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    })
      .map((product) => ({ product, price: pricingService.resolve(product.id, filter.stateCode) }))
      .filter((e) => {
        if (filter.availableOnly && !e.price.available) return false;
        if (filter.maxPrice != null && e.price.money.amount > filter.maxPrice) return false;
        return true;
      });
  },

  priceRange(stateCode: string | null): [number, number] {
    const prices = CATALOG.map((p) => pricingService.resolve(p.id, stateCode).money.amount);
    return [Math.min(...prices), Math.max(...prices)];
  },
};

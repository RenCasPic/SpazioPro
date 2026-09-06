import { CATALOG, productById } from "@/data/catalog";
import type { Product, ProductCategory, ProductGroup } from "@/types";

export interface ProductFilter {
  group?: ProductGroup;
  category?: ProductCategory;
  query?: string;
  brand?: string;
  style?: string;
  color?: string;
  maxPrice?: number;
}

export const productService = {
  all(): Product[] {
    return CATALOG;
  },
  byId: productById,
  byCategory(category: ProductCategory): Product[] {
    return CATALOG.filter((p) => p.category === category);
  },
  brands(): string[] {
    return unique(CATALOG.map((p) => p.brand)).sort();
  },
  styles(): string[] {
    return unique(CATALOG.map((p) => p.style)).sort();
  },
  colors(): string[] {
    return unique(CATALOG.map((p) => p.color)).sort();
  },
  priceRange(): [number, number] {
    const prices = CATALOG.map((p) => p.price);
    return [Math.min(...prices), Math.max(...prices)];
  },
  search(filter: ProductFilter): Product[] {
    const q = filter.query?.trim().toLowerCase();
    return CATALOG.filter((p) => {
      if (filter.group && p.group !== filter.group) return false;
      if (filter.category && p.category !== filter.category) return false;
      if (filter.brand && p.brand !== filter.brand) return false;
      if (filter.style && p.style !== filter.style) return false;
      if (filter.color && p.color !== filter.color) return false;
      if (filter.maxPrice != null && p.price > filter.maxPrice) return false;
      if (q) {
        const hay = `${p.name} ${p.brand} ${p.reference} ${p.description} ${p.style} ${p.color}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  },
};

function unique<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

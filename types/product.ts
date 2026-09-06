import type { CurrencyCode, LaborCategory, Money } from "./market";

export type ProductCategory =
  | "floor"
  | "wall"
  | "paint"
  | "tile"
  | "stone"
  | "wood"
  | "microcement"
  | "wallpaper"
  | "sofa"
  | "table"
  | "chair"
  | "bed"
  | "wardrobe"
  | "kitchen"
  | "bathroom"
  | "lighting"
  | "appliance"
  | "decoration"
  | "construction"
  | "other";

export type ProductGroup =
  | "materials"
  | "furniture"
  | "kitchen"
  | "bathroom"
  | "lighting"
  | "decoration"
  | "construction";

export type Unit = "m2" | "ml" | "m3" | "ud" | "l" | "h" | "day" | "global";

/** How a resolved price was obtained — surfaced in the UI and snapshots. */
export type PriceSource =
  | "market" // explicit local market price for the country
  | "supplier" // a specific local supplier price
  | "converted" // FX conversion from another currency (reference only)
  | "missing"; // no price available

export interface ProductMarketPrice {
  productId: string;
  countryCode: string;
  price: number;
  currencyCode: CurrencyCode;
  supplier: string;
  available: boolean;
  minQuantity: number;
  source: Exclude<PriceSource, "converted" | "missing">;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  brand: string;
  category: ProductCategory;
  group: ProductGroup;
  subcategory: string;
  description: string;
  imageUrl: string | null;
  /** CSS colour / gradient used as a swatch when there is no photo */
  swatch: string;
  /** emoji sprite used only inside the editor canvas as a lightweight proxy */
  sprite?: string;
  unit: Unit;
  color: string;
  style: string;
  /** which surface a material covers, if any */
  surface?: "floor" | "wall" | "ceiling";
  /** labour category used to look up the market labour rate */
  laborCategory: LaborCategory;
  /** recommended waste percentage for this kind of material */
  wastePercent: number;
  demo: boolean;
}

/** A price resolved for a given country at a given moment. */
export interface ResolvedPrice {
  productId: string;
  money: Money;
  source: PriceSource;
  supplier: string | null;
  available: boolean;
  /** set when source === 'converted' */
  convertedFrom?: Money;
  capturedAt: string;
}

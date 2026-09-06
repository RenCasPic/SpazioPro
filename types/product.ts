import type { CurrencyCode, LaborCategory } from "./market";

export type ProductCategory =
  // Flooring
  | "hardwood"
  | "engineered_hardwood"
  | "lvp"
  | "laminate"
  | "carpet"
  | "floor_tile"
  | "floor_stone"
  // Walls
  | "paint"
  | "drywall"
  | "wallpaper"
  | "wall_tile"
  | "wall_stone"
  | "wood_paneling"
  | "wainscoting"
  // Kitchen
  | "cabinets"
  | "countertops"
  | "backsplash"
  | "kitchen_sink"
  | "faucet"
  | "appliance"
  // Bathroom
  | "vanity"
  | "toilet"
  | "shower"
  | "bathtub"
  | "bath_tile"
  | "fixture"
  | "mirror"
  // Furniture
  | "sofa"
  | "sectional"
  | "chair"
  | "table"
  | "bed"
  | "nightstand"
  | "dresser"
  | "desk"
  // Lighting
  | "pendant"
  | "chandelier"
  | "recessed"
  | "wall_sconce"
  | "floor_lamp"
  | "table_lamp"
  | "other";

export type ProductGroup = "flooring" | "walls" | "kitchen" | "bathroom" | "furniture" | "lighting";

export type Unit =
  | "sq_ft"
  | "linear_ft"
  | "cu_ft"
  | "cu_yd"
  | "ea"
  | "gallon"
  | "hour"
  | "day"
  | "project";

export type PriceSource = "market" | "supplier" | "converted" | "missing";

export interface ProductMarketPrice {
  productId: string;
  countryCode: string;
  stateCode: string | null;
  price: number;
  currencyCode: CurrencyCode;
  supplier: string;
  available: boolean;
  minQuantity: number;
  leadTimeDays: number;
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
  swatch: string;
  sprite?: string;
  unit: Unit;
  color: string;
  style: string;
  surface?: "floor" | "wall" | "ceiling";
  laborCategory: LaborCategory;
  wastePercent: number;
  demo: boolean;
}

export interface ResolvedPrice {
  productId: string;
  money: import("./market").Money;
  source: PriceSource;
  supplier: string | null;
  available: boolean;
  leadTimeDays: number;
  convertedFrom?: import("./market").Money;
  capturedAt: string;
}

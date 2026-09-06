import type { ProductCategory, ProductGroup } from "@/types";
import type { SurfaceKind } from "@/lib/constants";

export interface CategoryMeta {
  key: ProductCategory;
  group: ProductGroup;
  /** i18n-free English label; UI usually shows the group + product name */
  label: string;
  kind: "surface" | "object";
  surface?: SurfaceKind;
}

export const CATEGORIES: CategoryMeta[] = [
  // Flooring
  { key: "hardwood", group: "flooring", label: "Hardwood", kind: "surface", surface: "floor" },
  { key: "engineered_hardwood", group: "flooring", label: "Engineered Hardwood", kind: "surface", surface: "floor" },
  { key: "lvp", group: "flooring", label: "LVP", kind: "surface", surface: "floor" },
  { key: "laminate", group: "flooring", label: "Laminate", kind: "surface", surface: "floor" },
  { key: "carpet", group: "flooring", label: "Carpet", kind: "surface", surface: "floor" },
  { key: "floor_tile", group: "flooring", label: "Tile", kind: "surface", surface: "floor" },
  { key: "floor_stone", group: "flooring", label: "Stone", kind: "surface", surface: "floor" },
  // Walls
  { key: "paint", group: "walls", label: "Paint", kind: "surface", surface: "wall" },
  { key: "drywall", group: "walls", label: "Drywall", kind: "surface", surface: "wall" },
  { key: "wallpaper", group: "walls", label: "Wallpaper", kind: "surface", surface: "wall" },
  { key: "wall_tile", group: "walls", label: "Tile", kind: "surface", surface: "wall" },
  { key: "wall_stone", group: "walls", label: "Stone", kind: "surface", surface: "wall" },
  { key: "wood_paneling", group: "walls", label: "Wood Paneling", kind: "surface", surface: "wall" },
  { key: "wainscoting", group: "walls", label: "Wainscoting", kind: "surface", surface: "wall" },
  // Kitchen
  { key: "cabinets", group: "kitchen", label: "Cabinets", kind: "object" },
  { key: "countertops", group: "kitchen", label: "Countertops", kind: "surface", surface: "wall" },
  { key: "backsplash", group: "kitchen", label: "Backsplash", kind: "surface", surface: "wall" },
  { key: "kitchen_sink", group: "kitchen", label: "Sinks", kind: "object" },
  { key: "faucet", group: "kitchen", label: "Faucets", kind: "object" },
  { key: "appliance", group: "kitchen", label: "Appliances", kind: "object" },
  // Bathroom
  { key: "vanity", group: "bathroom", label: "Vanity", kind: "object" },
  { key: "toilet", group: "bathroom", label: "Toilet", kind: "object" },
  { key: "shower", group: "bathroom", label: "Shower", kind: "object" },
  { key: "bathtub", group: "bathroom", label: "Bathtub", kind: "object" },
  { key: "bath_tile", group: "bathroom", label: "Tile", kind: "surface", surface: "wall" },
  { key: "fixture", group: "bathroom", label: "Fixtures", kind: "object" },
  { key: "mirror", group: "bathroom", label: "Mirrors", kind: "object" },
  // Furniture
  { key: "sofa", group: "furniture", label: "Sofa", kind: "object" },
  { key: "sectional", group: "furniture", label: "Sectional", kind: "object" },
  { key: "chair", group: "furniture", label: "Chair", kind: "object" },
  { key: "table", group: "furniture", label: "Table", kind: "object" },
  { key: "bed", group: "furniture", label: "Bed", kind: "object" },
  { key: "nightstand", group: "furniture", label: "Nightstand", kind: "object" },
  { key: "dresser", group: "furniture", label: "Dresser", kind: "object" },
  { key: "desk", group: "furniture", label: "Desk", kind: "object" },
  // Lighting
  { key: "pendant", group: "lighting", label: "Pendant", kind: "object" },
  { key: "chandelier", group: "lighting", label: "Chandelier", kind: "object" },
  { key: "recessed", group: "lighting", label: "Recessed", kind: "object" },
  { key: "wall_sconce", group: "lighting", label: "Wall Sconce", kind: "object" },
  { key: "floor_lamp", group: "lighting", label: "Floor Lamp", kind: "object" },
  { key: "table_lamp", group: "lighting", label: "Table Lamp", kind: "object" },
  { key: "other", group: "furniture", label: "Other", kind: "object" },
];

/** i18n keys — see the editor namespace; catalog uses group names directly */
export const GROUP_KEYS: Record<ProductGroup, string> = {
  flooring: "editor.materials",
  walls: "editor.walls",
  kitchen: "editor.kitchen",
  bathroom: "editor.bathroom",
  furniture: "editor.furniture",
  lighting: "editor.lighting",
};

export const GROUP_LABELS_EN: Record<ProductGroup, string> = {
  flooring: "Flooring",
  walls: "Walls",
  kitchen: "Kitchen",
  bathroom: "Bathroom",
  furniture: "Furniture",
  lighting: "Lighting",
};

export const GROUP_LABELS_ES: Record<ProductGroup, string> = {
  flooring: "Pisos",
  walls: "Paredes",
  kitchen: "Cocina",
  bathroom: "Baño",
  furniture: "Mobiliario",
  lighting: "Iluminación",
};

export const GROUP_ORDER: ProductGroup[] = [
  "flooring",
  "walls",
  "kitchen",
  "bathroom",
  "furniture",
  "lighting",
];

export const categoryMeta = (key: ProductCategory): CategoryMeta =>
  CATEGORIES.find((c) => c.key === key) ?? {
    key,
    group: "furniture",
    label: key,
    kind: "object",
  };

import type { ProductCategory, ProductGroup } from "@/types";
import type { SurfaceKind } from "@/lib/constants";

export interface CategoryMeta {
  key: ProductCategory;
  group: ProductGroup;
  label: string;
  kind: "surface" | "object";
  surface?: SurfaceKind;
}

export const CATEGORIES: CategoryMeta[] = [
  { key: "floor", group: "materials", label: "Suelos", kind: "surface", surface: "floor" },
  { key: "wall", group: "materials", label: "Paredes", kind: "surface", surface: "wall" },
  { key: "paint", group: "materials", label: "Pintura", kind: "surface", surface: "wall" },
  { key: "tile", group: "materials", label: "Azulejos", kind: "surface", surface: "wall" },
  { key: "stone", group: "materials", label: "Piedra", kind: "surface", surface: "wall" },
  { key: "wood", group: "materials", label: "Madera", kind: "surface", surface: "floor" },
  { key: "microcement", group: "materials", label: "Microcemento", kind: "surface", surface: "floor" },
  { key: "wallpaper", group: "materials", label: "Papel tapiz", kind: "surface", surface: "wall" },

  { key: "sofa", group: "furniture", label: "Sofás", kind: "object" },
  { key: "table", group: "furniture", label: "Mesas", kind: "object" },
  { key: "chair", group: "furniture", label: "Sillas", kind: "object" },
  { key: "bed", group: "furniture", label: "Camas", kind: "object" },
  { key: "wardrobe", group: "furniture", label: "Armarios", kind: "object" },

  { key: "kitchen", group: "kitchen", label: "Cocina", kind: "object" },
  { key: "bathroom", group: "bathroom", label: "Baño", kind: "object" },
  { key: "appliance", group: "kitchen", label: "Electrodomésticos", kind: "object" },

  { key: "lighting", group: "lighting", label: "Iluminación", kind: "object" },

  { key: "decoration", group: "decoration", label: "Decoración", kind: "object" },
  { key: "construction", group: "construction", label: "Construcción", kind: "surface", surface: "wall" },
  { key: "other", group: "materials", label: "Otros", kind: "object" },
];

export const GROUP_LABELS: Record<ProductGroup, string> = {
  materials: "Materiales",
  furniture: "Mobiliario",
  kitchen: "Cocina",
  bathroom: "Baño",
  lighting: "Iluminación",
  decoration: "Decoración",
  construction: "Construcción",
};

export const GROUP_ORDER: ProductGroup[] = [
  "materials",
  "furniture",
  "kitchen",
  "bathroom",
  "lighting",
  "decoration",
  "construction",
];

export const categoryMeta = (key: ProductCategory): CategoryMeta =>
  CATEGORIES.find((c) => c.key === key) ?? {
    key,
    group: "materials",
    label: key,
    kind: "object",
  };

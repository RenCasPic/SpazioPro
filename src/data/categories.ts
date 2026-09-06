import type { CategoryMeta, ProductCategory, ProductGroup } from "@/types";

export const CATEGORIES: CategoryMeta[] = [
  // Materiales
  { key: "floor", group: "materials", label: "Suelos", kind: "surface", surface: "floor" },
  { key: "wall", group: "materials", label: "Paredes", kind: "surface", surface: "wall" },
  { key: "paint", group: "materials", label: "Pintura", kind: "surface", surface: "wall" },
  { key: "tile", group: "materials", label: "Azulejos", kind: "surface", surface: "wall" },
  { key: "cladding", group: "materials", label: "Revestimientos", kind: "surface", surface: "wall" },
  { key: "stone", group: "materials", label: "Piedra", kind: "surface", surface: "wall" },
  { key: "wood", group: "materials", label: "Madera", kind: "surface", surface: "floor" },
  // Mobiliario
  { key: "sofa", group: "furniture", label: "Sofás", kind: "object" },
  { key: "table", group: "furniture", label: "Mesas", kind: "object" },
  { key: "chair", group: "furniture", label: "Sillas", kind: "object" },
  { key: "bed", group: "furniture", label: "Camas", kind: "object" },
  { key: "wardrobe", group: "furniture", label: "Armarios", kind: "object" },
  { key: "shelving", group: "furniture", label: "Estanterías", kind: "object" },
  // Cocina
  { key: "kitchen_unit", group: "kitchen", label: "Muebles", kind: "object" },
  { key: "countertop", group: "kitchen", label: "Encimeras", kind: "surface", surface: "wall" },
  { key: "appliance", group: "kitchen", label: "Electrodomésticos", kind: "object" },
  // Baño
  { key: "sink", group: "bathroom", label: "Lavabos", kind: "object" },
  { key: "wc", group: "bathroom", label: "WC", kind: "object" },
  { key: "shower", group: "bathroom", label: "Duchas", kind: "object" },
  { key: "bathtub", group: "bathroom", label: "Bañeras", kind: "object" },
  { key: "screen", group: "bathroom", label: "Mamparas", kind: "object" },
  // Iluminación
  { key: "lighting", group: "lighting", label: "Lámparas y focos", kind: "object" },
  // Decoración
  { key: "plant", group: "decor", label: "Plantas", kind: "object" },
  { key: "art", group: "decor", label: "Cuadros", kind: "object" },
  { key: "mirror", group: "decor", label: "Espejos", kind: "object" },
  { key: "rug", group: "decor", label: "Alfombras", kind: "object" },
  { key: "curtain", group: "decor", label: "Cortinas", kind: "object" },
];

export const GROUP_LABELS: Record<ProductGroup, string> = {
  materials: "Materiales",
  furniture: "Mobiliario",
  kitchen: "Cocina",
  bathroom: "Baño",
  lighting: "Iluminación",
  decor: "Decoración",
};

export const GROUP_ORDER: ProductGroup[] = [
  "materials",
  "furniture",
  "kitchen",
  "bathroom",
  "lighting",
  "decor",
];

export const categoryMeta = (key: ProductCategory): CategoryMeta =>
  CATEGORIES.find((c) => c.key === key) ?? {
    key,
    group: "materials",
    label: key,
    kind: "object",
  };

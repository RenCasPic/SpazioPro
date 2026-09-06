// Core domain types for SpazioPro

export type RoomType =
  | "living_room"
  | "kitchen"
  | "bathroom"
  | "bedroom"
  | "office"
  | "retail"
  | "terrace"
  | "other";

export const ROOM_TYPE_LABELS: Record<RoomType, string> = {
  living_room: "Salón",
  kitchen: "Cocina",
  bathroom: "Baño",
  bedroom: "Dormitorio",
  office: "Oficina",
  retail: "Local comercial",
  terrace: "Terraza",
  other: "Otro",
};

export type ProjectStatus = "draft" | "designing" | "estimated" | "finished";

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  draft: "Borrador",
  designing: "En diseño",
  estimated: "Presupuesto generado",
  finished: "Finalizado",
};

export type Unit = "m2" | "ml" | "ud" | "h" | "global";

export const UNIT_LABELS: Record<Unit, string> = {
  m2: "m²",
  ml: "ml",
  ud: "ud",
  h: "h",
  global: "global",
};

export type ProductCategory =
  | "floor"
  | "wall"
  | "paint"
  | "tile"
  | "cladding"
  | "stone"
  | "wood"
  | "sofa"
  | "table"
  | "chair"
  | "bed"
  | "wardrobe"
  | "shelving"
  | "kitchen_unit"
  | "countertop"
  | "appliance"
  | "sink"
  | "wc"
  | "shower"
  | "bathtub"
  | "screen"
  | "lighting"
  | "plant"
  | "art"
  | "mirror"
  | "rug"
  | "curtain"
  | "other";

export type ProductGroup =
  | "materials"
  | "furniture"
  | "kitchen"
  | "bathroom"
  | "lighting"
  | "decor";

export interface CategoryMeta {
  key: ProductCategory;
  group: ProductGroup;
  label: string;
  /** kind determines how it behaves in the editor */
  kind: "surface" | "object";
  /** default surface it applies to */
  surface?: SurfaceKind;
}

export type SurfaceKind = "floor" | "wall" | "ceiling";

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  group: ProductGroup;
  brand: string;
  reference: string;
  supplier: string;
  price: number;
  unit: Unit;
  /** labour cost per unit (same unit as price) */
  labor: number;
  color: string;
  style: string;
  description: string;
  /** solid color / gradient used to preview the product on the canvas */
  swatch: string;
  /** emoji used as a lightweight object sprite */
  sprite?: string;
}

export interface Dimensions {
  width: number; // m
  length: number; // m
  height: number; // m
  /** true when values come from AI estimation rather than user input */
  estimated: boolean;
}

export interface DetectedSurface {
  kind: SurfaceKind;
  label: string;
  confidence: number;
}

export interface DetectedObject {
  label: string;
  confidence: number;
}

export interface VisionResult {
  room_type: RoomType;
  surfaces: DetectedSurface[];
  objects: DetectedObject[];
  dimensions_estimate: Dimensions;
  summary: string;
}

/** An item placed on the canvas / included in the estimate. */
export interface ProjectItem {
  id: string;
  productId: string;
  scenarioId: string;
  kind: "surface" | "object";
  /** for surfaces: which surface it covers */
  surface?: SurfaceKind;
  /** editable snapshot of product data so the user can override */
  name: string;
  category: ProductCategory;
  brand: string;
  unit: Unit;
  unitPrice: number;
  laborPrice: number;
  /** quantity; auto-derived for surfaces, manual for objects */
  quantity: number;
  quantityAuto: boolean;
  /** waste percentage applied to surfaces */
  wastePct: number;
  /** canvas transform for objects (percentages of image box) */
  transform: { x: number; y: number; scale: number; rotation: number };
}

export interface LaborLine {
  id: string;
  label: string;
  unit: Unit;
  quantity: number;
  price: number;
  enabled: boolean;
}

export interface Scenario {
  id: string;
  name: string;
  tier: "economy" | "standard" | "premium" | "custom";
}

export interface EstimateSettings {
  vatPct: number;
  transport: number;
  discountPct: number;
  companyName: string;
  companyTagline: string;
}

export interface Project {
  id: string;
  name: string;
  roomType: RoomType;
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
  /** original uploaded photo (data URL) */
  photo?: string;
  /** generated design preview (data URL or CSS filter descriptor) */
  designFilter?: string;
  vision?: VisionResult;
  dimensions: Dimensions;
  scenarios: Scenario[];
  activeScenarioId: string;
  items: ProjectItem[];
  labor: LaborLine[];
  settings: EstimateSettings;
}

export interface EstimateTotals {
  materials: number;
  labor: number;
  transport: number;
  subtotal: number;
  discount: number;
  taxable: number;
  vat: number;
  total: number;
}

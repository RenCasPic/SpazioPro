import type { Unit } from "@/types";

export const APP_NAME = "SpazioPro";

/** i18n keys — see the common namespace (unit.*). */
export const UNIT_KEYS: Record<Unit, string> = {
  sq_ft: "common.unit.sqft",
  linear_ft: "common.unit.linft",
  cu_ft: "common.unit.cuft",
  cu_yd: "common.unit.cuyd",
  ea: "common.unit.ea",
  gallon: "common.unit.gal",
  hour: "common.unit.hour",
  day: "common.unit.day",
  project: "common.unit.project",
};

/** Plain-English fallback labels for non-React contexts (PDF, etc.). */
export const UNIT_LABELS_EN: Record<Unit, string> = {
  sq_ft: "sq ft",
  linear_ft: "linear ft",
  cu_ft: "cu ft",
  cu_yd: "cu yd",
  ea: "ea",
  gallon: "gal",
  hour: "hr",
  day: "day",
  project: "project",
};

export const UNIT_LABELS_ES: Record<Unit, string> = {
  sq_ft: "pies²",
  linear_ft: "pies lin.",
  cu_ft: "pies³",
  cu_yd: "yd³",
  ea: "u",
  gallon: "gal",
  hour: "h",
  day: "día",
  project: "proyecto",
};

export type SurfaceKind = "floor" | "wall" | "ceiling";

export const SURFACE_KEYS: Record<SurfaceKind, string> = {
  floor: "common.surface.floor",
  wall: "common.surface.walls",
  ceiling: "common.surface.ceiling",
};

export const DEFAULT_WASTE_BY_CATEGORY: Record<string, number> = {
  floor_tile: 12,
  wall_tile: 12,
  bath_tile: 12,
  backsplash: 12,
  floor_stone: 12,
  wall_stone: 12,
  hardwood: 8,
  engineered_hardwood: 8,
  lvp: 8,
  laminate: 8,
  carpet: 10,
  paint: 5,
  drywall: 10,
  wallpaper: 15,
  wood_paneling: 10,
  wainscoting: 10,
};

export const STORAGE_BUCKETS = [
  "project-images",
  "project-renders",
  "avatars",
  "pdfs",
  "product-images",
] as const;

export const MAX_IMAGE_BYTES = 12 * 1024 * 1024;
export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function isDemoMode(): boolean {
  const forced = process.env.NEXT_PUBLIC_DEMO_MODE ?? process.env.DEMO_MODE;
  if (forced === "true") return true;
  if (forced === "false") return false;
  return !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
}

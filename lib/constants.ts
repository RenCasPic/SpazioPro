import type { Unit } from "@/types";

export const APP_NAME = "SpazioPro";
export const APP_TAGLINE = "Visualiza. Presupuesta. Construye.";
export const APP_DESCRIPTION =
  "Diseña espacios, visualiza propuestas y genera presupuestos profesionales desde un solo lugar.";

export const UNIT_LABELS: Record<Unit, string> = {
  m2: "m²",
  ml: "ml",
  m3: "m³",
  ud: "ud",
  l: "L",
  h: "h",
  day: "jornada",
  global: "global",
};

export type SurfaceKind = "floor" | "wall" | "ceiling";

export const SURFACE_LABELS: Record<SurfaceKind, string> = {
  floor: "Suelo",
  wall: "Paredes",
  ceiling: "Techo",
};

export const DEFAULT_WASTE_BY_CATEGORY: Record<string, number> = {
  tile: 12,
  stone: 12,
  microcement: 8,
  wood: 8,
  floor: 10,
  wall: 10,
  paint: 5,
  wallpaper: 10,
  cladding: 10,
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
  // Demo unless BOTH Supabase env vars are present and DEMO_MODE isn't forced on.
  const forced = process.env.NEXT_PUBLIC_DEMO_MODE ?? process.env.DEMO_MODE;
  if (forced === "true") return true;
  if (forced === "false") return false;
  return !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
}

export const PRICE_DISCLAIMER =
  "Esta estimación tiene carácter orientativo. Los precios y cantidades pueden variar en función de las mediciones reales, condiciones del espacio, disponibilidad de materiales, proveedor, ubicación y mano de obra.";

import type { LaborCategory } from "@/types";

/**
 * The trade taxonomy for Scope of Work sections — reuses `LaborCategory`
 * (already the estimate engine's labor taxonomy) instead of inventing a
 * second one. Ordered the way a contractor thinks about a job: site work
 * first, trim last.
 */
export const SCOPE_CATEGORIES: LaborCategory[] = [
  "demolition",
  "framing",
  "roofing",
  "plumbing",
  "electrical",
  "hvac",
  "drywall",
  "flooring_installation",
  "tile_installation",
  "cabinet_installation",
  "countertop_installation",
  "painting",
  "finish_carpentry",
  "carpentry",
  "assembly",
  "cleaning",
  "general_labor",
];

/** i18n keys live under `projects.scope_category` in each locale's projects.json. */
export const SCOPE_CATEGORY_KEY: Record<LaborCategory, string> = {
  demolition: "projects.scope_category.demolition",
  framing: "projects.scope_category.framing",
  roofing: "projects.scope_category.roofing",
  plumbing: "projects.scope_category.plumbing",
  electrical: "projects.scope_category.electrical",
  hvac: "projects.scope_category.hvac",
  drywall: "projects.scope_category.drywall",
  flooring_installation: "projects.scope_category.flooring_installation",
  tile_installation: "projects.scope_category.tile_installation",
  cabinet_installation: "projects.scope_category.cabinet_installation",
  countertop_installation: "projects.scope_category.countertop_installation",
  painting: "projects.scope_category.painting",
  finish_carpentry: "projects.scope_category.finish_carpentry",
  carpentry: "projects.scope_category.carpentry",
  assembly: "projects.scope_category.assembly",
  cleaning: "projects.scope_category.cleaning",
  general_labor: "projects.scope_category.general_labor",
  delivery: "projects.scope_category.delivery",
};

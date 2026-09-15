import type { Assembly } from "@/types";

/**
 * Professional assembly catalog — named constructive solutions a contractor
 * can drop into a project in one step. The "primary" component is the
 * product the user picks (a real catalog item, priced/labored like any other
 * item); accessory components are fixed-ratio installation supplies, already
 * in the catalog under `installation_supply` so they carry real state pricing.
 */
export const ASSEMBLIES: Assembly[] = [
  {
    id: "asm-lvp-flooring",
    name: "LVP / Laminate Flooring Assembly",
    description:
      "Flooring material, underlayment and transition strips — installation labor and waste applied per item.",
    category: "flooring_installation",
    baseUnit: "sq_ft",
    primaryCategories: ["lvp", "laminate", "engineered_hardwood", "hardwood"],
    components: [
      { productId: null, role: "primary", coveragePerUnit: 1 },
      { productId: "sup-underlayment", role: "accessory", coveragePerUnit: 1 },
      // ~1 linear ft of transition per 12 sq ft of floor — a rough door-count proxy
      { productId: "sup-transition-strip", role: "accessory", coveragePerUnit: 1 / 12 },
    ],
  },
  {
    id: "asm-tile-floor",
    name: "Tile Floor Assembly",
    description: "Tile, thinset and grout — for bathroom, kitchen or general floor tile.",
    category: "tile_installation",
    baseUnit: "sq_ft",
    primaryCategories: ["floor_tile", "bath_tile", "floor_stone"],
    components: [
      { productId: null, role: "primary", coveragePerUnit: 1 },
      { productId: "sup-thinset", role: "accessory", coveragePerUnit: 1 },
      { productId: "sup-grout", role: "accessory", coveragePerUnit: 1 },
    ],
  },
  {
    id: "asm-tile-wall",
    name: "Wall / Backsplash Tile Assembly",
    description: "Wall tile or backsplash, thinset and grout.",
    category: "tile_installation",
    baseUnit: "sq_ft",
    primaryCategories: ["wall_tile", "backsplash"],
    components: [
      { productId: null, role: "primary", coveragePerUnit: 1 },
      { productId: "sup-thinset", role: "accessory", coveragePerUnit: 1 },
      { productId: "sup-grout", role: "accessory", coveragePerUnit: 0.6 },
    ],
  },
  {
    id: "asm-interior-paint",
    name: "Interior Paint Assembly",
    description: "Wall or ceiling paint — quantity converted from area to gallons (~350 sq ft/gal, 1 coat).",
    category: "painting",
    baseUnit: "sq_ft",
    primaryCategories: ["paint"],
    components: [{ productId: null, role: "primary", coveragePerUnit: 1 / 350 }],
  },
];

export function assemblyById(id: string): Assembly | undefined {
  return ASSEMBLIES.find((a) => a.id === id);
}

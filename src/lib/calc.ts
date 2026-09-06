import type {
  Dimensions,
  EstimateSettings,
  EstimateTotals,
  LaborLine,
  ProjectItem,
  SurfaceKind,
} from "@/types";

export interface SurfaceAreas {
  floor: number;
  ceiling: number;
  wall: number;
  perimeter: number;
}

/** Geometry derived from room dimensions. */
export function surfaceAreas(d: Dimensions): SurfaceAreas {
  const floor = d.width * d.length;
  const perimeter = 2 * (d.width + d.length);
  const wall = perimeter * d.height;
  return {
    floor: round2(floor),
    ceiling: round2(floor),
    perimeter: round2(perimeter),
    wall: round2(wall),
  };
}

/** Base quantity (before waste) for a surface item, in its own unit. */
export function baseQuantityForSurface(surface: SurfaceKind | undefined, d: Dimensions, unit: string): number {
  const a = surfaceAreas(d);
  if (unit === "ml") return a.perimeter;
  switch (surface) {
    case "floor":
      return a.floor;
    case "ceiling":
      return a.ceiling;
    case "wall":
      return a.wall;
    default:
      return a.floor;
  }
}

/** Quantity with waste applied and rounded up to 2 decimals. */
export function withWaste(base: number, wastePct: number): number {
  return Math.ceil(base * (1 + wastePct / 100) * 100) / 100;
}

export function itemQuantity(item: ProjectItem, d: Dimensions): number {
  if (item.kind === "object") return item.quantity;
  if (!item.quantityAuto) return item.quantity;
  const base = baseQuantityForSurface(item.surface, d, item.unit);
  return withWaste(base, item.wastePct);
}

export function itemMaterialSubtotal(item: ProjectItem, d: Dimensions): number {
  return round2(itemQuantity(item, d) * item.unitPrice);
}

export function itemLaborSubtotal(item: ProjectItem, d: Dimensions): number {
  return round2(itemQuantity(item, d) * item.laborPrice);
}

export function itemTotal(item: ProjectItem, d: Dimensions): number {
  return round2(itemMaterialSubtotal(item, d) + itemLaborSubtotal(item, d));
}

export function computeTotals(
  items: ProjectItem[],
  labor: LaborLine[],
  settings: EstimateSettings,
  d: Dimensions,
): EstimateTotals {
  const materials = round2(items.reduce((s, it) => s + itemMaterialSubtotal(it, d), 0));
  const itemLabor = items.reduce((s, it) => s + itemLaborSubtotal(it, d), 0);
  const extraLabor = labor.filter((l) => l.enabled).reduce((s, l) => s + l.quantity * l.price, 0);
  const labour = round2(itemLabor + extraLabor);
  const transport = round2(settings.transport);
  const subtotal = round2(materials + labour + transport);
  const discount = round2((subtotal * settings.discountPct) / 100);
  const taxable = round2(subtotal - discount);
  const vat = round2((taxable * settings.vatPct) / 100);
  const total = round2(taxable + vat);
  return { materials, labor: labour, transport, subtotal, discount, taxable, vat, total };
}

export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

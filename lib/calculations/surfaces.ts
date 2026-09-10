/**
 * Geometry → measurable surfaces. The ONLY bridge between the Semantic 3D Room
 * Model and the existing quantity engine.
 *
 * This module computes areas / lengths from parametric geometry. It does NOT
 * apply waste, price, labor, delivery or tax — those stay in
 * lib/calculations/{materials,labor,taxes,estimate,money} and lib/market/*.
 *
 * See docs/3d-room-reconstruction.md §16.
 */

import type { EntityDimensions, OpeningRect, RoomEntity, Vec2 } from "@/types";
import type { Unit } from "@/types";
import { round } from "./money";

const SQIN_PER_SQFT = 144;
const IN_PER_FT = 12;

type PlanarPoint = { x: number; z: number } | { u: number; v: number };

function coords(p: PlanarPoint): [number, number] {
  return "x" in p ? [p.x, p.z] : [p.u, p.v];
}

/** Shoelace area of a closed simple polygon. Input inches → output sq ft. */
export function polygonAreaSqFt(poly: PlanarPoint[]): number {
  if (poly.length < 3) return 0;
  let twiceArea = 0;
  for (let i = 0; i < poly.length; i++) {
    const [ax, ay] = coords(poly[i]);
    const [bx, by] = coords(poly[(i + 1) % poly.length]);
    twiceArea += ax * by - bx * ay;
  }
  return round(Math.abs(twiceArea) / 2 / SQIN_PER_SQFT);
}

/** Perimeter of a closed polygon. Input inches → output linear ft. */
export function polygonPerimeterLinFt(poly: PlanarPoint[]): number {
  if (poly.length < 2) return 0;
  let total = 0;
  for (let i = 0; i < poly.length; i++) {
    const [ax, ay] = coords(poly[i]);
    const [bx, by] = coords(poly[(i + 1) % poly.length]);
    total += Math.hypot(bx - ax, by - ay);
  }
  return round(total / IN_PER_FT);
}

/** Distance between two floor points, linear ft. */
export function edgeLengthLinFt(a: Vec2, b: Vec2): number {
  return round(Math.hypot(b.x - a.x, b.z - a.z) / IN_PER_FT);
}

/** A wall face's area after cutting its openings. Square feet. */
export function wallNetAreaSqFt(
  lengthIn: number,
  heightIn: number,
  openings: OpeningRect[] = [],
): number {
  const gross = (lengthIn * heightIn) / SQIN_PER_SQFT;
  const cut = openings.reduce(
    (sum, o) => sum + (o.widthIn * o.heightIn) / SQIN_PER_SQFT,
    0,
  );
  return round(Math.max(0, gross - cut));
}

export function openingRectOf(entity: RoomEntity): OpeningRect | null {
  const g = entity.geometry;
  const d = entity.dimensions;
  if (d.widthIn == null || d.heightIn == null) return null;
  const pos = g.position;
  return {
    uIn: pos?.x ?? 0,
    vIn: pos?.y ?? 0,
    widthIn: d.widthIn,
    heightIn: d.heightIn,
  };
}

/**
 * Recompute an entity's cached `dimensions` from its geometry and its child
 * openings. Pure — returns a fresh object, mutates nothing.
 */
export function computeEntityDimensions(
  entity: RoomEntity,
  openings: RoomEntity[] = [],
): EntityDimensions {
  const g = entity.geometry;

  if (entity.type === "wall") {
    const poly = g.polygon ?? [];
    const us = poly.map((p) => p.u);
    const vs = poly.map((p) => p.v);
    const lengthIn = us.length ? Math.max(...us) - Math.min(...us) : (entity.dimensions.lengthIn ?? 0);
    const heightIn = vs.length ? Math.max(...vs) - Math.min(...vs) : (entity.dimensions.heightIn ?? 0);
    const rects = openings
      .filter((o) => entity.openingIds?.includes(o.id))
      .map(openingRectOf)
      .filter((r): r is OpeningRect => r !== null);
    const grossAreaSqFt = round((lengthIn * heightIn) / SQIN_PER_SQFT);
    return {
      lengthIn: round(lengthIn),
      heightIn: round(heightIn),
      grossAreaSqFt,
      netAreaSqFt: wallNetAreaSqFt(lengthIn, heightIn, rects),
      perimeterLinFt: round(lengthIn / IN_PER_FT),
    };
  }

  if (entity.type === "floor" || entity.type === "ceiling") {
    const poly = g.polygon ?? [];
    const area = polygonAreaSqFt(poly);
    return {
      elevationIn: g.position?.y ?? entity.dimensions.elevationIn ?? 0,
      grossAreaSqFt: area,
      netAreaSqFt: area,
      perimeterLinFt: polygonPerimeterLinFt(poly),
    };
  }

  if (entity.type === "window" || entity.type === "door" || entity.type === "opening") {
    const w = entity.dimensions.widthIn ?? 0;
    const h = entity.dimensions.heightIn ?? 0;
    return {
      widthIn: round(w),
      heightIn: round(h),
      grossAreaSqFt: round((w * h) / SQIN_PER_SQFT),
    };
  }

  return { ...entity.dimensions };
}

/**
 * BASE quantity (before waste) for a product placed on this surface, in the
 * product's own unit. Feeds lib/calculations `calculateWaste()` →
 * `calculateMaterialCost()` → the existing estimate engine, unchanged.
 *
 * Mirrors the fallback in lib/calculations/dimensions.ts `baseSurfaceQuantity`.
 */
export function entitySurfaceQuantity(entity: RoomEntity, unit: Unit): number {
  const d = entity.dimensions;
  const areaSqFt = d.netAreaSqFt ?? d.grossAreaSqFt ?? 0;
  const heightFt = (d.heightIn ?? 0) / IN_PER_FT;

  switch (unit) {
    case "sq_ft":
      return areaSqFt;
    case "linear_ft":
      // a wall run vs. a floor/ceiling outline (baseboards, crown molding)
      if (entity.surfaceKind === "wall" && d.lengthIn != null) {
        return round(d.lengthIn / IN_PER_FT);
      }
      return d.perimeterLinFt ?? 0;
    case "gallon":
      return round(areaSqFt / 350); // ~350 sq ft / gal, 1 coat — same as baseSurfaceQuantity
    case "cu_ft":
      return round(areaSqFt * heightFt);
    case "cu_yd":
      return round((areaSqFt * heightFt) / 27);
    case "ea":
    case "hour":
    case "day":
    case "project":
    default:
      return areaSqFt;
  }
}

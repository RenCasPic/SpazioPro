/**
 * Assemblies — expand a named constructive solution (e.g. "LVP Flooring
 * Assembly") into concrete line quantities. Pure geometry-free math: it turns
 * one base quantity into N component quantities at fixed ratios. It does NOT
 * price anything — that stays with pricing-service / labor-rate-service /
 * calculateEstimate, exactly like every other ProjectItem.
 */

import type { Assembly, AssemblyComponent } from "@/types";
import { round } from "./money";

export interface AssemblyLine {
  /** resolved catalog product id — the user's own choice for the primary slot */
  productId: string;
  role: AssemblyComponent["role"];
  /** BASE quantity (before waste), in the component's own unit */
  quantity: number;
}

export interface ExpandAssemblyInput {
  assembly: Assembly;
  /** quantity in the assembly's baseUnit, e.g. 250 (sq ft of the surface) */
  baseQuantity: number;
  /** the product the user picked to fill the "primary" slot */
  primaryProductId: string;
}

/** One line per component, in order. Never mutates the assembly definition. */
export function expandAssembly({
  assembly,
  baseQuantity,
  primaryProductId,
}: ExpandAssemblyInput): AssemblyLine[] {
  if (baseQuantity <= 0) return [];
  return assembly.components.map((component) => ({
    productId: component.role === "primary" ? primaryProductId : (component.productId as string),
    role: component.role,
    quantity: round(baseQuantity * component.coveragePerUnit),
  }));
}

/** True when every non-primary component resolves to a real catalog product. */
export function isAssemblyWellFormed(assembly: Assembly): boolean {
  return assembly.components.every(
    (c) => c.role === "primary" || (typeof c.productId === "string" && c.productId.length > 0),
  );
}

/**
 * Professional foundation — Takeoff, Scope, Assemblies, company pricing/labor
 * overrides, project files. Extends the existing quantity/estimate engine;
 * does not duplicate it. See the "professional-first" architecture note.
 */

import type { LaborCategory } from "./market";
import type { ProductCategory, Unit } from "./product";

// ---------------------------------------------------------------------------
// Where a quantity came from — the traceability the professional needs.
// Reuses the vocabulary already established for the Semantic 3D Room Model
// (see RoomEntity in room-model.ts) rather than inventing a parallel one.
// ---------------------------------------------------------------------------

export type MeasurementSourceKind =
  | "manual"
  | "room_model"
  | "ai_photo"
  | "ifc"
  | "cad"
  | "pdf_plan"
  | "document";

export type TakeoffVerificationStatus = "unverified" | "needs_verification" | "verified";

/**
 * A measured quantity of work/material — the TAKEOFF layer. This is "how much
 * exists", never a price. It may stand alone (manual entry) or wrap a Semantic
 * 3D Room Model entity (sourceRef = RoomEntity.id) so the same number is never
 * computed twice.
 */
export interface TakeoffMeasurement {
  id: string;
  projectId: string;
  roomId: string | null;
  /** the trade this quantity belongs to, for Scope grouping */
  category: LaborCategory;
  label: string;
  unit: Unit;
  quantity: number;
  source: MeasurementSourceKind;
  /** e.g. a RoomEntity id when source === "room_model" */
  sourceRef: string | null;
  /** 0..1 */
  confidence: number;
  verificationStatus: TakeoffVerificationStatus;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Scope of Work — a trade section that can carry its own markup/contingency
// on top of the items that belong to it. Items are NOT re-parented into a
// scope by a foreign key; a scope groups existing ProjectItems by the trade
// (LaborCategory) of their product — no second place items "live".
// ---------------------------------------------------------------------------

export interface ScopeSection {
  id: string;
  projectId: string;
  scenarioId: string;
  category: LaborCategory;
  name: string;
  markupPercent: number;
  contingencyPercent: number;
  notes: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Assemblies — a named constructive solution: one product the user picks
// (the "primary") plus fixed-ratio accessory products, expanded in one step
// into ordinary ProjectItems via the existing item/quantity engine.
// ---------------------------------------------------------------------------

export interface AssemblyComponent {
  /** null when this slot is filled by the user's own material choice */
  productId: string | null;
  role: "primary" | "accessory";
  /** quantity of this component, in ITS OWN unit, per 1 unit of the assembly's base quantity */
  coveragePerUnit: number;
}

export interface Assembly {
  id: string;
  name: string;
  description: string;
  /** the trade this assembly belongs to, for Scope grouping */
  category: LaborCategory;
  /** unit the assembly is specified in — e.g. sq_ft for a flooring assembly */
  baseUnit: Unit;
  /** which catalog categories may fill the "primary" slot */
  primaryCategories: ProductCategory[];
  components: AssemblyComponent[];
}

// ---------------------------------------------------------------------------
// Company pricing / labor overrides — resolved BEFORE the state/national
// defaults in lib/market. lib/market stays pure; the override list is
// injected by the service layer.
// ---------------------------------------------------------------------------

export interface CompanyProductPrice {
  id: string;
  companyId: string;
  productId: string;
  /** null = applies in every state */
  stateCode: string | null;
  price: number;
  updatedAt: string;
}

export interface CompanyLaborRate {
  id: string;
  companyId: string;
  category: LaborCategory;
  stateCode: string | null;
  cost: number;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Project files — documents that give the project context (specs, scope of
// work, schedules, bid docs). Phase 1: stored, listed, downloadable. Phase 2:
// used as source material for takeoff.
// ---------------------------------------------------------------------------

export type ProjectFileKind = "pdf" | "docx" | "xlsx" | "csv" | "image" | "other";

export interface ProjectFile {
  id: string;
  projectId: string;
  name: string;
  kind: ProjectFileKind;
  url: string;
  sizeBytes: number;
  notes: string;
  createdAt: string;
}

import type { CurrencyCode, DeliveryRate, FxRate, LaborRate, TaxJurisdiction, TaxRate } from "./market";
import type { PriceSource, ProductCategory, Unit } from "./product";

export type ScenarioType = "economy" | "standard" | "premium" | "custom";

export const SCENARIO_KEYS: Record<ScenarioType, string> = {
  economy: "economy",
  standard: "standard",
  premium: "premium",
  custom: "custom",
};

export interface DesignScenario {
  id: string;
  projectId: string;
  name: string;
  description: string;
  type: ScenarioType;
  totalEstimate: number;
  currencyCode: CurrencyCode;
  previewImageUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Editor transform stored as fractions of the image box (resolution-independent). */
export interface EditorTransform {
  x: number;
  y: number;
  rotation: number;
  scale: number;
}

export interface ProjectItem {
  id: string;
  projectId: string;
  roomId: string | null;
  scenarioId: string;
  productId: string;
  name: string;
  category: ProductCategory;
  kind: "surface" | "object";
  surface?: "floor" | "wall" | "ceiling";
  /** links a surface item to a Semantic 3D Room Model entity — quantity then
   *  comes from that entity's net area instead of the room AABB */
  roomEntityId?: string | null;
  quantity: number;
  quantityAuto: boolean;
  unit: Unit;
  unitPrice: number;
  laborCost: number;
  currencyCode: CurrencyCode;
  wastePercent: number;
  priceSource: PriceSource;
  supplier: string | null;
  demoPrice: boolean;
  transform: EditorTransform;
  layer: number;
  createdAt: string;
  updatedAt: string;
}

export interface LaborLine {
  id: string;
  label: string;
  category: string;
  unit: Unit;
  quantity: number;
  unitCost: number;
  currencyCode: CurrencyCode;
  enabled: boolean;
  fromMarket: boolean;
}

/** Flat additional cost buckets in the estimate. */
export interface EstimateExtras {
  equipment: number;
  delivery: number;
  disposal: number;
  permits: number;
  other: number;
}

export interface EstimateSettings {
  /** sales-tax percentage resolved from the project location */
  salesTaxRate: number;
  discountPercent: number;
  extras: EstimateExtras;
  scopeOfWork: string;
  notes: string;
}

/** Frozen state of the market when an estimate was generated. */
export interface MarketSnapshot {
  countryCode: string;
  currencyCode: CurrencyCode;
  stateCode: string;
  city: string;
  zipCode: string;
  salesTaxRate: number;
  taxJurisdiction: TaxJurisdiction | null;
  taxRates: TaxRate[];
  laborRates: LaborRate[];
  deliveryRate: DeliveryRate;
  fxRates: FxRate[];
  productPrices: Array<{
    productId: string;
    price: number;
    currencyCode: CurrencyCode;
    supplier: string | null;
    source: PriceSource;
    capturedAt: string;
  }>;
  capturedAt: string;
}

export interface EstimateLineSnapshot {
  price: number;
  currency: CurrencyCode;
  supplier: string | null;
  source: PriceSource;
  capturedAt: string;
}

export interface EstimateItem {
  id: string;
  estimateId: string;
  projectItemId: string | null;
  description: string;
  category: string;
  quantity: number;
  unit: Unit;
  unitPrice: number;
  laborPrice: number;
  total: number;
  priceSnapshot: EstimateLineSnapshot;
}

export type EstimateStatus = "draft" | "final" | "approved" | "archived";
export type EstimateKind = "estimate" | "proposal";

export interface Estimate {
  id: string;
  projectId: string;
  scenarioId: string;
  kind: EstimateKind;
  estimateNumber: string;
  language: import("@/lib/i18n/config").Locale;
  countryCode: string;
  stateCode: string;
  city: string;
  zipCode: string;
  currencyCode: CurrencyCode;
  salesTaxRate: number;
  scopeOfWork: string;
  subtotalMaterials: number;
  subtotalLabor: number;
  subtotalEquipment: number;
  subtotalDelivery: number;
  subtotalDisposal: number;
  subtotalPermits: number;
  subtotalOther: number;
  discount: number;
  taxAmount: number;
  total: number;
  notes: string;
  status: EstimateStatus;
  marketSnapshot: MarketSnapshot;
  /** the Semantic 3D Room Model version this estimate was computed against —
   *  a later recalibration makes a new version and never changes this estimate */
  roomModelId: string | null;
  roomModelVersion: number | null;
  items: EstimateItem[];
  createdAt: string;
  updatedAt: string;
}

export type ConfidenceLevel = "high" | "medium" | "low";

export interface ConfidenceReport {
  level: ConfidenceLevel;
  /** i18n keys under estimates.confidence_reasons */
  reasons: string[];
}

export interface EstimateTotals {
  materials: number;
  labor: number;
  equipment: number;
  delivery: number;
  disposal: number;
  permits: number;
  other: number;
  subtotal: number;
  discount: number;
  taxable: number;
  tax: number;
  total: number;
  currency: CurrencyCode;
}

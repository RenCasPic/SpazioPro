import type { CurrencyCode, FxRate, LaborRate, TaxRate, TransportRate } from "./market";
import type { PriceSource, ProductCategory, Unit } from "./product";

export type ScenarioType = "economy" | "standard" | "premium" | "custom";

export const SCENARIO_LABELS: Record<ScenarioType, string> = {
  economy: "Económico",
  standard: "Estándar",
  premium: "Premium",
  custom: "Personalizado",
};

export interface DesignScenario {
  id: string;
  projectId: string;
  name: string;
  description: string;
  type: ScenarioType;
  /** cached headline total for lists; source of truth is a live calculation */
  totalEstimate: number;
  currencyCode: CurrencyCode;
  previewImageUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Editor transform stored as fractions of the image box (resolution-independent). */
export interface EditorTransform {
  x: number; // 0..1
  y: number; // 0..1
  rotation: number; // degrees
  scale: number; // multiplier
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
  /** z-order in the editor */
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
  /** true when the rate came from the market table rather than manual entry */
  fromMarket: boolean;
}

export interface TransportConfig {
  enabled: boolean;
  distanceKm: number;
  volumeM3: number;
  manualOverride: number | null;
}

export interface EstimateSettings {
  vatRate: number;
  discountPercent: number;
  transport: TransportConfig;
  notes: string;
}

/** Frozen state of the market at the moment an estimate was generated. */
export interface MarketSnapshot {
  countryCode: string;
  currencyCode: CurrencyCode;
  taxRate: number;
  taxRates: TaxRate[];
  laborRates: LaborRate[];
  transportRate: TransportRate;
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

export interface Estimate {
  id: string;
  projectId: string;
  scenarioId: string;
  estimateNumber: string;
  countryCode: string;
  currencyCode: CurrencyCode;
  taxRate: number;
  subtotalMaterials: number;
  subtotalLabor: number;
  subtotalTransport: number;
  subtotalOther: number;
  discount: number;
  taxAmount: number;
  total: number;
  notes: string;
  status: EstimateStatus;
  marketSnapshot: MarketSnapshot;
  items: EstimateItem[];
  createdAt: string;
  updatedAt: string;
}

export type ConfidenceLevel = "high" | "medium" | "low";

export interface ConfidenceReport {
  level: ConfidenceLevel;
  warnings: string[];
}

export interface EstimateTotals {
  materials: number;
  labor: number;
  transport: number;
  other: number;
  subtotal: number;
  discount: number;
  taxable: number;
  tax: number;
  total: number;
  currency: CurrencyCode;
}

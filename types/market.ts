// Market model. US-first: the initial (and only seeded) country is the United
// States, priced in USD with imperial units and sales tax resolved from the
// project's tax jurisdiction (state / county / city / ZIP). The shape stays
// generic so other countries can be added later without touching core logic.

export type CurrencyCode = "USD" | "CAD" | "MXN" | "EUR" | "GBP";

export type MeasurementSystem = "imperial" | "metric";

export interface Country {
  code: string; // ISO-3166 alpha-2
  name: string;
  currencyCode: CurrencyCode;
  currencySymbol: string;
  locale: string;
  measurementSystem: MeasurementSystem;
  active: boolean;
}

export interface State {
  countryCode: string;
  code: string; // 2-letter USPS code
  name: string;
  active: boolean;
}

/** A monetary value ALWAYS carries its currency. Never a bare number. */
export interface Money {
  amount: number;
  currency: CurrencyCode;
}

/** US remodeling / construction labour categories. */
export type LaborCategory =
  | "general_labor"
  | "painting"
  | "drywall"
  | "flooring_installation"
  | "tile_installation"
  | "carpentry"
  | "electrical"
  | "plumbing"
  | "hvac"
  | "demolition"
  | "framing"
  | "cabinet_installation"
  | "countertop_installation"
  | "finish_carpentry"
  | "cleaning"
  | "delivery"
  | "assembly";

export type LaborUnit = "hour" | "day" | "sq_ft" | "linear_ft" | "unit" | "project";

export interface LaborRate {
  countryCode: string;
  stateCode: string | null; // null = national default
  category: LaborCategory;
  unit: LaborUnit;
  cost: number;
  currencyCode: CurrencyCode;
}

export interface TaxJurisdiction {
  id: string;
  countryCode: string;
  stateCode: string;
  county: string | null;
  city: string | null;
  zipCode: string | null;
  name: string;
  active: boolean;
}

export interface TaxRate {
  jurisdictionId: string;
  /** combined rate as a percentage, e.g. 9.5 */
  rate: number;
  effectiveFrom: string;
  effectiveUntil: string | null;
  source: string;
  active: boolean;
}

export interface TaxRateResult {
  rate: number;
  jurisdiction: TaxJurisdiction;
  /** how specific the match was */
  matchedOn: "zip" | "city" | "county" | "state" | "none";
  source: string;
}

export interface DeliveryRate {
  countryCode: string;
  stateCode: string | null;
  baseFee: number;
  perMile: number;
  perCuYd: number;
  currencyCode: CurrencyCode;
}

/** Reference FX only (base USD). Not used in the US flow. */
export interface FxRate {
  currency: CurrencyCode;
  perUsd: number;
  capturedAt: string;
}

export interface Market {
  country: Country;
  states: State[];
  laborRates: LaborRate[];
  delivery: DeliveryRate;
  fx: FxRate[];
}

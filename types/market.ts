// Multi-country market model. Nothing in the app hard-codes a single market:
// every currency, tax, labour and transport figure is resolved from data.

export type CurrencyCode =
  | "EUR"
  | "PYG"
  | "ARS"
  | "CLP"
  | "UYU"
  | "MXN"
  | "COP"
  | "PEN"
  | "USD"
  | "BRL"
  | "GBP";

export type MeasurementSystem = "metric" | "imperial";

export interface Country {
  code: string; // ISO-3166 alpha-2
  name: string;
  currencyCode: CurrencyCode;
  currencySymbol: string;
  locale: string; // BCP-47
  measurementSystem: MeasurementSystem;
  defaultTaxRate: number; // percent
  flag: string; // emoji flag (allowed for countries per the icon rules)
  active: boolean;
}

/** A monetary value ALWAYS carries its currency. Never a bare number. */
export interface Money {
  amount: number;
  currency: CurrencyCode;
}

export type LaborCategory =
  | "painting"
  | "flooring"
  | "tiling"
  | "carpentry"
  | "electrical"
  | "plumbing"
  | "masonry"
  | "assembly"
  | "demolition"
  | "general";

export interface LaborRate {
  countryCode: string;
  category: LaborCategory;
  unit: string; // m2 | ml | ud | h | day
  cost: number; // in the country currency
  currencyCode: CurrencyCode;
}

export interface TaxRate {
  countryCode: string;
  name: string; // IVA, VAT, IGIC, IVA general…
  rate: number; // percent
  category: string; // 'standard' | 'reduced' | 'construction'
  active: boolean;
}

export interface TransportRate {
  countryCode: string;
  /** base call-out fee in country currency */
  baseFee: number;
  /** per-km fee */
  perKm: number;
  /** per m3 of volume */
  perM3: number;
  currencyCode: CurrencyCode;
}

/** Reference FX only — never overrides a real local price. base = EUR. */
export interface FxRate {
  currency: CurrencyCode;
  perEur: number; // 1 EUR = perEur <currency>
  capturedAt: string;
}

export interface Market {
  country: Country;
  taxRates: TaxRate[];
  laborRates: LaborRate[];
  transport: TransportRate;
  fx: FxRate[];
}

import type { Country } from "@/types";

/**
 * Initial market list. Adding a country here (plus its rows in tax-rates,
 * labor-rates, transport-rates and fx-rates) is enough — no core logic changes.
 */
export const COUNTRIES: Country[] = [
  { code: "ES", name: "España", currencyCode: "EUR", currencySymbol: "€", locale: "es-ES", measurementSystem: "metric", defaultTaxRate: 21, flag: "🇪🇸", active: true },
  { code: "PY", name: "Paraguay", currencyCode: "PYG", currencySymbol: "₲", locale: "es-PY", measurementSystem: "metric", defaultTaxRate: 10, flag: "🇵🇾", active: true },
  { code: "AR", name: "Argentina", currencyCode: "ARS", currencySymbol: "$", locale: "es-AR", measurementSystem: "metric", defaultTaxRate: 21, flag: "🇦🇷", active: true },
  { code: "CL", name: "Chile", currencyCode: "CLP", currencySymbol: "$", locale: "es-CL", measurementSystem: "metric", defaultTaxRate: 19, flag: "🇨🇱", active: true },
  { code: "UY", name: "Uruguay", currencyCode: "UYU", currencySymbol: "$", locale: "es-UY", measurementSystem: "metric", defaultTaxRate: 22, flag: "🇺🇾", active: true },
  { code: "MX", name: "México", currencyCode: "MXN", currencySymbol: "$", locale: "es-MX", measurementSystem: "metric", defaultTaxRate: 16, flag: "🇲🇽", active: true },
  { code: "CO", name: "Colombia", currencyCode: "COP", currencySymbol: "$", locale: "es-CO", measurementSystem: "metric", defaultTaxRate: 19, flag: "🇨🇴", active: true },
  { code: "PE", name: "Perú", currencyCode: "PEN", currencySymbol: "S/", locale: "es-PE", measurementSystem: "metric", defaultTaxRate: 18, flag: "🇵🇪", active: true },
  { code: "US", name: "Estados Unidos", currencyCode: "USD", currencySymbol: "$", locale: "en-US", measurementSystem: "imperial", defaultTaxRate: 8, flag: "🇺🇸", active: true },
  { code: "BR", name: "Brasil", currencyCode: "BRL", currencySymbol: "R$", locale: "pt-BR", measurementSystem: "metric", defaultTaxRate: 17, flag: "🇧🇷", active: true },
  { code: "PT", name: "Portugal", currencyCode: "EUR", currencySymbol: "€", locale: "pt-PT", measurementSystem: "metric", defaultTaxRate: 23, flag: "🇵🇹", active: true },
  { code: "FR", name: "Francia", currencyCode: "EUR", currencySymbol: "€", locale: "fr-FR", measurementSystem: "metric", defaultTaxRate: 20, flag: "🇫🇷", active: true },
  { code: "IT", name: "Italia", currencyCode: "EUR", currencySymbol: "€", locale: "it-IT", measurementSystem: "metric", defaultTaxRate: 22, flag: "🇮🇹", active: true },
  { code: "DE", name: "Alemania", currencyCode: "EUR", currencySymbol: "€", locale: "de-DE", measurementSystem: "metric", defaultTaxRate: 19, flag: "🇩🇪", active: true },
  { code: "GB", name: "Reino Unido", currencyCode: "GBP", currencySymbol: "£", locale: "en-GB", measurementSystem: "imperial", defaultTaxRate: 20, flag: "🇬🇧", active: true },
];

export const countryByCode = (code: string): Country | undefined =>
  COUNTRIES.find((c) => c.code === code.toUpperCase());

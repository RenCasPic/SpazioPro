import type { CurrencyCode, MeasurementSystem } from "./market";
import type { Locale } from "@/lib/i18n/config";

export type ProfessionalType =
  | "general_contractor"
  | "remodeler"
  | "interior_designer"
  | "architect"
  | "builder"
  | "other";

export const PROFESSIONAL_TYPES: ProfessionalType[] = [
  "general_contractor",
  "remodeler",
  "interior_designer",
  "architect",
  "builder",
  "other",
];

export interface Profile {
  id: string;
  fullName: string;
  companyName: string;
  phone: string;
  email: string;
  avatarUrl: string | null;
  logoUrl: string | null;
  /** market context */
  countryCode: string;
  defaultStateCode: string;
  defaultZip: string;
  city: string;
  address: string;
  currencyCode: CurrencyCode;
  measurementSystem: MeasurementSystem;
  /** app UI language */
  appLanguage: Locale;
  /** default language for generated estimates */
  estimateLanguage: Locale;
  licenseNumber: string;
  website: string;
  terms: string;
  professionalType: ProfessionalType;
  onboardingComplete: boolean;
  createdAt: string;
  updatedAt: string;
}

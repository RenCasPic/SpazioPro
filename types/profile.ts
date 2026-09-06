import type { CurrencyCode } from "./market";

export type ProfessionalType =
  | "architect"
  | "interior_designer"
  | "builder"
  | "renovation_company"
  | "studio"
  | "other";

export const PROFESSIONAL_TYPE_LABELS: Record<ProfessionalType, string> = {
  architect: "Arquitecto/a",
  interior_designer: "Diseñador/a de interiores",
  builder: "Constructor/a",
  renovation_company: "Empresa de reformas",
  studio: "Estudio",
  other: "Otro",
};

export interface Profile {
  id: string;
  fullName: string;
  companyName: string;
  phone: string;
  email: string;
  avatarUrl: string | null;
  logoUrl: string | null;
  countryCode: string;
  currencyCode: CurrencyCode;
  locale: string;
  city: string;
  address: string;
  taxId: string;
  website: string;
  terms: string;
  defaultTaxRate: number;
  professionalType: ProfessionalType;
  onboardingComplete: boolean;
  createdAt: string;
  updatedAt: string;
}

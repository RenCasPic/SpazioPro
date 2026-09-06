import { z } from "zod";

export const onboardingSchema = z.object({
  fullName: z.string().min(2, "Escribe tu nombre"),
  companyName: z.string().max(160).optional(),
  phone: z.string().max(40).optional(),
  countryCode: z.string().length(2, "Selecciona un país"),
  city: z.string().max(120).optional(),
  professionalType: z.enum([
    "architect",
    "interior_designer",
    "builder",
    "renovation_company",
    "studio",
    "other",
  ]),
});

export const profileSchema = onboardingSchema.partial().extend({
  address: z.string().max(200).optional(),
  taxId: z.string().max(40).optional(),
  website: z.string().max(200).optional(),
  terms: z.string().max(4000).optional(),
  defaultTaxRate: z.number().min(0).max(80).optional(),
  logoUrl: z.string().nullable().optional(),
});

export const credentialsSchema = z.object({
  email: z.string().email("Email no válido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
});

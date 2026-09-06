import { z } from "zod";

const localeSchema = z.enum(["en-US", "es-US"]);

export const onboardingSchema = z.object({
  fullName: z.string().min(2, "Enter your name"),
  companyName: z.string().max(160).optional(),
  phone: z.string().max(40).optional(),
  professionalType: z.enum([
    "general_contractor",
    "remodeler",
    "interior_designer",
    "architect",
    "builder",
    "other",
  ]),
  defaultStateCode: z.string().length(2, "Select a state"),
  city: z.string().max(120).optional(),
  defaultZip: z.string().regex(/^\d{5}$/, "Enter a valid ZIP").or(z.literal("")).optional(),
  appLanguage: localeSchema,
});

export const profileSchema = onboardingSchema.partial().extend({
  email: z.string().email().optional(),
  address: z.string().max(200).optional(),
  licenseNumber: z.string().max(60).optional(),
  website: z.string().max(200).optional(),
  terms: z.string().max(4000).optional(),
  measurementSystem: z.enum(["imperial", "metric"]).optional(),
  estimateLanguage: localeSchema.optional(),
});

export const credentialsSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "At least 6 characters"),
});

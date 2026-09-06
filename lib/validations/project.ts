import { z } from "zod";

export const projectTypeSchema = z.enum([
  "living_room",
  "bedroom",
  "kitchen",
  "bathroom",
  "office",
  "commercial",
  "terrace",
  "exterior",
  "whole_home",
  "other",
]);

const localeSchema = z.enum(["en-US", "es-US"]);

export const newProjectSchema = z.object({
  name: z.string().min(2, "Enter a name").max(120),
  clientId: z.string().nullable(),
  projectType: projectTypeSchema,
  description: z.string().max(2000).optional(),
  address: z.string().max(200).optional(),
  city: z.string().min(1, "Enter a city").max(120),
  stateCode: z.string().length(2, "Select a state"),
  zipCode: z.string().regex(/^\d{5}(-\d{4})?$/, "Enter a valid ZIP"),
  estimateLanguage: localeSchema,
});

export const updateProjectSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  description: z.string().max(2000).optional(),
  clientId: z.string().nullable().optional(),
  status: z.enum(["draft", "designing", "estimating", "quoted", "approved", "completed"]).optional(),
  activeScenarioId: z.string().optional(),
  estimateLanguage: localeSchema.optional(),
});

export const changeLocationSchema = z.object({
  address: z.string().max(200).optional(),
  city: z.string().min(1).max(120),
  stateCode: z.string().length(2),
  zipCode: z.string().regex(/^\d{5}(-\d{4})?$/),
});

export const dimensionsSchema = z.object({
  widthIn: z.number().positive().max(3000),
  lengthIn: z.number().positive().max(3000),
  heightIn: z.number().positive().max(360),
});

export type NewProjectInput = z.infer<typeof newProjectSchema>;
export type ChangeLocationInput = z.infer<typeof changeLocationSchema>;

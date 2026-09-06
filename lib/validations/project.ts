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

export const newProjectSchema = z.object({
  name: z.string().min(2, "Escribe un nombre").max(120),
  clientId: z.string().nullable(),
  countryCode: z.string().length(2, "Selecciona un país"),
  projectType: projectTypeSchema,
  description: z.string().max(2000).optional(),
});

export const updateProjectSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  description: z.string().max(2000).optional(),
  clientId: z.string().nullable().optional(),
  status: z
    .enum(["draft", "designing", "estimating", "quoted", "approved", "completed"])
    .optional(),
  activeScenarioId: z.string().optional(),
});

export const dimensionsSchema = z.object({
  width: z.number().positive().max(200),
  length: z.number().positive().max(200),
  height: z.number().positive().max(20),
});

export type NewProjectInput = z.infer<typeof newProjectSchema>;

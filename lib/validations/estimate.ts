import { z } from "zod";

export const estimateSettingsSchema = z.object({
  salesTaxRate: z.number().min(0).max(20),
  discountPercent: z.number().min(0).max(100),
  extras: z.object({
    equipment: z.number().min(0),
    delivery: z.number().min(0),
    disposal: z.number().min(0),
    permits: z.number().min(0),
    other: z.number().min(0),
  }),
  scopeOfWork: z.string().max(6000),
  notes: z.string().max(4000),
});

export const generateEstimateSchema = z.object({
  projectId: z.string().min(1),
  scenarioId: z.string().min(1).optional(),
  kind: z.enum(["estimate", "proposal"]).optional(),
  language: z.enum(["en-US", "es-US"]).optional(),
});

export const pdfEstimateSchema = z.object({
  estimateId: z.string().min(1),
});

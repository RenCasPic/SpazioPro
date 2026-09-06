import { z } from "zod";

export const estimateSettingsSchema = z.object({
  vatRate: z.number().min(0).max(80),
  discountPercent: z.number().min(0).max(100),
  transport: z.object({
    enabled: z.boolean(),
    distanceKm: z.number().min(0).max(2000),
    volumeM3: z.number().min(0).max(500),
    manualOverride: z.number().min(0).nullable(),
  }),
  notes: z.string().max(4000),
});

export const generateEstimateSchema = z.object({
  projectId: z.string().min(1),
  scenarioId: z.string().min(1).optional(),
});

export const pdfEstimateSchema = z.object({
  estimateId: z.string().min(1),
});

import { z } from "zod";

export const stateCodeSchema = z
  .string()
  .length(2)
  .transform((s) => s.toUpperCase());

export const taxQuerySchema = z.object({
  state: z.string().optional(),
  county: z.string().optional(),
  city: z.string().optional(),
  zip: z.string().optional(),
});

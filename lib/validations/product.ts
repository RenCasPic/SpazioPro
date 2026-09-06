import { z } from "zod";

export const catalogQuerySchema = z.object({
  state: z.string().optional(),
  group: z.string().optional(),
  category: z.string().optional(),
  q: z.string().optional(),
  brand: z.string().optional(),
  style: z.string().optional(),
  maxPrice: z.coerce.number().optional(),
  availableOnly: z.coerce.boolean().optional(),
});

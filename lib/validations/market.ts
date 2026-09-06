import { z } from "zod";

export const countryCodeSchema = z
  .string()
  .length(2)
  .transform((s) => s.toUpperCase());

export const currencyConvertSchema = z.object({
  amount: z.number(),
  from: z.string().min(3).max(3),
  to: z.string().min(3).max(3),
});

export const changeCountrySchema = z.object({
  countryCode: countryCodeSchema,
});

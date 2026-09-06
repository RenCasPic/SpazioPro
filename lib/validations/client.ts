import { z } from "zod";

export const clientSchema = z.object({
  name: z.string().min(2, "Enter a name").max(160),
  email: z.union([z.string().email("Invalid email"), z.literal("")]),
  phone: z.string().max(40),
  company: z.string().max(160),
  address: z.string().max(200),
  city: z.string().max(120),
  postalCode: z.string().max(20),
  notes: z.string().max(2000),
});

export type ClientInput = z.infer<typeof clientSchema>;

export const CLIENT_DEFAULTS: ClientInput = {
  name: "",
  email: "",
  phone: "",
  company: "",
  address: "",
  city: "",
  postalCode: "",
  notes: "",
};

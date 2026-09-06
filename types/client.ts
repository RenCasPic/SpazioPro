export interface Client {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  address: string;
  city: string;
  postalCode: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export type NewClient = Omit<Client, "id" | "userId" | "createdAt" | "updatedAt">;

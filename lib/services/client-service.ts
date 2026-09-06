import type { Client, NewClient } from "@/types";
import { mutateDb, readDb } from "@/lib/db/local-store";
import { uid } from "@/lib/utils";
import { getCurrentUserId } from "@/lib/auth/auth";

export const clientService = {
  async list(query = ""): Promise<Client[]> {
    const userId = await getCurrentUserId();
    const q = query.trim().toLowerCase();
    return readDb()
      .clients.filter((c) => c.userId === userId)
      .filter((c) =>
        q ? `${c.name} ${c.email} ${c.company} ${c.city}`.toLowerCase().includes(q) : true,
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  },

  async get(id: string): Promise<Client | null> {
    const userId = await getCurrentUserId();
    return readDb().clients.find((c) => c.id === id && c.userId === userId) ?? null;
  },

  async create(input: NewClient): Promise<Client> {
    const userId = await getCurrentUserId();
    const now = new Date().toISOString();
    const client: Client = { ...input, id: uid("cli"), userId, createdAt: now, updatedAt: now };
    mutateDb((db) => db.clients.push(client));
    return client;
  },

  async update(id: string, patch: Partial<NewClient>): Promise<Client> {
    const userId = await getCurrentUserId();
    return mutateDb((db) => {
      const client = db.clients.find((c) => c.id === id && c.userId === userId);
      if (!client) throw new Error("Cliente no encontrado");
      Object.assign(client, patch, { updatedAt: new Date().toISOString() });
      return client;
    });
  },

  async remove(id: string): Promise<void> {
    const userId = await getCurrentUserId();
    mutateDb((db) => {
      db.clients = db.clients.filter((c) => !(c.id === id && c.userId === userId));
    });
  },
};

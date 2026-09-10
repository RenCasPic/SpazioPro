import { DB_VERSION, type Database } from "./schema";
import { buildDemoDatabase } from "./demo-seed";

const KEY = `spaziopro.db.v${DB_VERSION}`;

let memory: Database | null = null;

function seed(): Database {
  return buildDemoDatabase();
}

/** Read the whole database. Seeds demo data on first use. */
export function readDb(): Database {
  if (typeof window === "undefined") {
    memory ??= seed();
    return memory;
  }
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Database;
      if (parsed && parsed.version === DB_VERSION) return parsed;
    }
  } catch {
    /* fall through to seed */
  }
  const fresh = seed();
  writeDb(fresh);
  return fresh;
}

export function writeDb(db: Database): void {
  if (typeof window === "undefined") {
    memory = db;
    return;
  }
  try {
    window.localStorage.setItem(KEY, JSON.stringify(db));
  } catch {
    memory = db;
  }
}

/** Apply a mutation to the database and persist it. */
export function mutateDb<T>(fn: (db: Database) => T): T {
  const db = readDb();
  const result = fn(db);
  writeDb(db);
  return result;
}

export function resetDb(): void {
  if (typeof window !== "undefined") {
    try {
      window.localStorage.removeItem(KEY);
    } catch {
      /* ignore */
    }
  }
  memory = null;
}

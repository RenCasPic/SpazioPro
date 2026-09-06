"use client";

import { DEMO_EMAIL, DEMO_USER_ID } from "@/lib/db/demo-seed";
import { mutateDb, readDb } from "@/lib/db/local-store";
import { createProfile } from "@/lib/db/factories";
import { uid } from "@/lib/utils";

const KEY = "spaziopro.auth.v1";

interface DemoCredential {
  userId: string;
  email: string;
  password: string; // demo only — plain, local, never leaves the browser
}
interface AuthState {
  session: { userId: string; email: string } | null;
  credentials: DemoCredential[];
}

function read(): AuthState {
  if (typeof window === "undefined") {
    return { session: { userId: DEMO_USER_ID, email: DEMO_EMAIL }, credentials: [] };
  }
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as AuthState;
  } catch {
    /* ignore */
  }
  // Default: the seeded demo professional is already signed in.
  const initial: AuthState = {
    session: { userId: DEMO_USER_ID, email: DEMO_EMAIL },
    credentials: [{ userId: DEMO_USER_ID, email: DEMO_EMAIL, password: "demo" }],
  };
  write(initial);
  return initial;
}

function write(state: AuthState) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

export const demoAuth = {
  currentUserId(): string {
    return read().session?.userId ?? DEMO_USER_ID;
  },
  currentSession() {
    return read().session;
  },
  async signIn(email: string, password: string) {
    const state = read();
    const cred = state.credentials.find(
      (c) => c.email.toLowerCase() === email.trim().toLowerCase(),
    );
    if (!cred || cred.password !== password) {
      throw new Error("Email o contraseña incorrectos.");
    }
    state.session = { userId: cred.userId, email: cred.email };
    write(state);
    return state.session;
  },
  async signUp(email: string, password: string) {
    const state = read();
    const normalized = email.trim().toLowerCase();
    if (state.credentials.some((c) => c.email.toLowerCase() === normalized)) {
      throw new Error("Ya existe una cuenta con ese email.");
    }
    const userId = uid("user");
    state.credentials.push({ userId, email: normalized, password });
    state.session = { userId, email: normalized };
    write(state);
    // give the new account a blank profile pending onboarding
    if (!readDb().profile || readDb().profile?.id !== userId) {
      mutateDb((db) => {
        db.profile = createProfile(userId, normalized);
      });
    }
    return state.session;
  },
  async signOut() {
    const state = read();
    state.session = null;
    write(state);
  },
  async sendPasswordReset(email: string) {
    // Demo: no email is sent; surface a clear message instead.
    const exists = read().credentials.some(
      (c) => c.email.toLowerCase() === email.trim().toLowerCase(),
    );
    return {
      ok: exists,
      message: exists
        ? "En modo demo no se envían correos. Usa la contraseña «demo» para la cuenta de ejemplo."
        : "No hay ninguna cuenta con ese email.",
    };
  },
};

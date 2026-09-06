import { isDemoMode } from "@/lib/constants";
import { DEMO_USER_ID } from "@/lib/db/demo-seed";

export interface AuthSession {
  userId: string;
  email: string;
}

/**
 * Current user id for the client-side data layer.
 *
 * Demo mode: reads the local session (defaults to the seeded professional).
 * Supabase mode: the client never derives identity for authorization — server
 * routes use `getServerUser()` from `./server-auth` and RLS enforces ownership.
 */
export async function getCurrentUserId(): Promise<string> {
  if (typeof window === "undefined") return DEMO_USER_ID;
  if (isDemoMode()) {
    const { demoAuth } = await import("./demo-auth");
    return demoAuth.currentUserId();
  }
  const { createSupabaseBrowserClient } = await import("@/lib/supabase/client");
  const supabase = createSupabaseBrowserClient();
  const { data } = (await supabase?.auth.getUser()) ?? { data: { user: null } };
  if (!data?.user) throw new Error("No autenticado");
  return data.user.id;
}

export async function getSession(): Promise<AuthSession | null> {
  if (typeof window === "undefined") return null;
  if (isDemoMode()) {
    const { demoAuth } = await import("./demo-auth");
    return demoAuth.currentSession();
  }
  const { createSupabaseBrowserClient } = await import("@/lib/supabase/client");
  const supabase = createSupabaseBrowserClient();
  const { data } = (await supabase?.auth.getUser()) ?? { data: { user: null } };
  return data?.user ? { userId: data.user.id, email: data.user.email ?? "" } : null;
}

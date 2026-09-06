import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface ServerUser {
  id: string;
  email: string | null;
}

/** Authenticated user from the Supabase session cookie (real mode only). */
export async function getServerUser(): Promise<ServerUser | null> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user ? { id: user.id, email: user.email ?? null } : null;
}

import { ok, unauthorized, notFound, demoNotice } from "@/lib/api/http";
import { isDemoMode } from "@/lib/constants";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (isDemoMode()) return demoNotice("In demo mode estimates are stored in the browser.");
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = (await supabase!.auth.getUser()) ?? { data: { user: null } };
  if (!user) return unauthorized();
  const { data } = await supabase!
    .from("estimates")
    .select("*, estimate_items(*), projects!inner(user_id)")
    .eq("id", id)
    .eq("projects.user_id", user.id)
    .single();
  return data ? ok(data) : notFound("Estimate not found");
}

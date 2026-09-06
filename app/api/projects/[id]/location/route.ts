import { ok, unauthorized, notFound, demoNotice } from "@/lib/api/http";
import { isDemoMode } from "@/lib/constants";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (isDemoMode()) return demoNotice("In demo mode project data is stored in the browser.");
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = (await supabase!.auth.getUser()) ?? { data: { user: null } };
  if (!user) return unauthorized();
  const { data } = await supabase!
    .from("project_locations")
    .select("*, projects!inner(user_id)")
    .eq("project_id", id)
    .eq("projects.user_id", user.id)
    .single();
  return data ? ok(data) : notFound("Location not found");
}

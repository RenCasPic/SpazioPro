import { ok, unauthorized, badRequest, demoNotice } from "@/lib/api/http";
import { isDemoMode } from "@/lib/constants";
import { generateEstimateSchema } from "@/lib/validations/estimate";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const DEMO_MSG = "In demo mode estimates are stored in the browser.";

export async function GET(request: Request) {
  if (isDemoMode()) return demoNotice(DEMO_MSG);
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = (await supabase!.auth.getUser()) ?? { data: { user: null } };
  if (!user) return unauthorized();
  const projectId = new URL(request.url).searchParams.get("projectId");
  let q = supabase!.from("estimates").select("*, projects!inner(user_id)").eq("projects.user_id", user.id);
  if (projectId) q = q.eq("project_id", projectId);
  const { data, error } = await q.order("created_at", { ascending: false });
  if (error) return badRequest(error.message);
  return ok(data);
}

export async function POST(request: Request) {
  if (isDemoMode()) return demoNotice(DEMO_MSG);
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = (await supabase!.auth.getUser()) ?? { data: { user: null } };
  if (!user) return unauthorized();
  try {
    generateEstimateSchema.parse(await request.json());
  } catch {
    return badRequest("Invalid data");
  }
  return demoNotice("Implement against Supabase tables following estimate-service (market snapshot).");
}

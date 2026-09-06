import { ok, unauthorized, badRequest, demoNotice } from "@/lib/api/http";
import { isDemoMode } from "@/lib/constants";
import { newProjectSchema } from "@/lib/validations/project";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const DEMO_MSG = "In demo mode projects are stored in the browser.";

export async function GET() {
  if (isDemoMode()) return demoNotice(DEMO_MSG);
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = (await supabase!.auth.getUser()) ?? { data: { user: null } };
  if (!user) return unauthorized();
  const { data, error } = await supabase!
    .from("projects")
    .select("*")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });
  if (error) return badRequest(error.message);
  return ok(data);
}

export async function POST(request: Request) {
  if (isDemoMode()) return demoNotice(DEMO_MSG);
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = (await supabase!.auth.getUser()) ?? { data: { user: null } };
  if (!user) return unauthorized();
  let body;
  try {
    body = newProjectSchema.parse(await request.json());
  } catch {
    return badRequest("Invalid data");
  }
  const { data, error } = await supabase!
    .from("projects")
    .insert({
      user_id: user.id,
      name: body.name,
      client_id: body.clientId,
      project_type: body.projectType,
      state_code: body.stateCode.toUpperCase(),
      country_code: "US",
      currency_code: "USD",
      locale: "en-US",
      measurement_system: "imperial",
      estimate_language: body.estimateLanguage,
      description: body.description ?? "",
    })
    .select()
    .single();
  if (error) return badRequest(error.message);
  return ok(data, { status: 201 });
}

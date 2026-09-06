import { NextResponse } from "next/server";
import { ok, unauthorized, badRequest } from "@/lib/api/http";
import { isDemoMode } from "@/lib/constants";
import { generateEstimateSchema } from "@/lib/validations/estimate";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const demo = () =>
  NextResponse.json(
    { demo: true, message: "En modo demo los presupuestos se guardan en el navegador." },
    { status: 501 },
  );

export async function GET(request: Request) {
  if (isDemoMode()) return demo();
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = (await supabase!.auth.getUser()) ?? { data: { user: null } };
  if (!user) return unauthorized();
  const projectId = new URL(request.url).searchParams.get("projectId");
  let q = supabase!.from("estimates").select("*, projects!inner(owner_id)").eq("projects.owner_id", user.id);
  if (projectId) q = q.eq("project_id", projectId);
  const { data, error } = await q.order("created_at", { ascending: false });
  if (error) return badRequest(error.message);
  return ok(data);
}

export async function POST(request: Request) {
  if (isDemoMode()) return demo();
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = (await supabase!.auth.getUser()) ?? { data: { user: null } };
  if (!user) return unauthorized();
  try {
    generateEstimateSchema.parse(await request.json());
  } catch {
    return badRequest("Datos no válidos");
  }
  // The estimate + market snapshot are assembled server-side against Supabase
  // rows; see lib/services/estimate-service.ts for the calculation contract.
  return NextResponse.json(
    { message: "Implementar contra las tablas de Supabase siguiendo estimate-service." },
    { status: 501 },
  );
}

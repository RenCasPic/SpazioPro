import { NextResponse } from "next/server";
import { ok, unauthorized, badRequest } from "@/lib/api/http";
import { isDemoMode } from "@/lib/constants";
import { newProjectSchema } from "@/lib/validations/project";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Supabase-backed projects API. In demo mode persistence is client-side
 * (localStorage via lib/services/project-service), so this returns 501.
 */
export async function GET() {
  if (isDemoMode()) {
    return NextResponse.json(
      { demo: true, message: "En modo demo los proyectos se guardan en el navegador." },
      { status: 501 },
    );
  }
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = (await supabase!.auth.getUser()) ?? { data: { user: null } };
  if (!user) return unauthorized();
  const { data, error } = await supabase!
    .from("projects")
    .select("*")
    .eq("owner_id", user.id)
    .order("updated_at", { ascending: false });
  if (error) return badRequest(error.message);
  return ok(data);
}

export async function POST(request: Request) {
  if (isDemoMode()) {
    return NextResponse.json(
      { demo: true, message: "En modo demo los proyectos se guardan en el navegador." },
      { status: 501 },
    );
  }
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = (await supabase!.auth.getUser()) ?? { data: { user: null } };
  if (!user) return unauthorized();

  let body;
  try {
    body = newProjectSchema.parse(await request.json());
  } catch {
    return badRequest("Datos no válidos");
  }
  const { data, error } = await supabase!
    .from("projects")
    .insert({
      owner_id: user.id,
      name: body.name,
      client_id: body.clientId,
      project_type: body.projectType,
      country_code: body.countryCode,
      description: body.description ?? "",
    })
    .select()
    .single();
  if (error) return badRequest(error.message);
  return ok(data, { status: 201 });
}

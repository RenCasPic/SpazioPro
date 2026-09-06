import { NextResponse } from "next/server";
import { ok, unauthorized, badRequest, notFound } from "@/lib/api/http";
import { isDemoMode } from "@/lib/constants";
import { updateProjectSchema } from "@/lib/validations/project";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const demo = () =>
  NextResponse.json(
    { demo: true, message: "En modo demo los proyectos se guardan en el navegador." },
    { status: 501 },
  );

async function userClient() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = (await supabase!.auth.getUser()) ?? { data: { user: null } };
  return { supabase: supabase!, user };
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (isDemoMode()) return demo();
  const { id } = await params;
  const { supabase, user } = await userClient();
  if (!user) return unauthorized();
  const { data } = await supabase.from("projects").select("*").eq("id", id).eq("owner_id", user.id).single();
  return data ? ok(data) : notFound("Proyecto no encontrado");
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (isDemoMode()) return demo();
  const { id } = await params;
  const { supabase, user } = await userClient();
  if (!user) return unauthorized();
  let patch;
  try {
    patch = updateProjectSchema.parse(await request.json());
  } catch {
    return badRequest("Datos no válidos");
  }
  const { data, error } = await supabase
    .from("projects")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("owner_id", user.id)
    .select()
    .single();
  if (error) return badRequest(error.message);
  return ok(data);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (isDemoMode()) return demo();
  const { id } = await params;
  const { supabase, user } = await userClient();
  if (!user) return unauthorized();
  const { error } = await supabase.from("projects").delete().eq("id", id).eq("owner_id", user.id);
  if (error) return badRequest(error.message);
  return ok({ deleted: true });
}

import { NextResponse } from "next/server";
import { ok, unauthorized, notFound } from "@/lib/api/http";
import { isDemoMode } from "@/lib/constants";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (isDemoMode()) {
    return NextResponse.json(
      { demo: true, message: "En modo demo los presupuestos se guardan en el navegador." },
      { status: 501 },
    );
  }
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = (await supabase!.auth.getUser()) ?? { data: { user: null } };
  if (!user) return unauthorized();
  const { data } = await supabase!
    .from("estimates")
    .select("*, estimate_items(*), projects!inner(owner_id)")
    .eq("id", id)
    .eq("projects.owner_id", user.id)
    .single();
  return data ? ok(data) : notFound("Presupuesto no encontrado");
}

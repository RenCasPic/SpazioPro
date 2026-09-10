import { ok, unauthorized, badRequest, notFound, demoNotice } from "@/lib/api/http";
import { isDemoMode } from "@/lib/constants";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { roomModelSchema, roomModelEditSchema } from "@/lib/validations/room-model";
import { applyModelEdit } from "@/lib/spatial/edit";
import type { RoomModel } from "@/types";

const DEMO_MSG = "In demo mode the 3D room model is stored in the browser — use roomModelService.";

async function userClient() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = (await supabase!.auth.getUser()) ?? { data: { user: null } };
  return { supabase: supabase!, user };
}

async function ownsProject(supabase: Awaited<ReturnType<typeof userClient>>["supabase"], projectId: string, userId: string) {
  const { data } = await supabase.from("projects").select("id").eq("id", projectId).eq("user_id", userId).single();
  return !!data;
}

/** Latest room-model version for the project's room. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (isDemoMode()) return demoNotice(DEMO_MSG);
  const { id } = await params;
  const { supabase, user } = await userClient();
  if (!user) return unauthorized();
  if (!(await ownsProject(supabase, id, user.id))) return notFound("Project not found");

  const { data } = await supabase
    .from("room_models")
    .select("model, id, version, status")
    .eq("project_id", id)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  return ok({ model: (data?.model as RoomModel | undefined) ?? null });
}

/** Apply one edit op → persist as a NEW version (never mutate a prior one). */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (isDemoMode()) return demoNotice(DEMO_MSG);
  const { id } = await params;
  const { supabase, user } = await userClient();
  if (!user) return unauthorized();
  if (!(await ownsProject(supabase, id, user.id))) return notFound("Project not found");

  let edit;
  try {
    edit = roomModelEditSchema.parse(await request.json());
  } catch (e) {
    return badRequest("Invalid edit", e);
  }

  const { data: current } = await supabase
    .from("room_models")
    .select("*")
    .eq("project_id", id)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!current) return notFound("No room model");

  const model = roomModelSchema.parse(current.model);
  const next = applyModelEdit(model, edit);

  const { data, error } = await supabase
    .from("room_models")
    .insert({
      project_id: id,
      room_id: current.room_id,
      version: current.version + 1,
      schema_version: 1,
      source: next.source,
      status: next.status,
      calibration_status: next.calibration.status,
      scale_factor: next.calibration.scaleFactor,
      bounds: next.bounds,
      floor_polygon: next.floorPolygon,
      ceiling_height_in: next.ceilingHeightIn,
      confidence: next.confidence,
      model: { ...next, id: undefined, version: current.version + 1, supersedesId: current.id },
    })
    .select("model")
    .single();
  if (error) return badRequest(error.message);
  return ok({ model: data.model });
}

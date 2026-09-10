import { ok, unauthorized, badRequest, notFound, demoNotice } from "@/lib/api/http";
import { isDemoMode } from "@/lib/constants";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { calibrateRequestSchema, roomModelSchema } from "@/lib/validations/room-model";
import { calibrateModel } from "@/lib/spatial/calibrate";

const DEMO_MSG = "In demo mode calibration runs client-side — call roomModelService.calibrate().";

/** Confirm 1–3 measurements → rescale the model → persist as a NEW version. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (isDemoMode()) return demoNotice(DEMO_MSG);

  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = (await supabase!.auth.getUser()) ?? { data: { user: null } };
  if (!user) return unauthorized();

  const { data: project } = await supabase!.from("projects").select("id").eq("id", id).eq("user_id", user.id).single();
  if (!project) return notFound("Project not found");

  let body;
  try {
    body = calibrateRequestSchema.parse(await request.json());
  } catch (e) {
    return badRequest("Invalid request", e);
  }

  const { data: current } = await supabase!
    .from("room_models")
    .select("*")
    .eq("project_id", id)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!current) return notFound("No room model");

  const model = roomModelSchema.parse(current.model);
  const next = calibrateModel(
    model,
    body.measurements.map((m) => ({ entityId: m.entityId, kind: m.kind, valueIn: m.valueIn })),
  );

  const { data, error } = await supabase!
    .from("room_models")
    .insert({
      project_id: id,
      room_id: current.room_id,
      version: current.version + 1,
      schema_version: 1,
      source: next.source,
      status: "ready",
      calibration_status: next.calibration.status,
      scale_factor: next.calibration.scaleFactor,
      bounds: next.bounds,
      floor_polygon: next.floorPolygon,
      ceiling_height_in: next.ceilingHeightIn,
      confidence: next.confidence,
      model: { ...next, version: current.version + 1, supersedesId: current.id, status: "ready" },
    })
    .select("model")
    .single();
  if (error) return badRequest(error.message);

  // keep the rooms row in sync so estimate / quantities use the new scale
  await supabase!
    .from("rooms")
    .update({
      width_in: next.bounds.widthIn,
      length_in: next.bounds.lengthIn,
      height_in: next.bounds.heightIn,
      measurement_source: "mixed",
    })
    .eq("id", current.room_id);

  return ok({ model: data.model });
}

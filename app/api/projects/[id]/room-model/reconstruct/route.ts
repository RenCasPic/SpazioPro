import { ok, unauthorized, badRequest, notFound, demoNotice } from "@/lib/api/http";
import { isDemoMode } from "@/lib/constants";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { reconstructRequestSchema } from "@/lib/validations/room-model";
import { getSpatialProvider } from "@/lib/spatial/provider";

const DEMO_MSG =
  "In demo mode reconstruction runs client-side against DemoSpatialProvider — call roomModelService.reconstruct().";

/**
 * Kick off reconstruction. In production this enqueues a background job and
 * returns its id; the client polls GET /room-model. Demo mode does it locally.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (isDemoMode()) return demoNotice(DEMO_MSG);

  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = (await supabase!.auth.getUser()) ?? { data: { user: null } };
  if (!user) return unauthorized();

  const { data: project } = await supabase!
    .from("projects")
    .select("id, project_type")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();
  if (!project) return notFound("Project not found");

  let body;
  try {
    body = reconstructRequestSchema.parse(await request.json());
  } catch (e) {
    return badRequest("Invalid request", e);
  }

  const { data: room } = await supabase!.from("rooms").select("id").eq("project_id", id).limit(1).single();
  if (!room) return badRequest("Project has no room");

  const provider = getSpatialProvider();

  const { data: job, error } = await supabase!
    .from("ai_jobs")
    .insert({
      project_id: id,
      room_id: room.id,
      type: "reconstruct",
      status: "uploaded",
      input: { captureIds: body.captureIds, provider: provider.id, roomTypeHint: body.roomTypeHint },
    })
    .select("id, status")
    .single();
  if (error) return badRequest(error.message);

  // A worker (Edge Function / queue consumer) picks the job up, runs
  // provider.reconstruct(), writes room_models, and flips the job to `ready`.
  return ok({ jobId: job.id, status: job.status, provider: provider.id }, { status: 202 });
}

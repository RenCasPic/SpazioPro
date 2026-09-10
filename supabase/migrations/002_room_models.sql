-- SpazioPro — Semantic 3D Room Models.
-- The MVP runs fully on localStorage (see lib/services/room-model-service.ts +
-- lib/spatial/*). This migration is the production backend: apply with
-- `supabase db push`, then set DEMO_MODE=false.
--
-- Design: the *semantic model* (entities, polygons, dimensions, confidence)
-- lives in Postgres JSONB — it is small, always loaded together, edited
-- transactionally and versioned. Heavy binary artefacts (photos, depth maps,
-- point clouds, GLB) live in Storage. See docs/3d-room-reconstruction.md §11–12.

-- ---------------------------------------------------------------------------
-- room_models — one *current* model per room; older versions kept for
-- reproducibility (an estimate references room_model_id + version).
-- ---------------------------------------------------------------------------
create table if not exists public.room_models (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade, -- denormalized for RLS
  room_id    uuid not null references public.rooms (id)    on delete cascade,
  version        int  not null default 1,
  schema_version int  not null default 1,
  supersedes_id  uuid references public.room_models (id) on delete set null,
  source     text not null default 'demo',              -- demo | photo | video | mobile_depth | lidar | arkit | arcore | manual | inferred
  status     text not null default 'uploaded',          -- uploaded | processing | reconstructing | segmenting | building_model | awaiting_validation | ready | failed
  calibration_status text not null default 'uncalibrated', -- uncalibrated | partially_calibrated | calibrated
  scale_factor numeric not null default 1,
  bounds     jsonb not null default '{}'::jsonb,         -- { widthIn, lengthIn, heightIn }
  floor_polygon jsonb not null default '[]'::jsonb,
  ceiling_height_in numeric not null default 0,
  model      jsonb not null default '{}'::jsonb,         -- the full RoomModel (entities tree) — SOURCE OF TRUTH
  confidence numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (room_id, version)
);
create index if not exists room_models_project_idx on public.room_models (project_id);
create index if not exists room_models_room_version_idx on public.room_models (room_id, version desc);

-- ---------------------------------------------------------------------------
-- room_captures — the photos / video frames a model was built from. Kept so
-- reconstruction can be re-run. Binary stays in Storage (bucket room-captures).
-- ---------------------------------------------------------------------------
create table if not exists public.room_captures (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  room_model_id uuid references public.room_models (id) on delete set null,
  kind text not null default 'photo',                   -- photo | frame
  storage_path text not null,                           -- room-captures/{projectId}/{id}.jpg
  width int,
  height int,
  ordinal int not null default 0,
  exif jsonb not null default '{}'::jsonb,              -- focal length, orientation — GPS stripped on ingest
  created_at timestamptz not null default now()
);
create index if not exists room_captures_project_idx on public.room_captures (project_id);
create index if not exists room_captures_model_idx on public.room_captures (room_model_id);

-- ---------------------------------------------------------------------------
-- room_measurements — audit trail of every scale reference (user / auto / device).
-- ---------------------------------------------------------------------------
create table if not exists public.room_measurements (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  room_model_id uuid not null references public.room_models (id) on delete cascade,
  entity_id text not null,                              -- RoomEntity.id inside room_models.model
  kind text not null,                                   -- wall_length | ceiling_height | opening_width | ...
  value_in numeric not null,
  source text not null default 'user',                 -- user | auto_prior | device
  created_at timestamptz not null default now()
);
create index if not exists room_measurements_model_idx on public.room_measurements (room_model_id);

-- ---------------------------------------------------------------------------
-- project_items → optional link to a semantic surface. When set, the quantity
-- engine takes the base quantity from that entity's net area (see
-- lib/calculations/estimate.ts resolveItemQuantity). Backward compatible.
-- ---------------------------------------------------------------------------
alter table public.project_items add column if not exists room_entity_id text;

-- estimates freeze the room-model version they were computed against, exactly
-- like market_snapshot / price_snapshot — historical estimates never change.
alter table public.estimates add column if not exists room_model_id uuid references public.room_models (id) on delete set null;
alter table public.estimates add column if not exists room_model_version int;

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['room_models'] loop
    execute format(
      'drop trigger if exists touch_%1$s on public.%1$s;
       create trigger touch_%1$s before update on public.%1$s
       for each row execute function public.touch_updated_at();', t);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Row Level Security — same owns_project() pattern as 001.
-- ---------------------------------------------------------------------------
alter table public.room_models       enable row level security;
alter table public.room_captures     enable row level security;
alter table public.room_measurements enable row level security;

create policy "own room models" on public.room_models
  for all using (public.owns_project(project_id)) with check (public.owns_project(project_id));
create policy "own room captures" on public.room_captures
  for all using (public.owns_project(project_id)) with check (public.owns_project(project_id));
create policy "own room measurements" on public.room_measurements
  for all using (public.owns_project(project_id)) with check (public.owns_project(project_id));

-- ---------------------------------------------------------------------------
-- Storage buckets (create in the dashboard or via the storage API; policies here).
--   room-captures       private, keep — original photos / frames (GPS stripped)
--   room-depth          private, purge after 30d — depth maps + segmentation masks (regenerable)
--   room-models         private, keep — derived model.glb + preview.png (regenerable from model jsonb)
-- Path convention: {bucket}/{projectId}/...
-- ---------------------------------------------------------------------------
-- Example policy (repeat per bucket), assuming folder[1] = projectId:
--
--   create policy "own room-captures" on storage.objects for all
--     using (
--       bucket_id = 'room-captures'
--       and public.owns_project(((storage.foldername(name))[1])::uuid)
--     )
--     with check (
--       bucket_id = 'room-captures'
--       and public.owns_project(((storage.foldername(name))[1])::uuid)
--     );

-- Estimate It — Professional foundation: Takeoff, Scope of Work, Assemblies
-- (catalog only, not a table — see data/assemblies.ts), company pricing/labor
-- overrides, project files, and estimate versioning.
--
-- The MVP runs fully on localStorage (see lib/services/{takeoff,scope,
-- company}-service.ts + lib/calculations/{scopes,assemblies}.ts). This
-- migration is the production backend: apply after 001 and 002, in order.
--
-- `company_id` references `auth.users` directly for now — in demo mode and in
-- this migration a "company" is exactly one user. Phase 3 (team permissions)
-- introduces a real `companies` / `company_members` table; the override
-- lookup contract (state-specific row first, then company-wide) does not
-- change, only what `company_id` points to.

-- ---------------------------------------------------------------------------
-- Estimate versioning — a regenerated estimate never edits the one before it.
-- ---------------------------------------------------------------------------
alter table public.estimates
  add column if not exists version_number int not null default 1,
  add column if not exists supersedes_id uuid references public.estimates (id) on delete set null;
create index if not exists estimates_chain_idx on public.estimates (project_id, scenario_id, kind, version_number desc);

-- ---------------------------------------------------------------------------
-- Workspace mode — professional (default) vs. the original consumer flow.
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column if not exists workspace_mode text not null default 'professional'; -- consumer | professional

-- ---------------------------------------------------------------------------
-- Takeoff — "how much work/material exists". Never a price; see
-- lib/calculations/estimate.ts resolveItemQuantity() for how a project_item
-- opts in to a measurement's quantity via project_items.takeoff_measurement_id.
-- ---------------------------------------------------------------------------
create table if not exists public.takeoff_measurements (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  room_id uuid references public.rooms (id) on delete set null,
  category text not null,                          -- a LaborCategory value — the trade
  label text not null,
  unit text not null,                               -- sq_ft | linear_ft | ea | cu_ft | cu_yd | gallon | hour | day | project
  quantity numeric not null,
  source text not null default 'manual',            -- manual | room_model | ai_photo | ifc | cad | pdf_plan | document
  source_ref text,                                  -- e.g. a RoomEntity id when source = room_model
  confidence numeric not null default 1,
  verification_status text not null default 'verified', -- unverified | needs_verification | verified
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists takeoff_measurements_project_idx on public.takeoff_measurements (project_id);

alter table public.project_items
  add column if not exists takeoff_measurement_id uuid references public.takeoff_measurements (id) on delete set null;

-- ---------------------------------------------------------------------------
-- Scope of Work — a trade section with its own markup/contingency. It groups
-- EXISTING project_items by the trade (labor_category) of their product; it
-- does not own or duplicate them.
-- ---------------------------------------------------------------------------
create table if not exists public.scope_sections (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  scenario_id uuid not null references public.design_scenarios (id) on delete cascade,
  category text not null,                           -- a LaborCategory value — the trade
  name text not null,
  markup_percent numeric not null default 0,
  contingency_percent numeric not null default 0,
  notes text not null default '',
  "order" int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists scope_sections_project_idx on public.scope_sections (project_id);

-- ---------------------------------------------------------------------------
-- Company pricing / labor overrides — resolved BEFORE the state/national
-- default in lib/market/{pricing-service,labor-rate-service}.
-- ---------------------------------------------------------------------------
create table if not exists public.company_product_prices (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references auth.users (id) on delete cascade,
  product_id text not null references public.products (id) on delete cascade,
  state_code varchar(2),                            -- null = applies in every state
  price numeric not null,
  updated_at timestamptz not null default now(),
  unique (company_id, product_id, state_code)
);
create index if not exists company_product_prices_lookup_idx on public.company_product_prices (company_id, product_id);

create table if not exists public.company_labor_rates (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references auth.users (id) on delete cascade,
  category text not null,                           -- a LaborCategory value
  state_code varchar(2),
  cost numeric not null,
  updated_at timestamptz not null default now(),
  unique (company_id, category, state_code)
);
create index if not exists company_labor_rates_lookup_idx on public.company_labor_rates (company_id, category);

-- ---------------------------------------------------------------------------
-- Project files — documents that give a project context (specs, scope of
-- work, schedules, bid docs). Phase 2 uses these as takeoff source material.
-- ---------------------------------------------------------------------------
create table if not exists public.project_files (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  name text not null,
  kind text not null default 'other',               -- pdf | docx | xlsx | csv | image | other
  url text not null,
  size_bytes bigint not null default 0,
  notes text not null default '',
  created_at timestamptz not null default now()
);
create index if not exists project_files_project_idx on public.project_files (project_id);

-- ---------------------------------------------------------------------------
-- updated_at trigger (reuses public.touch_updated_at from 001)
-- ---------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'takeoff_measurements', 'scope_sections', 'company_product_prices', 'company_labor_rates'
  ] loop
    execute format(
      'drop trigger if exists touch_%1$s on public.%1$s;
       create trigger touch_%1$s before update on public.%1$s
       for each row execute function public.touch_updated_at();', t);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Row Level Security — same owns_project() pattern as 001/002.
-- ---------------------------------------------------------------------------
alter table public.takeoff_measurements  enable row level security;
alter table public.scope_sections        enable row level security;
alter table public.company_product_prices enable row level security;
alter table public.company_labor_rates    enable row level security;
alter table public.project_files          enable row level security;

create policy "own takeoff measurements" on public.takeoff_measurements
  for all using (public.owns_project(project_id)) with check (public.owns_project(project_id));
create policy "own scope sections" on public.scope_sections
  for all using (public.owns_project(project_id)) with check (public.owns_project(project_id));
create policy "own project files" on public.project_files
  for all using (public.owns_project(project_id)) with check (public.owns_project(project_id));

create policy "own company product prices" on public.company_product_prices
  for all using (company_id = auth.uid()) with check (company_id = auth.uid());
create policy "own company labor rates" on public.company_labor_rates
  for all using (company_id = auth.uid()) with check (company_id = auth.uid());

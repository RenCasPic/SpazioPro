-- SpazioPro — reference schema for the Supabase backend.
-- The MVP runs entirely on localStorage; this file is the target data model
-- for when persistence moves server-side. Apply with `supabase db push` or the
-- SQL editor. Row Level Security policies are illustrative.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  company_name text,
  created_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.users (id) on delete cascade,
  name text not null,
  room_type text not null,
  status text not null default 'draft',
  dimensions jsonb not null default '{"width":4,"length":5,"height":2.6,"estimated":true}',
  settings jsonb not null default '{}',
  active_scenario_id uuid,
  design_filter text,
  vision jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.project_images (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  kind text not null default 'original',            -- original | design
  storage_path text not null,                        -- Supabase Storage object path
  created_at timestamptz not null default now()
);

create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  surfaces jsonb not null default '[]',
  objects jsonb not null default '[]'
);

-- Global catalog (seeded from src/data/catalog.ts)
create table if not exists public.products (
  id text primary key,
  name text not null,
  category text not null,
  "group" text not null,
  brand text,
  reference text,
  supplier text,
  price numeric not null default 0,
  unit text not null default 'ud',
  labor numeric not null default 0,
  color text,
  style text,
  description text,
  swatch text,
  sprite text
);

-- Per-project catalog overrides / custom materials
create table if not exists public.materials (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects (id) on delete cascade,
  product_id text references public.products (id),
  override jsonb not null default '{}'
);

create table if not exists public.scenarios (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  name text not null,
  tier text not null default 'custom',
  position int not null default 0
);

create table if not exists public.project_items (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  scenario_id uuid not null references public.scenarios (id) on delete cascade,
  product_id text references public.products (id),
  kind text not null,                                -- surface | object
  surface text,                                      -- floor | wall | ceiling
  snapshot jsonb not null,                           -- editable name/price/qty/waste
  transform jsonb not null default '{"x":50,"y":50,"scale":1,"rotation":0}',
  created_at timestamptz not null default now()
);

create table if not exists public.estimates (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  scenario_id uuid not null references public.scenarios (id) on delete cascade,
  number text not null,
  vat_pct numeric not null default 21,
  transport numeric not null default 0,
  discount_pct numeric not null default 0,
  totals jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.estimate_items (
  id uuid primary key default gen_random_uuid(),
  estimate_id uuid not null references public.estimates (id) on delete cascade,
  concept text not null,
  quantity numeric not null,
  unit text not null,
  unit_price numeric not null,
  labor_price numeric not null default 0,
  total numeric not null
);

create table if not exists public.settings (
  owner_id uuid primary key references public.users (id) on delete cascade,
  company_name text,
  company_tagline text,
  default_vat_pct numeric not null default 21,
  logo_path text
);

-- ---------------------------------------------------------------------------
alter table public.projects        enable row level security;
alter table public.project_images  enable row level security;
alter table public.scenarios       enable row level security;
alter table public.project_items   enable row level security;
alter table public.estimates       enable row level security;

create policy "own projects" on public.projects
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "own project children" on public.project_items
  for all using (
    exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid())
  );

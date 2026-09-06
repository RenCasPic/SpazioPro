-- SpazioPro — initial schema (US market).
-- The MVP runs fully on localStorage (see lib/db). This migration is the
-- target backend: apply with `supabase db push` or the SQL editor, then set
-- NEXT_PUBLIC_SUPABASE_URL / ANON_KEY and DEMO_MODE=false.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Reference data (US)
-- ---------------------------------------------------------------------------
create table if not exists public.countries (
  code varchar(2) primary key,
  name text not null,
  currency_code varchar(3) not null,
  currency_symbol text not null,
  locale text not null,
  measurement_system text not null default 'imperial',
  active boolean not null default true
);

create table if not exists public.states (
  country_code varchar(2) not null references public.countries (code) on delete cascade,
  code varchar(2) not null,
  name text not null,
  active boolean not null default true,
  primary key (country_code, code)
);

-- Sales tax is resolved from the project's jurisdiction (no national rate).
create table if not exists public.tax_jurisdictions (
  id text primary key,
  country_code varchar(2) not null references public.countries (code),
  state_code varchar(2) not null,
  county text,
  city text,
  zip_code varchar(10),
  name text not null,
  active boolean not null default true
);
create index if not exists tax_jur_lookup_idx on public.tax_jurisdictions (state_code, city, zip_code);

create table if not exists public.tax_rates (
  id uuid primary key default gen_random_uuid(),
  jurisdiction_id text not null references public.tax_jurisdictions (id) on delete cascade,
  rate numeric not null,           -- combined percentage
  effective_from timestamptz not null default now(),
  effective_until timestamptz,
  source text,
  active boolean not null default true
);

create table if not exists public.labor_rates (
  id uuid primary key default gen_random_uuid(),
  country_code varchar(2) not null default 'US',
  state_code varchar(2),           -- null = national default
  category text not null,
  unit text not null,              -- hour | day | sq_ft | linear_ft | unit | project
  cost numeric not null,
  currency_code varchar(3) not null default 'USD',
  metadata jsonb not null default '{}',
  updated_at timestamptz not null default now()
);
create index if not exists labor_rates_state_idx on public.labor_rates (state_code);

create table if not exists public.delivery_rates (
  id uuid primary key default gen_random_uuid(),
  country_code varchar(2) not null default 'US',
  state_code varchar(2),
  base_fee numeric not null default 0,
  per_mile numeric not null default 0,
  per_cu_yd numeric not null default 0,
  currency_code varchar(3) not null default 'USD'
);

create table if not exists public.products (
  id text primary key,
  name text not null,
  sku text,
  brand text,
  category text not null,
  "group" text not null,
  subcategory text,
  description text,
  image_url text,
  swatch text,
  sprite text,
  unit text not null default 'ea',
  color text,
  style text,
  surface text,
  labor_category text not null default 'general_labor',
  waste_percent numeric not null default 10,
  active boolean not null default true,
  demo boolean not null default true,
  updated_at timestamptz not null default now()
);
create index if not exists products_category_idx on public.products (category);

-- No global product price. A product can cost differently in each state.
create table if not exists public.product_market_prices (
  id uuid primary key default gen_random_uuid(),
  product_id text not null references public.products (id) on delete cascade,
  country_code varchar(2) not null default 'US',
  state_code varchar(2),           -- null = national
  region text,
  city text,
  zip_code varchar(10),
  supplier text,
  price numeric not null,
  currency_code varchar(3) not null default 'USD',
  unit text,
  available boolean not null default true,
  lead_time_days int not null default 0,
  min_quantity numeric not null default 1,
  effective_from timestamptz not null default now(),
  effective_until timestamptz,
  source text not null default 'market',
  updated_at timestamptz not null default now()
);
create index if not exists pmp_lookup_idx on public.product_market_prices (product_id, state_code);

-- ---------------------------------------------------------------------------
-- Users
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  company_name text,
  phone text,
  email text,
  avatar_url text,
  logo_url text,
  country_code varchar(2) default 'US',
  default_state_code varchar(2),
  default_zip varchar(10),
  city text,
  address text,
  currency_code varchar(3) default 'USD',
  measurement_system text not null default 'imperial',
  app_language text not null default 'en-US',
  estimate_language text not null default 'en-US',
  license_number text,
  website text,
  terms text,
  professional_type text not null default 'general_contractor',
  onboarding_complete boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  email text,
  phone text,
  company text,
  address text,
  city text,
  postal_code text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists clients_user_idx on public.clients (user_id);

-- ---------------------------------------------------------------------------
-- Projects
-- ---------------------------------------------------------------------------
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  client_id uuid references public.clients (id) on delete set null,
  name text not null,
  description text default '',
  project_type text not null default 'kitchen',
  status text not null default 'draft',
  country_code varchar(2) not null default 'US',
  state_code varchar(2) not null,
  currency_code varchar(3) not null default 'USD',
  locale text not null default 'en-US',
  measurement_system text not null default 'imperial',
  estimate_language text not null default 'en-US',
  active_scenario_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists projects_user_idx on public.projects (user_id);
create index if not exists projects_state_idx on public.projects (state_code);

create table if not exists public.project_locations (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  address text,
  city text,
  state text,
  state_code varchar(2),
  county text,
  zip_code varchar(10),
  latitude numeric,
  longitude numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id)
);

create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  name text not null default 'Main space',
  width_in numeric not null default 0,
  length_in numeric not null default 0,
  height_in numeric not null default 0,
  floor_area_sq_ft numeric not null default 0,
  wall_area_sq_ft numeric not null default 0,
  ceiling_area_sq_ft numeric not null default 0,
  perimeter_lin_ft numeric not null default 0,
  measurement_source text not null default 'ai_estimate',
  ai_analysis jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists rooms_project_idx on public.rooms (project_id);

create table if not exists public.project_images (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  room_id uuid references public.rooms (id) on delete set null,
  type text not null default 'original',
  original_url text not null,
  processed_url text,
  thumbnail_url text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index if not exists project_images_project_idx on public.project_images (project_id);

create table if not exists public.design_scenarios (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  name text not null,
  description text default '',
  type text not null default 'custom',
  total_estimate numeric not null default 0,
  currency_code varchar(3) not null default 'USD',
  preview_image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists scenarios_project_idx on public.design_scenarios (project_id);

create table if not exists public.project_items (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  room_id uuid references public.rooms (id) on delete set null,
  scenario_id uuid not null references public.design_scenarios (id) on delete cascade,
  product_id text references public.products (id),
  name text not null,
  category text not null,
  kind text not null,
  surface text,
  quantity numeric not null default 1,
  quantity_auto boolean not null default false,
  unit text not null,
  unit_price numeric not null default 0,
  labor_cost numeric not null default 0,
  currency_code varchar(3) not null default 'USD',
  waste_percent numeric not null default 10,
  price_source text not null default 'market',
  supplier text,
  demo_price boolean not null default true,
  transform jsonb not null default '{"x":0.5,"y":0.5,"scale":1,"rotation":0}',
  layer int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists project_items_project_idx on public.project_items (project_id);
create index if not exists project_items_scenario_idx on public.project_items (scenario_id);

-- ---------------------------------------------------------------------------
-- Estimates / proposals — reproducible via frozen market snapshots
-- ---------------------------------------------------------------------------
create table if not exists public.estimates (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  scenario_id uuid not null references public.design_scenarios (id) on delete cascade,
  kind text not null default 'estimate',       -- estimate | proposal
  estimate_number text unique not null,
  language text not null default 'en-US',
  country_code varchar(2) not null default 'US',
  state_code varchar(2) not null,
  city text,
  zip_code varchar(10),
  currency_code varchar(3) not null default 'USD',
  sales_tax_rate numeric not null,
  scope_of_work text default '',
  subtotal_materials numeric not null default 0,
  subtotal_labor numeric not null default 0,
  subtotal_equipment numeric not null default 0,
  subtotal_delivery numeric not null default 0,
  subtotal_disposal numeric not null default 0,
  subtotal_permits numeric not null default 0,
  subtotal_other numeric not null default 0,
  discount numeric not null default 0,
  tax_amount numeric not null default 0,
  total numeric not null default 0,
  notes text default '',
  status text not null default 'final',
  market_snapshot jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists estimates_project_idx on public.estimates (project_id);

create table if not exists public.estimate_items (
  id uuid primary key default gen_random_uuid(),
  estimate_id uuid not null references public.estimates (id) on delete cascade,
  project_item_id uuid references public.project_items (id) on delete set null,
  description text not null,
  category text not null,
  quantity numeric not null,
  unit text not null,
  unit_price numeric not null,
  labor_price numeric not null default 0,
  total numeric not null,
  price_snapshot jsonb not null,
  created_at timestamptz not null default now()
);
create index if not exists estimate_items_estimate_idx on public.estimate_items (estimate_id);

create table if not exists public.ai_jobs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects (id) on delete cascade,
  room_id uuid references public.rooms (id) on delete set null,
  type text not null,
  status text not null default 'queued',
  input jsonb not null default '{}',
  output jsonb,
  error text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

-- ---------------------------------------------------------------------------
-- updated_at trigger
-- ---------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

do $$
declare t text;
begin
  foreach t in array array[
    'profiles','clients','projects','project_locations','rooms','design_scenarios',
    'project_items','estimates','products','product_market_prices','labor_rates'
  ] loop
    execute format(
      'drop trigger if exists touch_%1$s on public.%1$s;
       create trigger touch_%1$s before update on public.%1$s
       for each row execute function public.touch_updated_at();', t);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles         enable row level security;
alter table public.clients          enable row level security;
alter table public.projects         enable row level security;
alter table public.project_locations enable row level security;
alter table public.rooms            enable row level security;
alter table public.project_images   enable row level security;
alter table public.design_scenarios enable row level security;
alter table public.project_items    enable row level security;
alter table public.estimates        enable row level security;
alter table public.estimate_items   enable row level security;
alter table public.ai_jobs          enable row level security;

alter table public.countries             enable row level security;
alter table public.states                enable row level security;
alter table public.tax_jurisdictions     enable row level security;
alter table public.tax_rates             enable row level security;
alter table public.labor_rates           enable row level security;
alter table public.delivery_rates        enable row level security;
alter table public.products              enable row level security;
alter table public.product_market_prices enable row level security;

create policy "reference read" on public.countries for select using (true);
create policy "reference read" on public.states for select using (true);
create policy "reference read" on public.tax_jurisdictions for select using (true);
create policy "reference read" on public.tax_rates for select using (true);
create policy "reference read" on public.labor_rates for select using (true);
create policy "reference read" on public.delivery_rates for select using (true);
create policy "reference read" on public.products for select using (true);
create policy "reference read" on public.product_market_prices for select using (true);

create policy "own profile" on public.profiles
  for all using (id = auth.uid()) with check (id = auth.uid());
create policy "own clients" on public.clients
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own projects" on public.projects
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create or replace function public.owns_project(pid uuid)
returns boolean language sql stable as $$
  select exists (select 1 from public.projects p where p.id = pid and p.user_id = auth.uid());
$$;

create policy "own locations" on public.project_locations
  for all using (public.owns_project(project_id)) with check (public.owns_project(project_id));
create policy "own rooms" on public.rooms
  for all using (public.owns_project(project_id)) with check (public.owns_project(project_id));
create policy "own images" on public.project_images
  for all using (public.owns_project(project_id)) with check (public.owns_project(project_id));
create policy "own scenarios" on public.design_scenarios
  for all using (public.owns_project(project_id)) with check (public.owns_project(project_id));
create policy "own items" on public.project_items
  for all using (public.owns_project(project_id)) with check (public.owns_project(project_id));
create policy "own estimates" on public.estimates
  for all using (public.owns_project(project_id)) with check (public.owns_project(project_id));
create policy "own ai jobs" on public.ai_jobs
  for all using (project_id is null or public.owns_project(project_id))
  with check (project_id is null or public.owns_project(project_id));
create policy "own estimate items" on public.estimate_items
  for all using (exists (select 1 from public.estimates e where e.id = estimate_id and public.owns_project(e.project_id)))
  with check (exists (select 1 from public.estimates e where e.id = estimate_id and public.owns_project(e.project_id)));

-- ---------------------------------------------------------------------------
-- Auto-create a profile on signup
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email) on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

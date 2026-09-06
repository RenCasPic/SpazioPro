-- SpazioPro — initial schema.
-- The MVP runs fully on localStorage (see lib/db). This migration is the
-- target backend: apply with `supabase db push` or the SQL editor, then point
-- the app at Supabase by setting NEXT_PUBLIC_SUPABASE_URL / ANON_KEY.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Reference data
-- ---------------------------------------------------------------------------
create table if not exists public.countries (
  id uuid primary key default gen_random_uuid(),
  code varchar(2) unique not null,
  name text not null,
  currency_code varchar(3) not null,
  currency_symbol text not null,
  locale text not null,
  measurement_system text not null default 'metric',
  default_tax_rate numeric not null default 21,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tax_rates (
  id uuid primary key default gen_random_uuid(),
  country_code varchar(2) not null references public.countries (code) on delete cascade,
  name text not null,
  rate numeric not null,
  category text not null default 'standard',
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists tax_rates_country_idx on public.tax_rates (country_code);

create table if not exists public.labor_rates (
  id uuid primary key default gen_random_uuid(),
  country_code varchar(2) not null references public.countries (code) on delete cascade,
  category text not null,
  unit text not null,
  cost numeric not null,
  currency_code varchar(3) not null,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists labor_rates_country_idx on public.labor_rates (country_code);

create table if not exists public.transport_rates (
  id uuid primary key default gen_random_uuid(),
  country_code varchar(2) not null references public.countries (code) on delete cascade,
  base_fee numeric not null default 0,
  per_km numeric not null default 0,
  per_m3 numeric not null default 0,
  currency_code varchar(3) not null,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
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
  unit text not null default 'ud',
  color text,
  style text,
  surface text,
  labor_category text not null default 'general',
  waste_percent numeric not null default 10,
  active boolean not null default true,
  demo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists products_category_idx on public.products (category);

-- No global product price. A product can cost differently in each country.
create table if not exists public.product_market_prices (
  id uuid primary key default gen_random_uuid(),
  product_id text not null references public.products (id) on delete cascade,
  country_code varchar(2) not null references public.countries (code) on delete cascade,
  price numeric not null,
  currency_code varchar(3) not null,
  supplier text,
  available boolean not null default true,
  min_quantity numeric not null default 1,
  source text not null default 'market', -- market | supplier
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, country_code, supplier)
);
create index if not exists pmp_product_country_idx on public.product_market_prices (product_id, country_code);

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
  country_code varchar(2) references public.countries (code),
  currency_code varchar(3),
  locale text,
  city text,
  address text,
  tax_id text,
  website text,
  terms text,
  default_tax_rate numeric not null default 21,
  professional_type text not null default 'interior_designer',
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
  project_type text not null default 'living_room',
  status text not null default 'draft',
  country_code varchar(2) not null references public.countries (code),
  currency_code varchar(3) not null,
  locale text not null,
  tax_rate numeric not null default 21,
  measurement_system text not null default 'metric',
  active_scenario_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists projects_user_idx on public.projects (user_id);
create index if not exists projects_country_idx on public.projects (country_code);

create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  name text not null default 'Espacio principal',
  width numeric not null default 0,
  length numeric not null default 0,
  height numeric not null default 0,
  floor_area numeric not null default 0,
  wall_area numeric not null default 0,
  ceiling_area numeric not null default 0,
  perimeter numeric not null default 0,
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
  type text not null default 'original', -- original | analysis | design | before_after
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
  type text not null default 'custom', -- economy | standard | premium | custom
  total_estimate numeric not null default 0,
  currency_code varchar(3) not null,
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
  kind text not null,               -- surface | object
  surface text,                     -- floor | wall | ceiling
  quantity numeric not null default 1,
  quantity_auto boolean not null default false,
  unit text not null,
  unit_price numeric not null default 0,
  labor_cost numeric not null default 0,
  currency_code varchar(3) not null,
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
-- Estimates — reproducible via frozen market snapshots
-- ---------------------------------------------------------------------------
create table if not exists public.estimates (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  scenario_id uuid not null references public.design_scenarios (id) on delete cascade,
  estimate_number text unique not null,
  country_code varchar(2) not null,
  currency_code varchar(3) not null,
  tax_rate numeric not null,
  subtotal_materials numeric not null default 0,
  subtotal_labor numeric not null default 0,
  subtotal_transport numeric not null default 0,
  subtotal_other numeric not null default 0,
  discount numeric not null default 0,
  tax_amount numeric not null default 0,
  total numeric not null default 0,
  notes text default '',
  status text not null default 'final', -- draft | final | approved | archived
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

create table if not exists public.settings (
  user_id uuid primary key references auth.users (id) on delete cascade,
  company_name text,
  company_tagline text,
  default_vat_rate numeric not null default 21,
  logo_path text,
  updated_at timestamptz not null default now()
);

create table if not exists public.ai_jobs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects (id) on delete cascade,
  room_id uuid references public.rooms (id) on delete set null,
  type text not null,               -- analyze | segment | generate | estimate
  status text not null default 'queued',
  input jsonb not null default '{}',
  output jsonb,
  error text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);
create index if not exists ai_jobs_project_idx on public.ai_jobs (project_id);

-- ---------------------------------------------------------------------------
-- updated_at trigger
-- ---------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

do $$
declare t text;
begin
  foreach t in array array[
    'profiles','clients','projects','rooms','design_scenarios','project_items','estimates',
    'products','product_market_prices','labor_rates','countries'
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
alter table public.rooms            enable row level security;
alter table public.project_images   enable row level security;
alter table public.design_scenarios enable row level security;
alter table public.project_items    enable row level security;
alter table public.estimates        enable row level security;
alter table public.estimate_items   enable row level security;
alter table public.settings         enable row level security;
alter table public.ai_jobs          enable row level security;

-- reference data: readable by everyone, writable by service role only
alter table public.countries             enable row level security;
alter table public.tax_rates             enable row level security;
alter table public.labor_rates           enable row level security;
alter table public.transport_rates       enable row level security;
alter table public.products              enable row level security;
alter table public.product_market_prices enable row level security;

create policy "reference read" on public.countries for select using (true);
create policy "reference read" on public.tax_rates for select using (true);
create policy "reference read" on public.labor_rates for select using (true);
create policy "reference read" on public.transport_rates for select using (true);
create policy "reference read" on public.products for select using (true);
create policy "reference read" on public.product_market_prices for select using (true);

create policy "own profile" on public.profiles
  for all using (id = auth.uid()) with check (id = auth.uid());

create policy "own clients" on public.clients
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "own projects" on public.projects
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "own settings" on public.settings
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- helper: does the current user own <project_id>?
create or replace function public.owns_project(pid uuid)
returns boolean language sql stable as $$
  select exists (select 1 from public.projects p where p.id = pid and p.user_id = auth.uid());
$$;

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
  for all using (
    exists (select 1 from public.estimates e where e.id = estimate_id and public.owns_project(e.project_id))
  )
  with check (
    exists (select 1 from public.estimates e where e.id = estimate_id and public.owns_project(e.project_id))
  );

-- ---------------------------------------------------------------------------
-- Auto-create a profile row on signup
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

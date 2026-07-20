create extension if not exists "pgcrypto";

create type public.app_role as enum ('admin', 'yard_manager', 'operator');
create type public.inventory_status as enum (
  'received',
  'available',
  'allocated',
  'in_process',
  'shipped',
  'quarantined'
);
create type public.work_order_status as enum (
  'draft',
  'scheduled',
  'in_progress',
  'complete',
  'cancelled'
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role public.app_role not null default 'operator',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.station_types (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  code text not null unique,
  description text,
  capacity integer check (capacity is null or capacity >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.inventory (
  id uuid primary key default gen_random_uuid(),
  lot_number text not null unique,
  owner_name text not null,
  pipe_type text not null,
  outside_diameter numeric(8, 3) not null check (outside_diameter > 0),
  weight_per_foot numeric(8, 2),
  grade text,
  connection_type text,
  length_range text,
  joint_count integer not null default 0 check (joint_count >= 0),
  total_length_feet numeric(12, 2) check (total_length_feet is null or total_length_feet >= 0),
  status public.inventory_status not null default 'received',
  yard_location text,
  current_station_type_id uuid references public.station_types(id),
  notes text,
  received_at timestamptz,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.work_orders (
  id uuid primary key default gen_random_uuid(),
  work_order_number text not null unique,
  customer_name text not null,
  inventory_id uuid references public.inventory(id),
  station_type_id uuid references public.station_types(id),
  description text not null,
  status public.work_order_status not null default 'draft',
  priority smallint not null default 3 check (priority between 1 and 5),
  scheduled_start timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  assigned_to uuid references auth.users(id),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.current_user_role()
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid()
$$;

revoke all on function public.current_user_role() from public;
grant execute on function public.current_user_role() to authenticated;

alter table public.profiles enable row level security;
alter table public.inventory enable row level security;
alter table public.work_orders enable row level security;
alter table public.station_types enable row level security;

create policy "users can read own profile"
on public.profiles for select
to authenticated
using (id = auth.uid() or public.current_user_role() = 'admin');

create policy "admins manage profiles"
on public.profiles for all
to authenticated
using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');

create policy "authenticated users read inventory"
on public.inventory for select
to authenticated
using (true);

create policy "yard leaders create inventory"
on public.inventory for insert
to authenticated
with check (public.current_user_role() in ('admin', 'yard_manager'));

create policy "yard staff update inventory"
on public.inventory for update
to authenticated
using (public.current_user_role() in ('admin', 'yard_manager', 'operator'))
with check (public.current_user_role() in ('admin', 'yard_manager', 'operator'));

create policy "admins delete inventory"
on public.inventory for delete
to authenticated
using (public.current_user_role() = 'admin');

create policy "authenticated users read work orders"
on public.work_orders for select
to authenticated
using (true);

create policy "yard leaders create work orders"
on public.work_orders for insert
to authenticated
with check (public.current_user_role() in ('admin', 'yard_manager'));

create policy "yard staff update work orders"
on public.work_orders for update
to authenticated
using (public.current_user_role() in ('admin', 'yard_manager', 'operator'))
with check (public.current_user_role() in ('admin', 'yard_manager', 'operator'));

create policy "admins delete work orders"
on public.work_orders for delete
to authenticated
using (public.current_user_role() = 'admin');

create policy "authenticated users read station types"
on public.station_types for select
to authenticated
using (true);

create policy "yard leaders create station types"
on public.station_types for insert
to authenticated
with check (public.current_user_role() in ('admin', 'yard_manager'));

create policy "yard leaders update station types"
on public.station_types for update
to authenticated
using (public.current_user_role() in ('admin', 'yard_manager'))
with check (public.current_user_role() in ('admin', 'yard_manager'));

create policy "admins delete station types"
on public.station_types for delete
to authenticated
using (public.current_user_role() = 'admin');

-- These policies are intentionally broad stubs for the scaffold. Before
-- production, narrow operator updates with RPCs or column-level grants so an
-- operator can only perform approved commands and assigned work.

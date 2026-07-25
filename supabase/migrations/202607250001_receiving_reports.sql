create type public.receiving_report_status as enum (
  'draft',
  'received',
  'verified',
  'cancelled'
);

create table public.receiving_reports (
  id uuid primary key default gen_random_uuid(),
  report_number text not null unique,
  customer_name text not null,
  rack_reference text not null,
  quantity_received integer not null check (quantity_received > 0),
  received_date date not null default current_date,
  notes text,
  status public.receiving_report_status not null default 'draft',
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index receiving_reports_received_date_idx
on public.receiving_reports (received_date desc);

create index receiving_reports_customer_name_idx
on public.receiving_reports (customer_name);

alter table public.receiving_reports enable row level security;

create policy "authenticated users read receiving reports"
on public.receiving_reports for select
to authenticated
using (true);

create policy "yard staff create receiving reports"
on public.receiving_reports for insert
to authenticated
with check (
  public.current_user_role() in ('admin', 'yard_manager', 'operator')
  and (created_by is null or created_by = auth.uid())
);

create policy "yard leaders update receiving reports"
on public.receiving_reports for update
to authenticated
using (public.current_user_role() in ('admin', 'yard_manager'))
with check (public.current_user_role() in ('admin', 'yard_manager'));

create policy "admins delete receiving reports"
on public.receiving_reports for delete
to authenticated
using (public.current_user_role() = 'admin');

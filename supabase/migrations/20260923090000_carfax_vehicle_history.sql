-- CARFAX vehicle history integration storage
create table if not exists public.vehicle_history_reports (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  provider text not null default 'CARFAX',
  vin text not null,
  report_status text not null default 'not_requested' check (report_status in ('not_requested','pending','available','unavailable','error')),
  fetched_at timestamptz,
  report_url text,
  summary jsonb not null default '{}'::jsonb,
  events jsonb not null default '[]'::jsonb,
  raw_response jsonb,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists vehicle_history_reports_vehicle_provider_uq on public.vehicle_history_reports(vehicle_id, provider);
create index if not exists vehicle_history_reports_shop_idx on public.vehicle_history_reports(shop_id);
alter table public.vehicle_history_reports enable row level security;
drop policy if exists "shop members can read vehicle history" on public.vehicle_history_reports;
create policy "shop members can read vehicle history" on public.vehicle_history_reports for select to authenticated
using (shop_id = (select shop_id from public.profiles where id = (select auth.uid()) and active = true));
drop policy if exists "shop members can insert vehicle history" on public.vehicle_history_reports;
create policy "shop members can insert vehicle history" on public.vehicle_history_reports for insert to authenticated
with check (shop_id = (select shop_id from public.profiles where id = (select auth.uid()) and active = true));
drop policy if exists "shop members can update vehicle history" on public.vehicle_history_reports;
create policy "shop members can update vehicle history" on public.vehicle_history_reports for update to authenticated
using (shop_id = (select shop_id from public.profiles where id = (select auth.uid()) and active = true))
with check (shop_id = (select shop_id from public.profiles where id = (select auth.uid()) and active = true));
grant select, insert, update on public.vehicle_history_reports to authenticated;

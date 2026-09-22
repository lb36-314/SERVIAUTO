alter table public.vehicles add column if not exists vin_verified_at timestamptz;
alter table public.vehicles add column if not exists vin_decoder_source text;
alter table public.vehicles add column if not exists vin_decoded jsonb;
alter table public.vehicles add column if not exists vin_warnings jsonb not null default '[]'::jsonb;
create index if not exists vehicles_vin_verified_idx on public.vehicles(vin_verified_at);

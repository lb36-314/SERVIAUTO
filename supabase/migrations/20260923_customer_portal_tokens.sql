create extension if not exists pgcrypto;
alter table public.estimates
  add column if not exists customer_portal_token_hash text,
  add column if not exists customer_portal_expires_at timestamptz;
create unique index if not exists estimates_customer_portal_token_hash_idx
  on public.estimates(customer_portal_token_hash)
  where customer_portal_token_hash is not null;

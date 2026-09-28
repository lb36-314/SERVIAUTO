-- SERVIAUTO first-run onboarding hardening
-- Keep one unambiguous bootstrap_shop RPC and expose it only to signed-in users.

drop function if exists public.bootstrap_shop(text,text,text,text);

create or replace function public.bootstrap_shop(
  business_name text,
  phone text default null,
  email text default null,
  address text default null,
  city text default null,
  state text default null,
  zip text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_shop uuid;
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  if exists(select 1 from public.profiles where id = current_user_id and shop_id is not null) then
    raise exception 'User already belongs to a shop';
  end if;

  if nullif(trim(business_name), '') is null then
    raise exception 'Business name is required';
  end if;

  insert into public.shops(business_name,phone,email,address,city,state,zip)
  values (trim(business_name),phone,email,address,city,state,zip)
  returning id into new_shop;

  update public.profiles
  set shop_id=new_shop, role='Owner', active=true, updated_at=now()
  where id=current_user_id;

  if not found then
    insert into public.profiles(id,shop_id,full_name,email,phone,role,active)
    values(current_user_id,new_shop,null,email,phone,'Owner',true);
  end if;

  return new_shop;
end;
$$;

revoke execute on function public.bootstrap_shop(text,text,text,text,text,text,text) from public;
revoke execute on function public.bootstrap_shop(text,text,text,text,text,text,text) from anon;
grant execute on function public.bootstrap_shop(text,text,text,text,text,text,text) to authenticated;

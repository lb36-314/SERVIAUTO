-- SERVIAUTO 1,000-point multipoint inspection
create table if not exists public.inspection_templates (
 id uuid primary key default gen_random_uuid(),
 shop_id uuid not null references public.shops(id) on delete cascade,
 name text not null,
 point_count integer not null default 0,
 active boolean not null default true,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(shop_id,name)
);
create table if not exists public.inspection_template_items (
 id uuid primary key default gen_random_uuid(),
 template_id uuid not null references public.inspection_templates(id) on delete cascade,
 sequence integer not null,
 category text not null,
 item text not null,
 result text not null default 'not_checked',
 measurement text,
 notes text,
 unique(template_id,sequence)
);
alter table public.inspection_templates enable row level security;
alter table public.inspection_template_items enable row level security;
drop policy if exists "shop members read inspection templates" on public.inspection_templates;
create policy "shop members read inspection templates" on public.inspection_templates for select to authenticated using (shop_id=(select shop_id from public.profiles where id=(select auth.uid()) and active=true));
drop policy if exists "shop members write inspection templates" on public.inspection_templates;
create policy "shop members write inspection templates" on public.inspection_templates for all to authenticated using (shop_id=(select shop_id from public.profiles where id=(select auth.uid()) and active=true)) with check (shop_id=(select shop_id from public.profiles where id=(select auth.uid()) and active=true));
drop policy if exists "shop members read inspection template items" on public.inspection_template_items;
create policy "shop members read inspection template items" on public.inspection_template_items for select to authenticated using (exists(select 1 from public.inspection_templates t where t.id=template_id and t.shop_id=(select shop_id from public.profiles where id=(select auth.uid()) and active=true)));
drop policy if exists "shop members write inspection template items" on public.inspection_template_items;
create policy "shop members write inspection template items" on public.inspection_template_items for all to authenticated using (exists(select 1 from public.inspection_templates t where t.id=template_id and t.shop_id=(select shop_id from public.profiles where id=(select auth.uid()) and active=true))) with check (exists(select 1 from public.inspection_templates t where t.id=template_id and t.shop_id=(select shop_id from public.profiles where id=(select auth.uid()) and active=true)));
grant select,insert,update,delete on public.inspection_templates,public.inspection_template_items to authenticated;
create or replace function public.ensure_1000_point_inspection_template(p_shop_id uuid)
returns uuid language plpgsql security definer set search_path=public as $$
declare tid uuid;
begin
 insert into public.inspection_templates(shop_id,name,point_count)
 values(p_shop_id,'SERVIAUTO 1,000-Point Multipoint Inspection',1000)
 on conflict(shop_id,name) do update set point_count=1000,active=true,updated_at=now()
 returning id into tid;
 if not exists(select 1 from public.inspection_template_items where template_id=tid) then
   insert into public.inspection_template_items(template_id,sequence,category,item)
   select tid,((a.ord-1)*10+c.ord),a.area,c.check_name
   from unnest(array[
   'Exterior body','Glass','Wipers','Mirrors','Lighting','Horn','Locks','Handles','Doors','Hood','Trunk','Fuel door','Sunroof','Convertible top','Seats','Seat belts','Airbags','Dashboard','Gauges','Warning lamps',
   'Climate control','Heater','Air conditioning','Defroster','Blower motor','Cabin filter','HVAC vents','Audio','Navigation','Cameras','Parking sensors','ADAS','Blind spot system','Lane departure system','Adaptive cruise','Collision warning','Parking brake','Service brake','Brake pedal','Brake booster',
   'Master cylinder','ABS','Traction control','Brake lines','Brake hoses','Calipers','Rotors','Drums','Wheel bearings','Hub assemblies','Tires','TPMS','Wheels','Alignment','Steering wheel','Steering column','Power steering','Tie rods','Ball joints',
   'Control arms','Bushings','Struts','Shock absorbers','Springs','Sway bars','CV axles','Drive shafts','Differential','Transfer case','Driveshaft joints','Transmission','Transmission fluid','Clutch','Torque converter','Engine oil','Oil filter','Cooling system','Radiator','Water pump',
   'Thermostat','Cooling fans','Hoses','Belts','Timing components','Battery','Alternator','Starter','Charging system','Fuses','Relays','Wiring','Grounds','Spark plugs','Ignition coils','Fuel system','Fuel pump','Injectors','Air intake','Throttle body',
   'Exhaust','Catalytic converter','Emissions','Oxygen sensors','Engine mounts','Transmission mounts','Leaks','Fluids','Undercarriage','Road test'
   ]::text[]) with ordinality a(area,ord)
   cross join lateral unnest(array['Condition','Operation','Wear','Damage','Mounting','Connections','Fluid/Leak condition','Measurement/Adjustment','Safety/Function check','Technician notes']::text[]) with ordinality c(check_name,ord);
 end if;
 return tid;
end $$;
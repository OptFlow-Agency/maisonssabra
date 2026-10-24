-- Admin dashboard: roles, richer catalogue, image storage. Run AFTER 20261023000000_orders.sql.
--
-- FIRST ADMIN (do this once, after creating the user in Supabase > Authentication > Users):
--   insert into public.admins (user_id) select id from auth.users where email = 'YOU@EXAMPLE.COM';
-- Also turn OFF "Allow new users to sign up" in Authentication > Sign In / Providers.

create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);
alter table public.admins enable row level security;
drop policy if exists "admins read themselves" on public.admins;
create policy "admins read themselves" on public.admins for select to authenticated using (user_id = auth.uid());

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.admins where user_id = auth.uid()) $$;
grant execute on function public.is_admin() to anon, authenticated;

-- Richer catalogue ------------------------------------------------------------
alter table public.products
  add column if not exists collection  text not null default 'bladi',
  add column if not exists description text not null default '',
  add column if not exists image2      text,
  add column if not exists alt         text not null default '',
  add column if not exists was_price   integer,
  add column if not exists is_new      boolean not null default false,
  add column if not exists sort_order  integer not null default 0,
  add column if not exists created_at  timestamptz not null default now();

do $$ begin
  alter table public.products add constraint products_collection_check check (collection in ('bladi','zman'));
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.products add constraint products_slug_check check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$');
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.products add constraint products_was_price_check check (was_price is null or was_price > price);
exception when duplicate_object then null; end $$;

-- `image` / `image2` hold the BASE image: a site path (/maisonsabra/x.webp) or a full Storage URL.
-- Responsive copies live next to it as x-480.webp and x-800.webp (the dashboard generates all three).
update public.products p set
  collection = v.collection, was_price = v.was_price, image = v.image, image2 = v.image2,
  alt = v.alt, is_new = v.is_new, sort_order = v.sort_order
from (values
  ('azerwal', 'bladi', 890, '/maisonsabra/Azerwal-sac-3-_ms-1000x999.webp', '/maisonsabra/alt/azerwal.webp', 'Sac Azerwal en cuir bleu ciel, rabat clouté et tissu berbère rayé', false, 10),
  ('tazult', 'bladi', 890, '/maisonsabra/Tazult-sac-11-_ms-1000x999.webp', '/maisonsabra/alt/tazult.webp', 'Sac Tazult en cuir violet et tissu berbère rayé', false, 20),
  ('awray', 'bladi', 890, '/maisonsabra/Awray-sac-1-_ms-1000x999.webp', '/maisonsabra/alt/awray.webp', 'Sac Awray en cuir jaune moutarde et tissu berbère rayé', false, 30),
  ('zman-multicolore', 'zman', 890, '/maisonsabra/083A5723-_ms-1000x988.webp', '/maisonsabra/alt/multicolore.webp', 'Sac Z’man en velours multicolore rehaussé de dorures, chaîne dorée', false, 40),
  ('zman-vert', 'zman', 945, '/maisonsabra/083A5723ms-verte-_ms-1000x988.webp', '/maisonsabra/alt/vert.webp', 'Sac Z’man en velours vert sur tissu doré, chaîne dorée', false, 50),
  ('zman-beige', 'zman', 949, '/maisonsabra/083A5723ms-blan-casser-_ms-1000x988.webp', '/maisonsabra/alt/beige.webp', 'Sac Z’man en velours beige brodé de fils dorés, chaîne dorée', false, 60),
  ('zman-rouge', 'zman', 990, '/maisonsabra/083A5723ms-rouge-_ms-1000x988.webp', null, 'Sac Z’man en velours rouge à motifs sur tissu doré, chaîne dorée', false, 70),
  ('zman-violet', 'zman', 890, '/maisonsabra/083A5538-_ms-1000x988.webp', '/maisonsabra/alt/violet.webp', 'Sac Z’man violet royal en velours relief doré, chaîne dorée', true, 80)
) as v(slug, collection, was_price, image, image2, alt, is_new, sort_order)
where p.slug = v.slug;

-- Policies --------------------------------------------------------------------
drop policy if exists "catalogue is public" on public.products;
drop policy if exists "catalogue read" on public.products;
create policy "catalogue read"   on public.products for select to anon, authenticated using (active or public.is_admin());
drop policy if exists "admins insert products" on public.products;
create policy "admins insert products" on public.products for insert to authenticated with check (public.is_admin());
drop policy if exists "admins update products" on public.products;
create policy "admins update products" on public.products for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admins delete products" on public.products;
create policy "admins delete products" on public.products for delete to authenticated using (public.is_admin());

drop policy if exists "admins read orders" on public.orders;
create policy "admins read orders" on public.orders for select to authenticated using (public.is_admin());
drop policy if exists "admins update orders" on public.orders;
create policy "admins update orders" on public.orders for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admins read order items" on public.order_items;
create policy "admins read order items" on public.order_items for select to authenticated using (public.is_admin());

-- Image storage -----------------------------------------------------------------
insert into storage.buckets (id, name, public) values ('product-images', 'product-images', true)
on conflict (id) do nothing;
drop policy if exists "admins upload product images" on storage.objects;
create policy "admins upload product images" on storage.objects for insert to authenticated
  with check (bucket_id = 'product-images' and public.is_admin());
drop policy if exists "admins update product images" on storage.objects;
create policy "admins update product images" on storage.objects for update to authenticated
  using (bucket_id = 'product-images' and public.is_admin());
drop policy if exists "admins delete product images" on storage.objects;
create policy "admins delete product images" on storage.objects for delete to authenticated
  using (bucket_id = 'product-images' and public.is_admin());

-- place_order: snapshot an absolute 800px image URL for each line ----------------
create or replace function public.place_order(
  p_first_name text, p_last_name text, p_phone text, p_address text, p_city text, p_items jsonb
) returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_order_id uuid;
  v_number   bigint;
  v_total    integer;
begin
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) not between 1 and 30 then
    raise exception 'invalid_items';
  end if;

  create temporary table _lines on commit drop as
    select pr.slug, pr.name, pr.price,
           regexp_replace(case when pr.image like 'http%' then pr.image else 'https://maisonsabra.ma' || pr.image end, '\.webp$', '-800.webp') as image,
           least(sum((i->>'qty')::int), 9)::int as qty
    from jsonb_array_elements(p_items) i
    join public.products pr on pr.slug = i->>'slug' and pr.active
    where (i->>'qty')::int between 1 and 9
    group by pr.slug, pr.name, pr.price, pr.image;

  if not exists (select 1 from _lines) then raise exception 'invalid_items'; end if;
  select sum(price * qty) into v_total from _lines;

  insert into public.orders (first_name, last_name, phone, address, city, total)
  values (trim(p_first_name), trim(p_last_name), trim(p_phone), trim(p_address), trim(p_city), v_total)
  returning id, order_number into v_order_id, v_number;

  insert into public.order_items (order_id, product_slug, product_name, product_image, quantity, unit_price, line_total)
  select v_order_id, slug, name, image, qty, price, price * qty from _lines;

  return jsonb_build_object('order_number', v_number, 'total', v_total);
end;
$$;
revoke all on function public.place_order(text, text, text, text, text, jsonb) from public;
grant execute on function public.place_order(text, text, text, text, text, jsonb) to anon, authenticated;

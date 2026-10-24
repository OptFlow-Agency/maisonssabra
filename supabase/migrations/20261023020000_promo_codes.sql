-- Promo codes: a percentage off, valid only on the products it is attached to. Run AFTER 20261023010000_admin.sql.

create table if not exists public.promo_codes (
  code        text primary key check (code ~ '^[A-Z0-9]{3,20}$'),
  percent     integer not null check (percent between 1 and 90),
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

create table if not exists public.promo_code_products (
  code          text not null references public.promo_codes(code)   on delete cascade on update cascade,
  product_slug  text not null references public.products(slug)      on delete cascade on update cascade,
  primary key (code, product_slug)
);

alter table public.promo_codes         enable row level security;
alter table public.promo_code_products enable row level security;

-- Visitors get no access to the tables: they can only test a code through apply_promo() below.
drop policy if exists "admins manage promo codes" on public.promo_codes;
create policy "admins manage promo codes" on public.promo_codes for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admins manage promo products" on public.promo_code_products;
create policy "admins manage promo products" on public.promo_code_products for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Orders remember what was applied --------------------------------------------------
alter table public.orders
  add column if not exists subtotal   integer,
  add column if not exists discount   integer not null default 0,
  add column if not exists promo_code text;
update public.orders set subtotal = total where subtotal is null;

-- Dashboard: create or update a code and replace its products in ONE transaction ------
create or replace function public.save_promo(p_code text, p_percent integer, p_active boolean, p_slugs text[], p_create boolean)
returns void
language plpgsql security definer set search_path = public
as $$
declare v_code text := upper(trim(p_code));
begin
  if not public.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  if coalesce(array_length(p_slugs, 1), 0) = 0 then raise exception 'no_products'; end if;

  if p_create then
    if exists (select 1 from public.promo_codes where code = v_code) then raise exception 'exists' using errcode = '23505'; end if;
    insert into public.promo_codes (code, percent, active) values (v_code, p_percent, p_active);
  else
    update public.promo_codes set percent = p_percent, active = p_active where code = v_code;
    if not found then raise exception 'not_found'; end if;
  end if;

  delete from public.promo_code_products where code = v_code;
  insert into public.promo_code_products (code, product_slug)
  select v_code, s from unnest(p_slugs) s;
end;
$$;
revoke all on function public.save_promo(text, integer, boolean, text[], boolean) from public;
grant execute on function public.save_promo(text, integer, boolean, text[], boolean) to authenticated;

-- Checkout: how much would this code take off this cart? NULL = not valid (unknown, off, or no eligible product).
create or replace function public.apply_promo(p_code text, p_items jsonb)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_code     text := upper(trim(coalesce(p_code, '')));
  v_percent  integer;
  v_discount integer;
begin
  if v_code = '' or jsonb_typeof(p_items) <> 'array' then return null; end if;
  select percent into v_percent from public.promo_codes where code = v_code and active;
  if v_percent is null then return null; end if;

  select coalesce(sum(floor(pr.price * q.qty * v_percent / 100.0)), 0)::integer into v_discount
  from (
    select i->>'slug' as slug, least(sum((i->>'qty')::int), 9) as qty
    from jsonb_array_elements(p_items) i
    where (i->>'qty')::int between 1 and 9
    group by 1
  ) q
  join public.products pr on pr.slug = q.slug and pr.active
  join public.promo_code_products pcp on pcp.code = v_code and pcp.product_slug = q.slug;

  if v_discount <= 0 then return null; end if;
  return jsonb_build_object('percent', v_percent, 'discount', v_discount);
end;
$$;
revoke all on function public.apply_promo(text, jsonb) from public;
grant execute on function public.apply_promo(text, jsonb) to anon, authenticated;

-- place_order: same as before, plus an optional promo code recomputed on the server ---------
drop function if exists public.place_order(text, text, text, text, text, jsonb);

create or replace function public.place_order(
  p_first_name text, p_last_name text, p_phone text, p_address text, p_city text, p_items jsonb,
  p_promo text default null
) returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_order_id uuid;
  v_number   bigint;
  v_subtotal integer;
  v_discount integer := 0;
  v_code     text := nullif(upper(trim(coalesce(p_promo, ''))), '');
  v_promo    jsonb;
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
  select sum(price * qty) into v_subtotal from _lines;

  if v_code is not null then
    v_promo := public.apply_promo(v_code, p_items);
    if v_promo is null then raise exception 'invalid_promo'; end if;
    v_discount := (v_promo->>'discount')::integer;
  end if;

  insert into public.orders (first_name, last_name, phone, address, city, subtotal, discount, promo_code, total)
  values (trim(p_first_name), trim(p_last_name), trim(p_phone), trim(p_address), trim(p_city), v_subtotal, v_discount, v_code, v_subtotal - v_discount)
  returning id, order_number into v_order_id, v_number;

  insert into public.order_items (order_id, product_slug, product_name, product_image, quantity, unit_price, line_total)
  select v_order_id, slug, name, image, qty, price, price * qty from _lines;

  return jsonb_build_object('order_number', v_number, 'total', v_subtotal - v_discount, 'discount', v_discount);
end;
$$;
revoke all on function public.place_order(text, text, text, text, text, jsonb, text) from public;
grant execute on function public.place_order(text, text, text, text, text, jsonb, text) to anon, authenticated;

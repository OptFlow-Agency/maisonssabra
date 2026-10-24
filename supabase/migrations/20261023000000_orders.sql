-- Maison Sabra orders. Run once in the Supabase SQL editor (or `supabase db push`).
-- Orders are written ONLY through place_order(): the browser never touches orders/order_items
-- directly, and prices come from `products`, never from the client.

create table if not exists public.products (
  slug    text primary key,
  name    text not null,
  price   integer not null check (price > 0),   -- MAD
  image   text not null,
  active  boolean not null default true
);

create table if not exists public.orders (
  id            uuid primary key default gen_random_uuid(),
  order_number  bigint generated always as identity (start with 1001) unique,
  first_name    text not null check (char_length(first_name) between 1 and 80),
  last_name     text not null check (char_length(last_name)  between 1 and 80),
  phone         text not null check (char_length(phone)      between 6 and 24),
  address       text not null check (char_length(address)    between 5 and 300),
  city          text not null check (char_length(city)       between 2 and 80),
  total         integer not null check (total > 0),            -- MAD
  status        text not null default 'new' check (status in ('new','confirmed','shipped','delivered','cancelled')),
  created_at    timestamptz not null default now()
);

create table if not exists public.order_items (
  id             uuid primary key default gen_random_uuid(),
  order_id       uuid not null references public.orders(id) on delete cascade,
  product_slug   text not null,
  product_name   text not null,   -- snapshot at order time
  product_image  text not null,   -- snapshot at order time
  quantity       integer not null check (quantity between 1 and 9),
  unit_price     integer not null,
  line_total     integer not null
);
create index if not exists order_items_order_id_idx on public.order_items(order_id);
create index if not exists orders_created_at_idx on public.orders(created_at desc);

alter table public.products    enable row level security;
alter table public.orders      enable row level security;
alter table public.order_items enable row level security;

-- Visitors may read the active catalogue. They get no policy at all on orders / order_items.
drop policy if exists "catalogue is public" on public.products;
create policy "catalogue is public" on public.products for select to anon, authenticated using (active);

create or replace function public.place_order(
  p_first_name text, p_last_name text, p_phone text, p_address text, p_city text, p_items jsonb
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id uuid;
  v_number   bigint;
  v_total    integer;
begin
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) not between 1 and 30 then
    raise exception 'invalid_items';
  end if;

  -- Merge duplicate slugs, validate quantities, price from the catalogue.
  create temporary table _lines on commit drop as
    select pr.slug, pr.name, pr.image, pr.price, least(sum((i->>'qty')::int), 9)::int as qty
    from jsonb_array_elements(p_items) i
    join public.products pr on pr.slug = i->>'slug' and pr.active
    where (i->>'qty')::int between 1 and 9
    group by pr.slug, pr.name, pr.image, pr.price;

  if not exists (select 1 from _lines) then
    raise exception 'invalid_items';
  end if;

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

-- Catalogue seed (mirrors src/data/products.ts; re-run the upsert when prices change).
insert into public.products (slug, name, price, image) values
  ('azerwal', 'Sac Azerwal en cuir bleu ciel et tissu berbère', 549, 'https://maisonsabra.ma/maisonsabra/Azerwal-sac-3-_ms-1000x999-800.webp'),
  ('tazult', 'Sac Tazult en cuir et tissu berbère', 549, 'https://maisonsabra.ma/maisonsabra/Tazult-sac-11-_ms-1000x999-800.webp'),
  ('awray', 'Sac Awray en cuir et tissu berbère', 549, 'https://maisonsabra.ma/maisonsabra/Awray-sac-1-_ms-1000x999-800.webp'),
  ('zman-multicolore', 'Sac Z’man – Tissu velours multicolore & dorures', 549, 'https://maisonsabra.ma/maisonsabra/083A5723-_ms-1000x988-800.webp'),
  ('zman-vert', 'Sac Z’man – Velours vert & tissu doré', 549, 'https://maisonsabra.ma/maisonsabra/083A5723ms-verte-_ms-1000x988-800.webp'),
  ('zman-beige', 'Sac Z’man – Velours beige brodé doré', 549, 'https://maisonsabra.ma/maisonsabra/083A5723ms-blan-casser-_ms-1000x988-800.webp'),
  ('zman-rouge', 'Sac Z’man – Velours rouge & tissu doré', 549, 'https://maisonsabra.ma/maisonsabra/083A5723ms-rouge-_ms-1000x988-800.webp'),
  ('zman-violet', 'Sac Z’man – Violet royal & doré en velours relief', 549, 'https://maisonsabra.ma/maisonsabra/083A5538-_ms-1000x988-800.webp')
on conflict (slug) do update set name = excluded.name, price = excluded.price, image = excluded.image;

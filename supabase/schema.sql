-- Margarita's Glow - esquema inicial para Supabase/PostgreSQL.
-- Ejecutar completo en Supabase SQL Editor. Las funciones sensibles tienen SECURITY DEFINER
-- y search_path fijo; no se conceden permisos de lectura pública a datos de clientes/pedidos.

create extension if not exists pgcrypto with schema extensions;

create table if not exists public.app_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.app_admins a
    where a.user_id = auth.uid() and a.is_active = true
  );
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  sku text not null unique,
  slug text not null unique,
  name text not null,
  brand text,
  description text,
  price integer not null check (price >= 0),
  compare_at_price integer check (compare_at_price is null or compare_at_price > price),
  stock integer not null default 0 check (stock >= 0),
  image_urls text[] not null default '{}',
  category_id uuid references public.categories(id) on delete set null,
  is_active boolean not null default false,
  is_featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists products_active_created_idx on public.products(is_active, created_at desc);
create index if not exists products_category_idx on public.products(category_id);
create index if not exists products_name_idx on public.products using gin (to_tsvector('simple', coalesce(name,'') || ' ' || coalesce(brand,'')));

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text not null,
  phone_normalized text not null unique,
  department text not null,
  locality text not null,
  address text,
  postal_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.customers(id) on delete set null,
  order_number text not null unique,
  access_token uuid not null default gen_random_uuid(),
  customer_name text not null,
  customer_phone text not null,
  customer_department text not null,
  customer_locality text not null,
  customer_address text,
  customer_postal_code text,
  shipping_company text not null check (shipping_company in ('La Nave','UES','Norteño','Correo Uruguayo','Otra empresa')),
  shipping_other text,
  notes text,
  payment_method text not null check (payment_method in ('transferencia')),
  payment_status text not null default 'pendiente' check (payment_status in ('pendiente','confirmado','reembolsado')),
  status text not null default 'pendiente_confirmacion' check (status in ('pendiente_confirmacion','pendiente_pago','pago_confirmado','en_preparacion','enviado','entregado','cancelado')),
  total integer not null default 0 check (total >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists orders_created_idx on public.orders(created_at desc);
create index if not exists customers_name_idx on public.customers(full_name);
create index if not exists customers_updated_idx on public.customers(updated_at desc);
create index if not exists orders_status_idx on public.orders(status, payment_status);

-- Keep the SQL safe to rerun against a development database created by an earlier iteration.
alter table public.orders add column if not exists customer_id uuid references public.customers(id) on delete set null;

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  sku text not null,
  product_name text not null,
  quantity integer not null check (quantity > 0),
  unit_price integer not null check (unit_price >= 0),
  line_total integer not null check (line_total >= 0),
  created_at timestamptz not null default now()
);
create index if not exists order_items_order_idx on public.order_items(order_id);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete set null,
  order_id uuid references public.orders(id) on delete set null,
  display_name text not null check (char_length(display_name) between 2 and 80),
  rating integer not null check (rating between 1 and 5),
  comment text not null check (char_length(comment) between 5 and 1000),
  is_verified boolean not null default false,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now()
);
create index if not exists reviews_product_status_idx on public.reviews(product_id, status, created_at desc);

create table if not exists public.store_settings (
  id integer primary key default 1 check (id = 1),
  phone text not null default '099 782 589',
  instagram_url text not null default 'https://www.instagram.com/margaritasglow.uy/',
  shipping_message text not null default 'Coordinamos la empresa de transporte y el costo antes de confirmar la entrega. Sin tarifas inventadas ni sorpresas.',
  faqs jsonb not null default '[]'::jsonb,
  policies jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

insert into public.categories (name,slug) values
  ('Maquillaje de rostro','maquillaje-de-rostro'),
  ('Ojos','ojos'),
  ('Labios','labios'),
  ('Herramientas de belleza','herramientas-de-belleza'),
  ('Skincare','skincare'),
  ('Accesorios','accesorios'),
  ('Combos','combos')
on conflict (slug) do nothing;

insert into public.store_settings (id, faqs, policies) values (
  1,
  '[
    {"question":"¿Cómo realizo una compra?","answer":"Elegí productos, agregalos al carrito y completá tus datos. Después coordinaremos el envío y el pago."},
    {"question":"¿Hacen envíos a todo Uruguay?","answer":"Recibimos pedidos desde todo el país. La empresa disponible se coordina según tu destino."},
    {"question":"¿Qué empresas de transporte puedo elegir?","answer":"Podés indicar La Nave, UES, Norteño, Correo Uruguayo u otra empresa; la preferencia está sujeta a disponibilidad."},
    {"question":"¿Cómo se confirma el costo del envío?","answer":"El costo queda pendiente hasta verificar el destino y la empresa de transporte."},
    {"question":"¿Cuáles son los medios de pago?","answer":"El método inicial es la transferencia bancaria manual. El pago se confirma cuando la tienda revisa el comprobante."},
    {"question":"¿Cómo envío el comprobante?","answer":"Podés enviarlo por WhatsApp al canal de contacto del negocio."},
    {"question":"¿Qué pasa si un producto está agotado?","answer":"El catálogo informa los productos agotados y el stock se vuelve a comprobar al crear el pedido."},
    {"question":"¿Cómo me comunico con la tienda?","answer":"Por WhatsApp al 099 782 589 o por Instagram @margaritasglow.uy."}
  ]'::jsonb,
  '[
    {"title":"Compras y confirmación","body":"Enviar el formulario registra un pedido; no significa que el pago esté confirmado."},
    {"title":"Envíos","body":"La empresa y el costo de envío se confirman según el destino antes de coordinar la entrega."},
    {"title":"Cambios, devoluciones y privacidad","body":"La propietaria debe revisar y completar estas políticas antes de publicar la tienda. Este texto es una base de trabajo, no un dictamen legal."}
  ]'::jsonb
) on conflict (id) do nothing;

-- Updated_at helper for editable records.
create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = public, pg_temp as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at before update on public.products for each row execute function public.set_updated_at();
drop trigger if exists orders_set_updated_at on public.orders;
create trigger orders_set_updated_at before update on public.orders for each row execute function public.set_updated_at();
drop trigger if exists customers_set_updated_at on public.customers;
create trigger customers_set_updated_at before update on public.customers for each row execute function public.set_updated_at();
drop trigger if exists settings_set_updated_at on public.store_settings;
create trigger settings_set_updated_at before update on public.store_settings for each row execute function public.set_updated_at();

-- Cancelling releases the stock reservation exactly once. A cancelled order is terminal.
create or replace function public.handle_order_cancellation()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if old.status = 'cancelado' and new.status <> 'cancelado' then
    raise exception 'Un pedido cancelado no se puede reactivar.' using errcode = 'P0001';
  end if;
  if old.status <> 'cancelado' and new.status = 'cancelado' then
    update public.products p
       set stock = p.stock + oi.quantity
      from public.order_items oi
     where oi.order_id = old.id and oi.product_id = p.id;
  end if;
  return new;
end;
$$;
drop trigger if exists orders_cancel_stock on public.orders;
create trigger orders_cancel_stock before update of status on public.orders for each row execute function public.handle_order_cancellation();

-- Creates the order using database prices/stock, row locks and one transaction.
-- The caller never supplies prices, totals, payment status or order status.
create or replace function public.place_order(
  p_customer jsonb,
  p_items jsonb,
  p_shipping_company text,
  p_shipping_other text default null,
  p_notes text default null,
  p_payment_method text default 'transferencia'
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_item record;
  v_product public.products%rowtype;
  v_lines jsonb := '[]'::jsonb;
  v_line jsonb;
  v_total bigint := 0;
  v_total_quantity integer := 0;
  v_order_id uuid;
  v_customer_id uuid;
  v_phone_normalized text;
  v_order_number text;
  v_access_token uuid := gen_random_uuid();
  v_shipping_other text;
  v_result_items jsonb;
begin
  if jsonb_typeof(p_customer) <> 'object' then raise exception 'CUSTOMER_INVALID' using errcode = 'P0001'; end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) < 1 or jsonb_array_length(p_items) > 40 then
    raise exception 'ITEMS_INVALID' using errcode = 'P0001';
  end if;
  if length(btrim(coalesce(p_customer->>'full_name',''))) < 2 or length(coalesce(p_customer->>'full_name','')) > 100
     or length(btrim(coalesce(p_customer->>'phone',''))) < 7 or length(coalesce(p_customer->>'phone','')) > 30
     or length(btrim(coalesce(p_customer->>'department',''))) < 2 or length(coalesce(p_customer->>'department','')) > 80
     or length(btrim(coalesce(p_customer->>'locality',''))) < 2 or length(coalesce(p_customer->>'locality','')) > 100
     or length(coalesce(p_customer->>'address','')) > 200 or length(coalesce(p_customer->>'postal_code','')) > 20 then
    raise exception 'CUSTOMER_INVALID' using errcode = 'P0001';
  end if;
  if p_shipping_company not in ('La Nave','UES','Norteño','Correo Uruguayo','Otra empresa') then raise exception 'SHIPPING_INVALID' using errcode = 'P0001'; end if;
  if p_shipping_company = 'Otra empresa' and length(btrim(coalesce(p_shipping_other,''))) < 2 then raise exception 'SHIPPING_OTHER_REQUIRED' using errcode = 'P0001'; end if;
  if length(coalesce(p_notes,'')) > 1000 then raise exception 'NOTES_INVALID' using errcode = 'P0001'; end if;
  if p_payment_method <> 'transferencia' then raise exception 'PAYMENT_METHOD_INVALID' using errcode = 'P0001'; end if;

  -- Aggregate duplicate lines and lock products in a consistent order to reduce deadlocks.
  for v_item in
    select x.product_id, sum(x.quantity)::integer as quantity
      from jsonb_to_recordset(p_items) as x(product_id uuid, quantity integer)
     group by x.product_id
     order by x.product_id
  loop
    if v_item.quantity is null or v_item.quantity < 1 or v_item.quantity > 20 then raise exception 'QUANTITY_INVALID' using errcode = 'P0001'; end if;
    v_total_quantity := v_total_quantity + v_item.quantity;
    if v_total_quantity > 80 then raise exception 'ORDER_QUANTITY_LIMIT' using errcode = 'P0001'; end if;
    select * into v_product from public.products where id = v_item.product_id for update;
    if not found or v_product.is_active is not true then raise exception 'PRODUCT_UNAVAILABLE' using errcode = 'P0001'; end if;
    if v_product.stock < v_item.quantity then raise exception 'STOCK_INSUFFICIENT' using errcode = 'P0001'; end if;
    v_total := v_total + (v_product.price::bigint * v_item.quantity);
    v_lines := v_lines || jsonb_build_array(jsonb_build_object(
      'product_id',v_product.id,
      'sku',v_product.sku,
      'product_name',v_product.name,
      'unit_price',v_product.price,
      'quantity',v_item.quantity,
      'line_total',(v_product.price::bigint * v_item.quantity)
    ));
  end loop;
  if v_total > 2147483647 then raise exception 'ORDER_TOTAL_LIMIT' using errcode = 'P0001'; end if;

  v_phone_normalized := regexp_replace(btrim(p_customer->>'phone'), '\D', '', 'g');
  if length(v_phone_normalized) < 7 or length(v_phone_normalized) > 20 then
    raise exception 'CUSTOMER_INVALID' using errcode = 'P0001';
  end if;

  insert into public.customers (full_name, phone, phone_normalized, department, locality, address, postal_code)
  values (
    btrim(p_customer->>'full_name'), btrim(p_customer->>'phone'), v_phone_normalized,
    btrim(p_customer->>'department'), btrim(p_customer->>'locality'),
    nullif(btrim(coalesce(p_customer->>'address','')),''),
    nullif(btrim(coalesce(p_customer->>'postal_code','')),'')
  )
  on conflict (phone_normalized) do update set
    full_name = excluded.full_name, phone = excluded.phone, department = excluded.department,
    locality = excluded.locality, address = excluded.address, postal_code = excluded.postal_code, updated_at = now()
  returning id into v_customer_id;

  v_order_number := 'MG-' || to_char(now(),'YYYYMMDD') || '-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,6));
  v_shipping_other := case when p_shipping_company = 'Otra empresa' then nullif(btrim(p_shipping_other),'') else null end;

  insert into public.orders (
    customer_id, order_number, access_token, customer_name, customer_phone, customer_department,
    customer_locality, customer_address, customer_postal_code,
    shipping_company, shipping_other, notes, payment_method, payment_status, status, total
  ) values (
    v_customer_id, v_order_number, v_access_token,
    btrim(p_customer->>'full_name'), btrim(p_customer->>'phone'), btrim(p_customer->>'department'),
    btrim(p_customer->>'locality'), nullif(btrim(coalesce(p_customer->>'address','')),''),
    nullif(btrim(coalesce(p_customer->>'postal_code','')),''),
    p_shipping_company, v_shipping_other, nullif(btrim(coalesce(p_notes,'')),''),
    'transferencia', 'pendiente', 'pendiente_confirmacion', v_total::integer
  ) returning id into v_order_id;

  for v_line in select value from jsonb_array_elements(v_lines)
  loop
    insert into public.order_items(order_id,product_id,sku,product_name,quantity,unit_price,line_total)
    values (v_order_id, (v_line->>'product_id')::uuid, v_line->>'sku', v_line->>'product_name',
            (v_line->>'quantity')::integer, (v_line->>'unit_price')::integer, (v_line->>'line_total')::integer);
    update public.products set stock = stock - (v_line->>'quantity')::integer where id = (v_line->>'product_id')::uuid;
  end loop;

  select coalesce(jsonb_agg(jsonb_build_object(
    'product_id',oi.product_id,'sku',oi.sku,'product_name',oi.product_name,
    'quantity',oi.quantity,'unit_price',oi.unit_price,'line_total',oi.line_total
  ) order by oi.created_at), '[]'::jsonb)
  into v_result_items from public.order_items oi where oi.order_id = v_order_id;

  return jsonb_build_object(
    'order_number',v_order_number,
    'access_token',v_access_token,
    'total',v_total,
    'items',v_result_items,
    'status','pendiente_confirmacion'
  );
end;
$$;

-- This function exposes only minimal order/payment data when both order number and secret token match.
create or replace function public.get_order_payment_access(p_order_number text, p_access_token uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_order public.orders%rowtype;
  v_items jsonb;
begin
  select * into v_order from public.orders
   where order_number = p_order_number and access_token = p_access_token;
  if not found then return null; end if;
  select coalesce(jsonb_agg(jsonb_build_object('product_name',oi.product_name,'quantity',oi.quantity,'unit_price',oi.unit_price,'line_total',oi.line_total) order by oi.created_at),'[]'::jsonb)
    into v_items from public.order_items oi where oi.order_id = v_order.id;
  return jsonb_build_object(
    'order_number',v_order.order_number,
    'payment_method',v_order.payment_method,
    'payment_status',v_order.payment_status,
    'status',v_order.status,
    'total',v_order.total,
    'items',v_items
  );
end;
$$;

revoke all on function public.place_order(jsonb,jsonb,text,text,text,text) from public;
grant execute on function public.place_order(jsonb,jsonb,text,text,text,text) to anon, authenticated;
revoke all on function public.get_order_payment_access(text,uuid) from public;
grant execute on function public.get_order_payment_access(text,uuid) to anon, authenticated;

-- Row Level Security.
alter table public.app_admins enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.customers enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.reviews enable row level security;
alter table public.store_settings enable row level security;

drop policy if exists "Admins can read app_admins" on public.app_admins;
create policy "Admins can read app_admins" on public.app_admins for select to authenticated using (public.is_admin());
-- Administrator membership is assigned from the Supabase SQL editor by the project owner.
-- Authenticated admins cannot grant themselves or others a new administrator role through the public API.
drop policy if exists "Admins manage app_admins" on public.app_admins;

drop policy if exists "Public can read active categories" on public.categories;
create policy "Public can read active categories" on public.categories for select to anon, authenticated using (is_active = true or public.is_admin());
drop policy if exists "Admins manage categories" on public.categories;
create policy "Admins manage categories" on public.categories for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Public can read active products" on public.products;
create policy "Public can read active products" on public.products for select to anon, authenticated using (is_active = true or public.is_admin());
drop policy if exists "Admins manage products" on public.products;
create policy "Admins manage products" on public.products for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Only admins can read customers" on public.customers;
create policy "Only admins can read customers" on public.customers for select to authenticated using (public.is_admin());
drop policy if exists "Only admins can manage customers" on public.customers;
create policy "Only admins can manage customers" on public.customers for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Only admins can read orders" on public.orders;
create policy "Only admins can read orders" on public.orders for select to authenticated using (public.is_admin());
drop policy if exists "Only admins can update orders" on public.orders;
create policy "Only admins can update orders" on public.orders for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "Only admins can delete orders" on public.orders;
create policy "Only admins can delete orders" on public.orders for delete to authenticated using (public.is_admin());

drop policy if exists "Only admins can read order items" on public.order_items;
create policy "Only admins can read order items" on public.order_items for select to authenticated using (public.is_admin());
drop policy if exists "Only admins can manage order items" on public.order_items;
create policy "Only admins can manage order items" on public.order_items for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Public can read approved reviews" on public.reviews;
create policy "Public can read approved reviews" on public.reviews for select to anon, authenticated using (status = 'approved' or public.is_admin());
drop policy if exists "Public can submit pending reviews" on public.reviews;
create policy "Public can submit pending reviews" on public.reviews for insert to anon, authenticated
with check (
  status = 'pending' and is_verified = false and order_id is null
  and exists (select 1 from public.products p where p.id = product_id and p.is_active = true)
);
drop policy if exists "Admins manage reviews" on public.reviews;
create policy "Admins manage reviews" on public.reviews for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Public can read store settings" on public.store_settings;
create policy "Public can read store settings" on public.store_settings for select to anon, authenticated using (true);
drop policy if exists "Admins manage store settings" on public.store_settings;
create policy "Admins manage store settings" on public.store_settings for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Public image reads; only authenticated admins can upload/update/delete product images.
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('product-images','product-images',true,5242880,array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public=true, file_size_limit=5242880, allowed_mime_types=array['image/jpeg','image/png','image/webp'];
drop policy if exists "Public reads product images" on storage.objects;
create policy "Public reads product images" on storage.objects for select to anon, authenticated using (bucket_id = 'product-images');
drop policy if exists "Admins upload product images" on storage.objects;
create policy "Admins upload product images" on storage.objects for insert to authenticated with check (bucket_id = 'product-images' and public.is_admin());
drop policy if exists "Admins update product images" on storage.objects;
create policy "Admins update product images" on storage.objects for update to authenticated using (bucket_id = 'product-images' and public.is_admin()) with check (bucket_id = 'product-images' and public.is_admin());
drop policy if exists "Admins delete product images" on storage.objects;
create policy "Admins delete product images" on storage.objects for delete to authenticated using (bucket_id = 'product-images' and public.is_admin());

-- No fake products or reviews are seeded. Add real products only from the private admin panel.


-- API role privileges. These GRANTs do not bypass RLS; they only make permitted operations callable.
grant select on public.categories, public.products, public.reviews, public.store_settings to anon, authenticated;
grant insert on public.reviews to anon, authenticated;
grant select, insert, update, delete on public.app_admins, public.categories, public.products, public.customers, public.orders, public.order_items, public.reviews, public.store_settings to authenticated;

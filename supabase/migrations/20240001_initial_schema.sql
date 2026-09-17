-- ============================================================
-- SXTN — Initial Schema Migration
-- Run via: supabase db push  (or paste into Supabase SQL Editor)
-- ============================================================

-- ── Extensions ───────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ── 1. profiles (extends auth.users) ─────────────────────────
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  phone       text,
  avatar_url  text,
  role        text not null default 'customer' check (role in ('customer', 'admin')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ── 2. categories ─────────────────────────────────────────────
create table if not exists public.categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text unique not null,
  image_url   text,
  position    int  not null default 0,
  created_at  timestamptz not null default now()
);

-- ── 3. products ───────────────────────────────────────────────
create table if not exists public.products (
  id                uuid    primary key default gen_random_uuid(),
  category_id       uuid    references public.categories(id) on delete set null,
  name              text    not null,
  slug              text    unique not null,
  description       text,
  price             numeric(10,2) not null check (price >= 0),
  compare_at_price  numeric(10,2) check (compare_at_price >= 0),
  is_active         boolean not null default true,
  tags              text[]  not null default '{}',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- ── 4. product_images ─────────────────────────────────────────
create table if not exists public.product_images (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references public.products(id) on delete cascade,
  url         text not null,
  alt_text    text,
  position    int  not null default 0
);

-- ── 5. product_variants ───────────────────────────────────────
create table if not exists public.product_variants (
  id             uuid    primary key default gen_random_uuid(),
  product_id     uuid    not null references public.products(id) on delete cascade,
  size           text    not null,   -- S | M | L | XL | XXL
  color          text,
  sku            text    unique,
  stock          int     not null default 0 check (stock >= 0),
  price_override numeric(10,2) check (price_override >= 0)
);

-- ── 6. addresses ─────────────────────────────────────────────
create table if not exists public.addresses (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  full_name   text not null,
  phone       text not null,
  line1       text not null,
  line2       text,
  city        text not null,
  state       text not null,
  pincode     text not null,
  is_default  boolean not null default false,
  created_at  timestamptz not null default now()
);

-- ── 7. orders ─────────────────────────────────────────────────
create table if not exists public.orders (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid references public.profiles(id) on delete set null,  -- nullable for guest checkout
  guest_email          text,
  address_id           uuid references public.addresses(id) on delete set null,
  -- snapshot the address at order time so edits don't break history
  shipping_address     jsonb,
  status               text not null default 'pending'
                         check (status in ('pending','paid','confirmed','shipped','delivered','cancelled')),
  subtotal             numeric(10,2) not null check (subtotal >= 0),
  shipping_fee         numeric(10,2) not null default 0 check (shipping_fee >= 0),
  total                numeric(10,2) not null check (total >= 0),
  razorpay_order_id    text,
  razorpay_payment_id  text,
  notes                text,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

-- ── 8. order_items ────────────────────────────────────────────
create table if not exists public.order_items (
  id            uuid primary key default gen_random_uuid(),
  order_id      uuid not null references public.orders(id) on delete cascade,
  variant_id    uuid references public.product_variants(id) on delete set null,
  product_name  text not null,   -- snapshot at order time
  size          text,
  color         text,
  quantity      int  not null check (quantity > 0),
  unit_price    numeric(10,2) not null check (unit_price >= 0)
);

-- ── 9. wishlists ─────────────────────────────────────────────
create table if not exists public.wishlists (
  user_id     uuid not null references public.profiles(id) on delete cascade,
  product_id  uuid not null references public.products(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (user_id, product_id)
);


-- ============================================================
-- INDEXES
-- ============================================================
create index if not exists idx_products_slug       on public.products(slug);
create index if not exists idx_products_category   on public.products(category_id);
create index if not exists idx_products_active     on public.products(is_active);
create index if not exists idx_product_variants_pid on public.product_variants(product_id);
create index if not exists idx_product_images_pid  on public.product_images(product_id);
create index if not exists idx_orders_user_id      on public.orders(user_id);
create index if not exists idx_orders_status       on public.orders(status);
create index if not exists idx_order_items_order   on public.order_items(order_id);
create index if not exists idx_addresses_user      on public.addresses(user_id);


-- ============================================================
-- TRIGGER: auto-create profile row on signup
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;

-- drop first so re-running is idempotent
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ============================================================
-- TRIGGER: updated_at auto-stamp
-- ============================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at   on public.profiles;
create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

drop trigger if exists set_products_updated_at   on public.products;
create trigger set_products_updated_at
  before update on public.products
  for each row execute procedure public.set_updated_at();

drop trigger if exists set_orders_updated_at     on public.orders;
create trigger set_orders_updated_at
  before update on public.orders
  for each row execute procedure public.set_updated_at();


-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- ── Enable RLS on all tables ─────────────────────────────────
alter table public.profiles         enable row level security;
alter table public.categories       enable row level security;
alter table public.products         enable row level security;
alter table public.product_images   enable row level security;
alter table public.product_variants enable row level security;
alter table public.addresses        enable row level security;
alter table public.orders           enable row level security;
alter table public.order_items      enable row level security;
alter table public.wishlists        enable row level security;


-- ── Helper: is current user an admin? ─────────────────────────
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select coalesce(
    (select role = 'admin' from public.profiles where id = auth.uid()),
    false
  );
$$;


-- ── profiles ─────────────────────────────────────────────────
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Admin can view all profiles"
  on public.profiles for select
  using (public.is_admin());


-- ── categories ───────────────────────────────────────────────
create policy "Anyone can view categories"
  on public.categories for select
  using (true);

create policy "Admin can manage categories"
  on public.categories for all
  using (public.is_admin())
  with check (public.is_admin());


-- ── products ─────────────────────────────────────────────────
create policy "Anyone can view active products"
  on public.products for select
  using (is_active = true or public.is_admin());

create policy "Admin can manage products"
  on public.products for all
  using (public.is_admin())
  with check (public.is_admin());


-- ── product_images ───────────────────────────────────────────
create policy "Anyone can view product images"
  on public.product_images for select
  using (true);

create policy "Admin can manage product images"
  on public.product_images for all
  using (public.is_admin())
  with check (public.is_admin());


-- ── product_variants ─────────────────────────────────────────
create policy "Anyone can view product variants"
  on public.product_variants for select
  using (true);

create policy "Admin can manage product variants"
  on public.product_variants for all
  using (public.is_admin())
  with check (public.is_admin());


-- ── addresses ────────────────────────────────────────────────
create policy "Users can view own addresses"
  on public.addresses for select
  using (auth.uid() = user_id);

create policy "Users can insert own addresses"
  on public.addresses for insert
  with check (auth.uid() = user_id);

create policy "Users can update own addresses"
  on public.addresses for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own addresses"
  on public.addresses for delete
  using (auth.uid() = user_id);

create policy "Admin can view all addresses"
  on public.addresses for select
  using (public.is_admin());


-- ── orders ───────────────────────────────────────────────────
create policy "Users can view own orders"
  on public.orders for select
  using (auth.uid() = user_id);

create policy "Users can insert own orders"
  on public.orders for insert
  with check (auth.uid() = user_id or user_id is null);  -- allow guest (null user_id)

create policy "Admin can view all orders"
  on public.orders for select
  using (public.is_admin());

create policy "Admin can update orders"
  on public.orders for update
  using (public.is_admin());


-- ── order_items ──────────────────────────────────────────────
create policy "Users can view own order items"
  on public.order_items for select
  using (
    exists (
      select 1 from public.orders
      where orders.id = order_items.order_id
      and   orders.user_id = auth.uid()
    )
  );

create policy "Order items can be inserted via server action"
  on public.order_items for insert
  with check (true);  -- enforced in the Server Action itself

create policy "Admin can view all order items"
  on public.order_items for select
  using (public.is_admin());


-- ── wishlists ────────────────────────────────────────────────
create policy "Users can view own wishlist"
  on public.wishlists for select
  using (auth.uid() = user_id);

create policy "Users can add to own wishlist"
  on public.wishlists for insert
  with check (auth.uid() = user_id);

create policy "Users can remove from own wishlist"
  on public.wishlists for delete
  using (auth.uid() = user_id);

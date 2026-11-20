-- Migration: 20241121_order_reviews_table.sql
-- Description: Create order_reviews table for customer feedback and 1-5 star ratings

create table if not exists public.order_reviews (
  id              uuid primary key default gen_random_uuid(),
  order_id        uuid not null references public.orders(id) on delete cascade,
  user_id         uuid references auth.users(id) on delete set null,
  customer_name   text not null,
  customer_city   text,
  customer_state  text,
  rating          int not null check (rating >= 1 and rating <= 5),
  comment         text,
  product_name    text,
  is_approved     boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint order_reviews_order_id_key unique (order_id)
);

-- Performance Indexes
create index if not exists idx_order_reviews_order_id on public.order_reviews(order_id);
create index if not exists idx_order_reviews_rating on public.order_reviews(rating);
create index if not exists idx_order_reviews_created_at on public.order_reviews(created_at desc);

-- Enable RLS
alter table public.order_reviews enable row level security;

-- Policies:
-- 1. Public can read approved reviews for the storefront marquee
create policy "Public can view approved reviews" on public.order_reviews
  for select
  using (
    is_approved = true or auth.uid() = user_id or public.is_admin()
  );

-- 2. Authenticated users can insert their review for their own order
create policy "Users can insert own order review" on public.order_reviews
  for insert
  with check (
    auth.uid() = user_id or public.is_admin()
  );

-- 3. Users can update their review, admins can update any review
create policy "Users and admins can update reviews" on public.order_reviews
  for update
  using (
    auth.uid() = user_id or public.is_admin()
  );

-- 4. Admins can delete reviews
create policy "Admins can delete reviews" on public.order_reviews
  for delete
  using (
    public.is_admin()
  );

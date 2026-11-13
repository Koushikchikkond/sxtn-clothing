-- Migration: 20241113_order_returns_table.sql
-- Description: Create order_returns table for customer return and size exchange requests

create table if not exists public.order_returns (
  id              uuid primary key default gen_random_uuid(),
  order_id        uuid not null references public.orders(id) on delete cascade,
  order_item_id   uuid references public.order_items(id) on delete set null,
  user_id         uuid references auth.users(id) on delete set null,
  type            text not null check (type in ('return', 'exchange')),
  status          text not null default 'requested' check (status in ('requested', 'approved', 'rejected', 'picked_up', 'completed')),
  product_name    text not null,
  original_size   text,
  requested_size  text,
  reason          text not null,
  customer_notes  text,
  admin_notes     text,
  return_awb      text,
  return_courier  text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Performance Indexes
create index if not exists idx_order_returns_order_id on public.order_returns(order_id);
create index if not exists idx_order_returns_user_id on public.order_returns(user_id);
create index if not exists idx_order_returns_status on public.order_returns(status);
create index if not exists idx_order_returns_created_at on public.order_returns(created_at desc);

-- Enable RLS
alter table public.order_returns enable row level security;

-- Policies
create policy "Users can view own return requests" on public.order_returns
  for select
  using (
    auth.uid() = user_id or public.is_admin()
  );

create policy "Users can insert own return requests" on public.order_returns
  for insert
  with check (
    auth.uid() = user_id
  );

create policy "Admins can update return requests" on public.order_returns
  for update
  using (
    public.is_admin()
  );

create policy "Admins can delete return requests" on public.order_returns
  for delete
  using (
    public.is_admin()
  );


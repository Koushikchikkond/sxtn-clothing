-- Migration: 20241103_product_demands.sql
-- Description: Create product_demands table for out-of-stock customer notification requests

create table if not exists public.product_demands (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references public.products(id) on delete cascade,
  variant_id  uuid references public.product_variants(id) on delete set null,
  size        text,
  email       text not null,
  status      text not null default 'pending' check (status in ('pending', 'notified')),
  created_at  timestamptz not null default now()
);

-- Indexes for performance
create index if not exists idx_product_demands_product on public.product_demands(product_id);
create index if not exists idx_product_demands_email on public.product_demands(email);
create index if not exists idx_product_demands_created_at on public.product_demands(created_at desc);

-- Enable RLS
alter table public.product_demands enable row level security;

-- Policies
create policy "Anyone can submit demand" on public.product_demands
  for insert
  with check (
    email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
  );

create policy "Admins can view demands" on public.product_demands
  for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

create policy "Admins can update demands" on public.product_demands
  for update
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

create policy "Admins can delete demands" on public.product_demands
  for delete
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );


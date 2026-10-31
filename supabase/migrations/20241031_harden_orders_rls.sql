-- ============================================================
-- SXTN — Migration: Harden Orders & Order Items RLS Policies
-- Security Fix: Closes unauthorized public/guest direct insert
-- access into public.orders and public.order_items.
-- Orders must ONLY be created server-side via service_role.
-- ============================================================

-- 1. Drop overly permissive public insert policies
drop policy if exists "Users can insert own orders" on public.orders;
drop policy if exists "Order items can be inserted via server action" on public.order_items;

-- 2. Restrict direct client INSERT exclusively to admin accounts
-- (service_role used by createAdminClient() automatically bypasses RLS)
create policy "Only admin can insert orders directly"
  on public.orders for insert
  with check (public.is_admin());

create policy "Only admin can insert order items directly"
  on public.order_items for insert
  with check (public.is_admin());


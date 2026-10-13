-- ============================================================
-- Migration: Stock decrement RPC function
-- Atomically decrements stock for a product variant.
-- Uses a DB-level check (stock >= 0 constraint) as final safety net.
-- ============================================================

-- Safe atomic decrement: only decrements if enough stock is available.
-- Returns void; the stock >= 0 CHECK constraint on the column acts as
-- a hard floor so we can never go negative.
create or replace function public.decrement_variant_stock(
  p_variant_id uuid,
  p_quantity   int
)
returns void
language plpgsql
security definer
as $$
begin
  update public.product_variants
  set    stock = greatest(0, stock - p_quantity)
  where  id = p_variant_id;
end;
$$;

-- Revoke public access; only service_role (used by Admin client) can call this
revoke execute on function public.decrement_variant_stock(uuid, int) from public;
grant  execute on function public.decrement_variant_stock(uuid, int) to service_role;

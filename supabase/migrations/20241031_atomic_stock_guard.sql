-- ============================================================
-- SXTN — Migration: Atomic Stock Decrement Guard
-- Security Fix: Ensures stock decrement only succeeds if sufficient
-- inventory exists (stock >= p_quantity), returning a boolean flag.
-- Prevents silent inventory underflow and unmonitored overselling.
-- ============================================================

-- Drop the old void-returning function first
drop function if exists public.decrement_variant_stock(uuid, int);

-- Recreate with atomic check and boolean return type
create or replace function public.decrement_variant_stock(
  p_variant_id uuid,
  p_quantity   int
)
returns boolean
language plpgsql
security definer
as $$
declare
  v_rows_updated int;
begin
  if p_quantity <= 0 then
    return false;
  end if;

  update public.product_variants
  set    stock = stock - p_quantity
  where  id = p_variant_id
  and    stock >= p_quantity;

  get diagnostics v_rows_updated = row_count;
  return v_rows_updated > 0;
end;
$$;

-- Restrict execution permissions strictly to service_role (server-side only)
revoke execute on function public.decrement_variant_stock(uuid, int) from public;
grant  execute on function public.decrement_variant_stock(uuid, int) to service_role;
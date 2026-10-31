-- ============================================================
-- Migration: Security fixes and Stock Restoring RPC
-- 1. Prevents non-admins from changing their role to 'admin'
-- 2. Provides atomic variant stock increment on order cancellation
-- ============================================================

-- ── 1. Profile Role Privilege Escalation Guard ────────────────
create or replace function public.check_profile_role_update()
returns trigger
language plpgsql
security definer
as $$
begin
  if new.role is distinct from old.role and not public.is_admin() then
    raise exception 'Unauthorized: Only administrators can modify user roles.';
  end if;
  return new;
end;
$$;

drop trigger if exists enforce_profile_role_protection on public.profiles;
create trigger enforce_profile_role_protection
  before update on public.profiles
  for each row execute procedure public.check_profile_role_update();

-- ── 2. Safe Atomic Increment for Cancellations/Restocks ───────
create or replace function public.increment_variant_stock(
  p_variant_id uuid,
  p_quantity   int
)
returns void
language plpgsql
security definer
as $$
begin
  update public.product_variants
  set    stock = stock + greatest(0, p_quantity)
  where  id = p_variant_id;
end;
$$;

revoke execute on function public.increment_variant_stock(uuid, int) from public;
grant  execute on function public.increment_variant_stock(uuid, int) to service_role;

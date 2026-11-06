-- ============================================================
-- SXTN — Migration: Product Type and Custom Size Chart
-- Allows products to specify product_type ('tshirt' or 'hoodie')
-- and custom size measurements (chest, length, shoulder) via JSONB.
-- ============================================================

alter table public.products
  add column if not exists product_type text not null default 'tshirt' check (product_type in ('tshirt', 'hoodie')),
  add column if not exists size_chart jsonb default null;


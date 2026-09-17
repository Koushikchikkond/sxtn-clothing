-- ============================================================
-- SXTN — Seed Data (Sample products for development)
-- Run after migrations: paste into Supabase SQL Editor
-- ============================================================

-- Categories
insert into public.categories (id, name, slug, position) values
  ('aaaaaaaa-0000-0000-0000-000000000001', 'T-Shirts', 't-shirts', 1)
on conflict (slug) do nothing;

-- Sample products (prices in INR)
insert into public.products (id, category_id, name, slug, description, price, compare_at_price, is_active, tags) values
  (
    'bbbbbbbb-0000-0000-0000-000000000001',
    'aaaaaaaa-0000-0000-0000-000000000001',
    'Heavyweight Boxy Tee',
    'heavyweight-boxy-tee',
    'Crafted from 100% ring-spun cotton. Oversized boxy fit with dropped shoulders for a premium streetwear silhouette.',
    1499.00,
    1999.00,
    true,
    ARRAY['tshirt', 'oversized', 'cotton']
  ),
  (
    'bbbbbbbb-0000-0000-0000-000000000002',
    'aaaaaaaa-0000-0000-0000-000000000001',
    'Oversized Graphic Tee',
    'oversized-graphic-tee',
    'Bold graphic print on our signature oversized cut. Limited edition drop.',
    1899.00,
    2499.00,
    true,
    ARRAY['tshirt', 'graphic', 'oversized', 'limited']
  ),
  (
    'bbbbbbbb-0000-0000-0000-000000000003',
    'aaaaaaaa-0000-0000-0000-000000000001',
    'Essential Core Tee',
    'essential-core-tee',
    'The everyday essential. Lightweight and breathable, perfect for layering or wearing solo.',
    1299.00,
    null,
    true,
    ARRAY['tshirt', 'essential', 'lightweight']
  ),
  (
    'bbbbbbbb-0000-0000-0000-000000000004',
    'aaaaaaaa-0000-0000-0000-000000000001',
    'Vintage Wash Tee',
    'vintage-wash-tee',
    'Stone-washed for that perfectly worn-in feel. Gets better with every wash.',
    1599.00,
    1899.00,
    true,
    ARRAY['tshirt', 'vintage', 'washed']
  )
on conflict (slug) do nothing;

-- Variants for Heavyweight Boxy Tee
insert into public.product_variants (product_id, size, color, sku, stock) values
  ('bbbbbbbb-0000-0000-0000-000000000001', 'S',   'Black', 'HBT-BLK-S',  15),
  ('bbbbbbbb-0000-0000-0000-000000000001', 'M',   'Black', 'HBT-BLK-M',  25),
  ('bbbbbbbb-0000-0000-0000-000000000001', 'L',   'Black', 'HBT-BLK-L',  20),
  ('bbbbbbbb-0000-0000-0000-000000000001', 'XL',  'Black', 'HBT-BLK-XL', 10),
  ('bbbbbbbb-0000-0000-0000-000000000001', 'XXL', 'Black', 'HBT-BLK-XXL', 5),
  ('bbbbbbbb-0000-0000-0000-000000000001', 'S',   'White', 'HBT-WHT-S',  12),
  ('bbbbbbbb-0000-0000-0000-000000000001', 'M',   'White', 'HBT-WHT-M',  20),
  ('bbbbbbbb-0000-0000-0000-000000000001', 'L',   'White', 'HBT-WHT-L',  18),
  ('bbbbbbbb-0000-0000-0000-000000000001', 'XL',  'White', 'HBT-WHT-XL',  8)
on conflict (sku) do nothing;

-- Variants for Oversized Graphic Tee
insert into public.product_variants (product_id, size, color, sku, stock) values
  ('bbbbbbbb-0000-0000-0000-000000000002', 'S',  'White', 'OGT-WHT-S',  10),
  ('bbbbbbbb-0000-0000-0000-000000000002', 'M',  'White', 'OGT-WHT-M',  18),
  ('bbbbbbbb-0000-0000-0000-000000000002', 'L',  'White', 'OGT-WHT-L',  15),
  ('bbbbbbbb-0000-0000-0000-000000000002', 'XL', 'White', 'OGT-WHT-XL',  7)
on conflict (sku) do nothing;

-- Variants for Essential Core Tee
insert into public.product_variants (product_id, size, color, sku, stock) values
  ('bbbbbbbb-0000-0000-0000-000000000003', 'S',   'Charcoal', 'ECT-CHR-S',  20),
  ('bbbbbbbb-0000-0000-0000-000000000003', 'M',   'Charcoal', 'ECT-CHR-M',  30),
  ('bbbbbbbb-0000-0000-0000-000000000003', 'L',   'Charcoal', 'ECT-CHR-L',  25),
  ('bbbbbbbb-0000-0000-0000-000000000003', 'XL',  'Charcoal', 'ECT-CHR-XL', 15),
  ('bbbbbbbb-0000-0000-0000-000000000003', 'XXL', 'Charcoal', 'ECT-CHR-XXL', 8),
  ('bbbbbbbb-0000-0000-0000-000000000003', 'S',   'Black',    'ECT-BLK-S',  20),
  ('bbbbbbbb-0000-0000-0000-000000000003', 'M',   'Black',    'ECT-BLK-M',  30)
on conflict (sku) do nothing;

-- Variants for Vintage Wash Tee
insert into public.product_variants (product_id, size, color, sku, stock) values
  ('bbbbbbbb-0000-0000-0000-000000000004', 'S',  'Grey', 'VWT-GRY-S',  12),
  ('bbbbbbbb-0000-0000-0000-000000000004', 'M',  'Grey', 'VWT-GRY-M',  20),
  ('bbbbbbbb-0000-0000-0000-000000000004', 'L',  'Grey', 'VWT-GRY-L',  16),
  ('bbbbbbbb-0000-0000-0000-000000000004', 'XL', 'Grey', 'VWT-GRY-XL',  9)
on conflict (sku) do nothing;

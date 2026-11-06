---
title: "Admin Product Type (T-Shirt / Hoodie) and Dynamic Size Guide Configuration"
date: 2026-11-06
status: completed
tags:
  - task
  - admin
  - storefront
  - db
---

# Task: Admin Product Type (T-Shirt / Hoodie) and Dynamic Size Guide Configuration

> [!info] Objective
> 1. In the admin product form, add a "Type" selector (`tshirt` or `hoodie`) below/alongside the sizes & inventory section.
> 2. Add a manual "Size Guide" management table where chest and length (and shoulder for hoodie) measurements can be configured per size.
> 3. Save `product_type` and `size_chart` to the database.
> 4. Update the storefront product details page to render the dynamic size guide (including shoulder for hoodies).
> 5. Clarify instructions for existing products (defaults vs manual updates).

## Context & Links
- Relates to: [[PRD]], [[architecture]], [[rules]]
- Relevant components: `components/admin/product-form.tsx`, `components/storefront/product-details.tsx`

## Implementation Plan
- [x] Step 1: Create Supabase SQL migration for `product_type` and `size_chart` columns on `products`.
- [x] Step 2: Update database TypeScript definitions in `types/database.types.ts`.
- [x] Step 3: Implement Type selector (`tshirt` vs `hoodie`) and manual Size Guide table in `components/admin/product-form.tsx`.
- [x] Step 4: Update storefront `components/storefront/product-details.tsx` to render the dynamic size chart (chest + length for t-shirts; chest + length + shoulder for hoodies), with clean fallback for unconfigured/legacy products.
- [x] Step 5: Typecheck with `tsc --noEmit`.
- [x] Step 6: Mark task completed, update README, and give clear user instructions on existing products.

## Changes Made
- `supabase/migrations/20241106_product_type_and_size_chart.sql`: Added `product_type` (text default `'tshirt'`) and `size_chart` (jsonb default `null`) to `public.products`.
- `types/database.types.ts`: Added `SizeGuideEntry` interface and extended `products` Row, Insert, and Update types with `product_type` and `size_chart`.
- `components/admin/product-form.tsx`:
  - Added brutalist toggle for product apparel type (`T-Shirt` or `Hoodie`).
  - Added dedicated manual Size Guide input table directly below sizes & inventory. Each row synchronizes with current size variants.
  - Automatically shows `Shoulder (in)` column when `Hoodie` is selected; hides shoulder and shows only `Chest (in)` and `Length (in)` for `T-Shirt`.
  - Serializes `product_type` and `size_chart` in payload on create and update.
- `components/storefront/product-details.tsx`:
  - Dynamically renders product-specific size guide measurements from `product.size_chart`.
  - Displays Shoulder row when the product is a hoodie.
  - Automatically falls back to standard default chart for legacy/unconfigured products so existing items never break.

## Review & Notes
- Tested with `npx tsc --noEmit` — 0 errors.

---
title: "Remove Horizontal Gap Between Products in Catalog Grid"
date: 2026-11-04
status: completed
tags:
  - task
  - storefront
  - ui
---

# Task: Remove Horizontal Gap Between Products in Catalog Grid

> [!info] Objective
> Remove horizontal spacing/padding (`gap-x-1` -> `gap-x-0`) between product cards across all storefront product grids, placing products directly adjacent to each other with no left/right gap. (Do NOT commit to GitHub per user instruction).

## Context & Links
- Relates to: [[PRD]], [[architecture]], [[rules]], [[design-system-and-ui]]
- Task Index: [[README|Tasks Archive]]

## Implementation Plan
- [x] Step 1: Update `components/storefront/product-grid.tsx` to set `gap-x-0`.
- [x] Step 2: Update `app/page.tsx` to set `gap-x-0` and use `ProductCard`.
- [x] Step 3: Update `app/(storefront)/products/[slug]/page.tsx` to set `gap-x-0`.
- [x] Step 4: Update `app/(storefront)/products/[slug]/loading.tsx` to set `gap-x-0`.
- [x] Step 5: Update `app/(storefront)/account/wishlist/page.tsx` to set `gap-x-0`.
- [x] Step 6: Verify with `pnpm typecheck` (`tsc --noEmit`).
- [x] Step 7: Keep changes uncommitted in local workspace per user instruction.

## Changes Made
- `components/storefront/product-grid.tsx`: Changed grid horizontal gap from `gap-x-1` to `gap-x-0`.
- `app/page.tsx`: Changed grid horizontal gap from `gap-x-1` to `gap-x-0` and replaced duplicate inline cards with unified `ProductCard`.
- `app/(storefront)/products/[slug]/page.tsx`: Changed "You May Also Like" grid from `gap-x-1` to `gap-x-0`.
- `app/(storefront)/products/[slug]/loading.tsx`: Changed skeleton suggestions grid from `gap-x-1` to `gap-x-0`.
- `app/(storefront)/account/wishlist/page.tsx`: Changed wishlist product grid from `gap-x-1` to `gap-x-0`.

## Review & Notes
- Verified with `pnpm typecheck` (`tsc --noEmit`) - passed with 0 errors.
- Changes remain uncommitted in the local working directory as instructed.

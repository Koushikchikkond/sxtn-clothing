---
title: "Remove Onscreen Arrow Buttons from Product Images"
date: 2026-11-03
status: completed
tags:
  - task
  - storefront
  - ui
---

# Task: Remove Onscreen Arrow Buttons from Product Images

> [!info] Objective
> Remove the physical left and right arrow buttons displayed over the product images on PDP and ProductCard, retaining pure touch swipe gestures.

## Context & Links
- Relates to: [[PRD]], [[architecture]], [[rules]], [[design-system-and-ui]]
- Task Index: [[README|Tasks Archive]]

## Implementation Plan
- [x] Step 1: Remove left and right chevron buttons from `components/storefront/product-details.tsx`.
- [x] Step 2: Remove left and right chevron buttons from `components/storefront/product-card.tsx`.
- [x] Step 3: Verify touch swipe listeners remain intact on both components.
- [x] Step 4: Run `pnpm typecheck` to verify 0 errors.
- [x] Step 5: Commit, push to `origin/main`, and mark task completed.

## Changes Made
- `components/storefront/product-details.tsx`: Removed the left and right chevron arrow button overlays from the main product image; retained horizontal touch swipe detection (`onTouchStart`, `onTouchEnd`) and slide counter.
- `components/storefront/product-card.tsx`: Removed the left and right chevron arrow buttons; retained mobile touch swipe gestures and minimal dots indicator.

## Review & Notes
- Tested with `pnpm typecheck` (`tsc --noEmit`) - passed cleanly with 0 errors.
- Pushed to `origin/main` for production deployment.

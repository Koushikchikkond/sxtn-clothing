---
title: "Move Wishlist Button and Add Smooth Hover Reveal for Second Product Image"
date: 2026-11-05
status: completed
tags:
  - task
  - storefront
  - ui
---

# Task: Move Wishlist Button and Add Smooth Hover Reveal for Second Product Image

> [!info] Objective
> 1. Remove the wishlist icon from the top of the product image and place it beside the "Add to Bag" button below the tshirt on the product details page (and remove it from covering the image on product cards).
> 2. On the home page (and catalog), hovering over any product/tshirt smoothly reveals its 2nd image, and moving the cursor away smoothly transitions back to the 1st image.

## Context & Links
- Relates to: [[PRD]], [[architecture]], [[rules]], [[design-system-and-ui]]
- Task Index: [[README|Tasks Archive]]

## Implementation Plan
- [x] Step 1: Update `components/storefront/wishlist-button.tsx` to support a `button` variant matching the Add to Bag height (`h-14`) with brutalist styling.
- [x] Step 2: In `components/storefront/product-details.tsx`, remove the floating wishlist icon from the main image and place it directly beside the "Add to Bag" button.
- [x] Step 3: In `components/storefront/product-card.tsx`, remove the wishlist icon from the top-right of the image and reposition it below the image beside product details.
- [x] Step 4: In `components/storefront/product-card.tsx`, add the smooth hover transition (`group-hover:opacity-100 group-hover:scale-105 transition-all duration-700 ease-out`) revealing the 2nd image and returning to the 1st image on mouse leave.
- [x] Step 5: Verify with `pnpm typecheck` (`tsc --noEmit`).
- [x] Step 6: Mark task completed.

## Changes Made
- `components/storefront/wishlist-button.tsx`: Added a `variant="button"` option with `h-14 w-14` dimensions, brutalist border, inverted active state (`border-white bg-white text-black`), and scaling animation.
- `components/storefront/product-details.tsx`: Removed the wishlist icon overlay from the top of the tshirt image and placed it directly beside the "Add to Bag" button in a cohesive action group.
- `components/storefront/product-card.tsx`:
  - Removed the wishlist icon from the top-right of the product card image, moving it cleanly beside the product name/price below the image.
  - Implemented dual-image crossfade with smooth, slow hover reveal: tuned timing to `duration-700 ease-in-out` so when hovering over any tshirt on the homepage, the 2nd image gently fades in, and smoothly returns to the 1st image on mouse leave without suddenness.

## Review & Notes
- Tested with `pnpm typecheck` (`tsc --noEmit`) - passed cleanly with 0 errors.

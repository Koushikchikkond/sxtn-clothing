---
title: "About Uppercase, Terms Update, Product Image Swipe Slider, and Remove Cart Free Shipping"
date: 2026-11-03
status: completed
tags:
  - task
  - storefront
  - ui
  - cart
---

# Task: About Uppercase, Terms Update, Product Image Swipe Slider, and Remove Cart Free Shipping

> [!info] Objective
> 1. Update About page to full uppercase typography and refined layout alignment.
> 2. Replace Terms of Service content with user-specified legal sections.
> 3. Add touch swipe gestures and left/right navigation arrows to multi-image products on both desktop and mobile (PDP and Product Card).
> 4. Remove all "free shipping" threshold displays and progress bars from Cart (drawer and page) and enforce standard shipping.

## Context & Links
- Relates to: [[PRD]], [[architecture]], [[rules]], [[design-system-and-ui]]
- Task Index: [[README|Tasks Archive]]

## Implementation Plan
- [x] Step 1: Update `app/(storefront)/(static)/about/page.tsx` with all-uppercase text and balanced layout.
- [x] Step 2: Replace content in `app/(storefront)/(static)/terms/page.tsx` with exact user-supplied sections.
- [x] Step 3: Implement touch swipe gestures and left/right arrows for multi-image gallery in `components/storefront/product-details.tsx`.
- [x] Step 4: Add left/right slide arrows and touch swipe support to `components/storefront/product-card.tsx` for multi-image preview.
- [x] Step 5: Remove free shipping threshold & progress bar from `components/storefront/cart-drawer.tsx`, `app/(storefront)/cart/page.tsx`, `app/(storefront)/checkout/page.tsx`, and `lib/razorpay.ts`.
- [x] Step 6: Verify TypeScript compilation (`pnpm typecheck` & `pnpm build`) and update task status.

## Changes Made
- `app/(storefront)/(static)/about/page.tsx`: Transformed all brand copy to full uppercase typography with brutalist centered alignment and proper rhythmic spacing.
- `app/(storefront)/(static)/terms/page.tsx`: Completely replaced terms with the 6 user-provided sections (`PRODUCTS AND DESCRIPTION`, `ORDERS`, `PRICING AND PAYMENT`, `SHIPPING AND DELIVERY`, `RETURNS AND EXCHANGES`, `CHANGES TO THESE TERMS`) and official support email link.
- `components/storefront/product-details.tsx`: Added left/right slide navigation arrows, touch swipe detection (`onTouchStart`/`onTouchEnd`), keyboard arrow support, and slide counter index indicator for multi-image products.
- `components/storefront/product-card.tsx`: Converted to client component supporting left/right slide switching buttons, touch swipe gestures on mobile, dot pagination, and prevented navigation hijacking on swipe/arrow click.
- `components/storefront/cart-drawer.tsx`: Removed free shipping progress bar, remaining amount calculation, and free shipping badge; updated shipping fee line to standard INR 99.
- `app/(storefront)/cart/page.tsx`: Removed free shipping threshold text and conditional 0 shipping logic.
- `app/(storefront)/checkout/page.tsx`: Enforced flat INR 99 shipping fee and removed conditional free shipping label.
- `lib/razorpay.ts`: Set server-side verified shipping fee to flat 99, removing the 999 free shipping threshold.

## Review & Notes
- Tested with `pnpm typecheck` (`tsc --noEmit`) - passed with 0 errors.
- Verified with `pnpm build` (`next build`) - all static and dynamic routes compiled successfully.


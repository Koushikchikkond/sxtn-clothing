---
title: "Heart Rating Icon Integration, Remove Preset Tags, and Clean Review Subtitle"
date: 2026-11-22
status: completed
tags:
  - task
  - storefront
  - reviews
---

# Task: Heart Rating Icon Integration, Remove Preset Tags, and Clean Review Subtitle

> [!info] Objective
> 1. Switch the rating system from stars (★) to hearts (♥) matching the user reference (`#ff6d75` filled / `#ff3d47` hover / muted grey empty).
> 2. On the customer order rating component (`customer-order-rating.tsx`), remove preset quick feedback tags ("Perfect Boxy Fit", "Luxury Quality", etc.) and keep a clean, blank space for typing customer feedback.
> 3. On the homepage customer review section (`customer-reviews-marquee.tsx`), remove the subtitle text: *"Real feedback on fabric weight, boxy cuts, and delivery from verified customers across India."* and update rating stars to hearts.
> 4. Update the orders list page and delivery email template to display heart ratings consistently.

## Context & Links
- Relates to: [[PRD]], [[architecture]]
- Relevant rules: [[rules]]

## Implementation Details
- **Customer Order Rating Component (`components/account/customer-order-rating.tsx`)**:
  - Replaced `Star` with `Heart` icons.
  - Interactive heart picker styled with `#ff6d75` (coral-red), glowing drop shadow, `#ff3d47` on hover, and muted zinc for empty hearts matching the reference image.
  - Removed `PRESET_TAGS` array and tag buttons so customers type organic feedback.
  - Kept clean, open `textarea` for detailed customer review.
  - Updated labels from "Stars" to "Hearts".
- **Storefront Customer Reviews Marquee (`components/storefront/customer-reviews-marquee.tsx`)**:
  - Removed the subtitle paragraph: *"Real feedback on fabric weight, boxy cuts, and delivery from verified customers across India."*
  - Replaced stars with `#ff6d75` styled `Heart` icons in both the average rating badge and customer review cards.
- **My Orders Page (`app/(storefront)/account/orders/page.tsx`)**:
  - Replaced stars in the delivered order rating bar with `#ff6d75` `Heart` icons.
- **Delivery Email Template (`lib/email/templates.ts`)**:
  - Updated rating callout to display `♥♥♥♥♥` with `#ff6d75`.

## Changes Made
- Modified `components/account/customer-order-rating.tsx`
- Modified `components/storefront/customer-reviews-marquee.tsx`
- Modified `app/(storefront)/account/orders/page.tsx`
- Modified `lib/email/templates.ts`
- Updated `mind/tasks/README.md`

## Review & Notes
- TypeScript check (`npx tsc --noEmit`): 0 errors.
- Next.js production build (`npm run build`): Validated across all 38 routes.

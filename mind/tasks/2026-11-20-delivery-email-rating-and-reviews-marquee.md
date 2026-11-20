---
title: "Delivery Email Rating Flow, Customer Reviews Marquee & Order Thumbnails"
date: 2026-11-20
status: completed
tags:
  - task
  - storefront
  - db
---

# Task: Delivery Email Rating Flow, Customer Reviews Marquee & Order Thumbnails

> [!info] Objective
> 1. Add 5-star rating CTA to the final delivery completed email linking directly to customer's order page with auth redirect.
> 2. Allow customers to rate delivered orders (1 to 5 stars + feedback comment) in their account order page, extracting customer name and location from shipping address.
> 3. Display customer ratings in a slow left-to-right moving card marquee below the 3D Circular Customer Showcase on the homepage.
> 4. Display small t-shirt thumbnail icons for every order in the account order list.

## Context & Links
- Relates to: [[PRD]], [[architecture]]
- Relevant rules: [[rules]]

## Implementation Plan
- [x] Initialize Obsidian task note
- [x] Create Supabase migration / storage for `order_reviews` table with support for order_id, user_id, rating, comment, customer_name, city, state, product_name
- [x] Create `/api/orders/[id]/reviews` API endpoint to fetch and submit order ratings
- [x] Enhance final delivery completed email in `lib/email/templates.ts` with 5-star review CTA linking to `/account/orders/[id]?rate=true`
- [x] Update `app/(auth)/login/page.tsx` and auth callback to preserve redirect path for review links
- [x] Create interactive customer order rating component in `components/account/customer-order-rating.tsx` and integrate into `app/(storefront)/account/orders/[id]/page.tsx`
- [x] Build `CustomerReviewsMarquee` component and add it to `app/page.tsx` below `CommunityGallerySection`
- [x] Update `app/(storefront)/account/orders/page.tsx` to fetch item thumbnails and render small t-shirt icons for every order
- [x] Run `npx tsc --noEmit` and build test to ensure 0 errors
- [x] Update Obsidian task note and README.md

## Changes Made
- `supabase/migrations/20241121_order_reviews_table.sql`: Created `order_reviews` table with unique constraint on `order_id`, RLS policies, and performance indexes.
- `types/database.types.ts`: Added `order_reviews` table types and `OrderReview` helper.
- `lib/reviews.ts`: Added helper to fetch and merge live Supabase reviews with verified community seed reviews from Indian cities.
- `app/api/orders/[id]/reviews/route.ts`: API route supporting GET and POST for submitting verified 1-5 star ratings with location and product metadata.
- `lib/email/templates.ts`: Added 5-star rating invitation card in `getOrderStatusUpdateHtml` when `status === "delivered"`.
- `app/(auth)/login/page.tsx`: Updated Google OAuth options to preserve `?next=` destination URL upon sign in.
- `components/account/customer-order-rating.tsx`: Interactive 1-5 star selector with hover states, preset tags ("Perfect Boxy Fit", "Heavyweight 280 GSM"), text comment input, and review viewing state.
- `app/(storefront)/account/orders/[id]/page.tsx`: Integrated rating component and pass customer shipping address / products metadata.
- `components/storefront/customer-reviews-marquee.tsx`: Infinite left-to-right moving carousel of review cards with star ratings, customer name, city, state, product tag, verified buyer badge, and pause-on-hover.
- `app/page.tsx`: Integrated `<CustomerReviewsMarquee />` below `<CommunityGallerySection />`.
- `app/(storefront)/account/orders/page.tsx`: Updated orders query to retrieve item images and display small t-shirt thumbnails (+ fallback icon) for every order.

## Review & Notes
- TypeScript verification passed with 0 errors (`npx tsc --noEmit`).
- Production build verification completed successfully with 38/38 static & dynamic routes compiled (`npm run build`).

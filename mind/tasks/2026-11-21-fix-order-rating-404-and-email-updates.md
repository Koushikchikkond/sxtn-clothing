---
title: "Fix Order Rating 404, Link Guest Orders, and Update Delivery Email (240 GSM & 6xtn.in@gmail.com)"
date: 2026-11-21
status: completed
tags:
  - task
  - storefront
  - email
  - orders
---

# Task: Fix Order Rating 404, Link Guest Orders, and Update Delivery Email

> [!info] Objective
> 1. Resolve the "Page Not Found" (404) error when customers click the rating link from their delivery completion email.
> 2. Auto-link guest checkout orders to customer accounts by email upon login, order lookup, and auth callback.
> 3. Allow seamless rating flow on both `/account/orders/[id]` and `/account/orders` (orders list) for delivered orders.
> 4. Update the delivery email template text: replace 280 GSM with 240 GSM.
> 5. Update customer support email in the email footer from `support@6xtn.in` to `6xtn.in@gmail.com`.

## Context & Links
- Relates to: [[PRD]], [[architecture]]
- Relevant rules: [[rules]]

## Root Cause Analysis (Why the 404 Occurred)
1. **Guest Checkout Null `user_id`**:
   Orders created during guest checkout (or prior to user authentication) store `user_id: null` in Supabase, along with `guest_email` and shipping address email.
2. **Strict RLS & Page Query**:
   `app/(storefront)/account/orders/[id]/page.tsx` was querying `.eq("user_id", user.id)` with the user-scoped client. Because `user_id` was `null` on the database record, Supabase RLS and the query returned 0 rows, triggering Next.js's `notFound()`.
3. **Stripped Query Parameters**:
   The redirect to `/login` stripped `?rate=true`, which meant even upon logging in, the rate mode was lost.
4. **API Route Restriction**:
   `/api/orders/[id]/reviews` strictly rejected submissions if `order.user_id !== user.id`, which rejected guest orders even when the customer logged in.

## Implementation Details
- **Auto-Linking Engine (`lib/orders.ts`)**:
  Created `claimUserOrdersByEmail` to associate any unlinked orders having matching `guest_email` to the user's account ID.
- **Auth Callback (`app/auth/callback/route.ts`)**:
  Integrated `claimUserOrdersByEmail` on successful Google OAuth exchange.
- **Order Detail Page (`app/(storefront)/account/orders/[id]/page.tsx`)**:
  - Uses `createAdminClient()` to prevent RLS hiding guest orders.
  - Automatically claims orders for logged-in users when customer emails match.
  - For unauthenticated users visiting a delivered order from email, displays order details and allows rating directly, plus a 1-click Google Sign-In prompt.
  - Shows an account-switch warning instead of 404 if a user is logged into a completely different account.
  - Preserves `?rate=true` in redirect parameters.
- **Orders List Page (`app/(storefront)/account/orders/page.tsx`)**:
  - Auto-claims guest orders on load.
  - Renders a dedicated 5-star rating CTA and review status bar directly below delivered order cards.
- **Review API (`app/api/orders/[id]/reviews/route.ts`)**:
  - Allows verified delivered orders to be rated, associating review and linking `user_id` if authenticated.
- **Delivery Email & Footer Updates (`lib/email/templates.ts`)**:
  - Changed delivery email text: `280 GSM` → `240 GSM`.
  - Changed footer support contact: `support@6xtn.in` → `6xtn.in@gmail.com`.
  - Updated preset tag in `components/account/customer-order-rating.tsx` to `Heavyweight 240 GSM`.
  - Updated order cancellation error message in `app/api/orders/[id]/cancel/route.ts` to `6xtn.in@gmail.com`.

## Changes Made
- Created `lib/orders.ts`
- Modified `lib/email/templates.ts`
- Modified `components/account/customer-order-rating.tsx`
- Modified `app/(storefront)/account/orders/[id]/page.tsx`
- Modified `app/(storefront)/account/orders/page.tsx`
- Modified `app/api/orders/[id]/reviews/route.ts`
- Modified `app/auth/callback/route.ts`
- Modified `app/api/orders/[id]/cancel/route.ts`
- Updated `mind/tasks/README.md`

## Review & Notes
- TypeScript compiler (`npx tsc --noEmit`): 0 errors.
- Next.js production build (`npm run build`): Validated across all 38 routes.

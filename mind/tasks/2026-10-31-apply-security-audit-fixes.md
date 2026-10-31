---
title: "Apply Security Audit Defensive Fixes"
date: 2026-10-31
status: completed
tags:
  - task
  - security
  - fix
  - database
  - api
  - payments
---

# Task: Apply Security Audit Defensive Fixes

> [!info] Objective
> Implement all 6 defensive remediations identified during the Cloudflare `security-audit-skill` audit run: harden Supabase orders RLS policies, add asynchronous stock decrement to the Razorpay webhook, make the stock decrement RPC strictly atomic, fix rate-limiting cookie spoofing in middleware, block inactive products from checkout, and sanitize R2 upload object keys.

## Context & Links
- Relates to: [[security]], [[rules]], [[architecture]]
- Audit Report: [[security-audit-report]]
- Task Index: [[README|Tasks Archive]]

## Implementation Plan
- [x] Fix 1 (Critical): Create migration `supabase/migrations/20241031_harden_orders_rls.sql` to revoke public INSERT on `orders` and `order_items`
- [x] Fix 2 (High): Update `app/api/webhooks/razorpay/route.ts` to decrement inventory stock on asynchronous payment capture
- [x] Fix 3 (Medium): Create migration `supabase/migrations/20241031_atomic_stock_guard.sql` to prevent silent underflow in `decrement_variant_stock`
- [x] Fix 4 (Medium): Update `middleware.ts` to eliminate `sb-user-id` cookie spoofing in rate-limiting key generation
- [x] Fix 5 (Low): Update `lib/razorpay.ts` to explicitly block orders on inactive/draft products (`is_active: false`)
- [x] Fix 6 (Low): Update `app/api/upload/route.ts` to sanitize `productSlug` against path traversal in R2 object keys
- [x] Verification: Run TypeScript typecheck (`pnpm typecheck`) and verify clean build (Passed: 0 errors)
- [x] Update documentation and mark task as completed

## Changes Made
- Created `supabase/migrations/20241031_harden_orders_rls.sql`: Revokes public anonymous/customer insert access to `orders` and `order_items`, restricting direct insertion to admins.
- Created `supabase/migrations/20241031_atomic_stock_guard.sql`: Hardens `decrement_variant_stock` RPC to verify `stock >= p_quantity` and return a boolean status flag.
- Modified `app/api/webhooks/razorpay/route.ts`: Added atomic variant stock decrement loop upon asynchronous payment capture.
- Modified `app/api/verify-payment/route.ts`: Added warning log if variant stock decrement returns false.
- Modified `middleware.ts`: Removed unverified `sb-user-id` cookie extraction to prevent rate limiter bypass.
- Modified `lib/razorpay.ts`: Added explicit `variant.products.is_active` validation in `calculateVerifiedCartTotal`.
- Modified `app/api/upload/route.ts`: Sanitized `productSlug` via alphanumeric regex replacement to prevent S3/R2 path traversal.

## Review & Notes
- All 6 defensive security remediations applied cleanly and compiled with 0 TypeScript errors.
- For Supabase database migrations, run `supabase db push` or paste the contents of `supabase/migrations/20241031_harden_orders_rls.sql` and `supabase/migrations/20241031_atomic_stock_guard.sql` into the Supabase SQL Editor.



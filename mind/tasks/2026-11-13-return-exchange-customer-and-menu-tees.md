---
title: "Customer Return & Exchange Flow and Navigation Menu Tees Update"
date: 2026-11-13
status: completed
tags:
  - task
  - storefront
  - admin
  - db
---

# Task: Customer Return & Exchange Flow and Navigation Menu Tees Update

> [!info] Objective
> 1. Update storefront navigation menu and footer links from "T-Shirts" to "Tees" without breaking existing routes.
> 2. Implement an end-to-end Return and Exchange system: customer can request a size exchange or return for refund on delivered orders, track its status, and admins can view, approve, reject, or mark return requests completed from the admin dashboard with full production safety.

## Context & Links
- Relates to: [[PRD]], [[architecture]]
- Relevant rules: [[rules]], [[security]]

## Implementation Plan
- [x] Step 1: Update navigation menu & footer links ("T-Shirts" -> "Tees") in `components/storefront/header.tsx` and `components/storefront/footer.tsx`
- [x] Step 2: Create database migration `supabase/migrations/20241113_order_returns_table.sql` for `order_returns` table with indexes and RLS policies
- [x] Step 3: Update `types/database.types.ts` to include `order_returns` Row, Insert, and Update types
- [x] Step 4: Create customer API route `app/api/orders/[id]/returns/route.ts` for submitting and fetching return/exchange requests
- [x] Step 5: Create admin API route `app/api/admin/returns/[id]/status/route.ts` to approve/reject/update return request status and tracking
- [x] Step 6: Update customer portal UI (`components/account/customer-order-actions.tsx` & `app/(storefront)/account/orders/[id]/page.tsx`) with Return / Exchange request modal and active status tracking card
- [x] Step 7: Update admin order detail and orders list (`app/admin/orders/[id]/page.tsx` & `app/admin/orders/page.tsx`) to display and manage Return / Exchange requests
- [x] Step 8: Run typecheck (`npx tsc --noEmit`) and verify build integrity

## Changes Made
- `components/storefront/header.tsx`: Updated navigation item label from "T-Shirts" to "Tees".
- `components/storefront/footer.tsx`: Updated desktop and mobile quick links from "T-Shirts" to "Tees".
- `supabase/migrations/20241113_order_returns_table.sql`: Added `order_returns` table with foreign keys, enum checks, indexes, and customer/admin RLS policies.
- `types/database.types.ts`: Added `order_returns` table definition, convenience types `OrderReturn`, `OrderReturnType`, `OrderReturnStatus`.
- `app/api/orders/[id]/returns/route.ts`: Implemented authenticated customer endpoint to submit size exchange or return requests on delivered orders, with validation preventing duplicates.
- `app/api/admin/returns/[id]/status/route.ts`: Implemented admin-authenticated endpoint to approve, reject, mark picked up, mark completed, and record reverse courier / AWB numbers.
- `components/account/customer-order-actions.tsx`: Added Return / Exchange modal (size swap or return for refund), size selector, reasons, and dynamic active status banner.
- `app/(storefront)/account/orders/[id]/page.tsx`: Fetches active return/exchange records and passes them to `CustomerOrderActions`.
- `components/admin/order-return-manager.tsx`: Added interactive admin manager component for reviewing return details and updating reverse logistics.
- `app/admin/orders/[id]/page.tsx`: Integrated `OrderReturnManager` into admin order view.
- `app/admin/orders/page.tsx`: Added pending return alert banner and per-order return status indicators.

## Review & Notes
- Non-destructive additive database design: uses separate `order_returns` table so existing orders, payments, and checkout logic are untouched.
- Clean customer UX adhering to the 6XTN brutalist / minimalist design tokens.
- Next.js 16 production build (`next build`) and TypeScript check verified with 0 errors.


## Review & Notes
- Non-destructive additive database design: uses separate `order_returns` table so existing orders, payments, and checkout logic are untouched.
- Clean customer UX adhering to the 6XTN brutalist / minimalist design tokens.

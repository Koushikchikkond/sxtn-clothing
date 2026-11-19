---
title: "Admin Order Logs & Hide Pending Orders from Customers"
date: 2026-11-19
status: completed
tags:
  - task
  - admin
  - storefront
  - db
---

# Task: Admin Order Logs & Hide Pending Orders from Customers

> [!info] Objective
> Filter out uncompleted `pending` checkout orders from the customer's "My Orders" account view and the main Admin Orders table. In Admin Orders, provide an "Order Logs" button at the top to access pending/abandoned checkout sessions.

## Context & Links
- Relates to: [[PRD]], [[architecture]]
- Relevant rules: [[rules]], [[security]]

## Implementation Plan
- [x] Step 1: Update `app/(storefront)/account/orders/page.tsx` and `app/(storefront)/account/page.tsx` to filter out `.neq("status", "pending")`.
- [x] Step 2: Update `app/(storefront)/account/orders/[id]/page.tsx` to return `notFound()` if customer accesses a pending order.
- [x] Step 3: Update `app/admin/page.tsx` so dashboard statistics only count active/paid orders.
- [x] Step 4: Update `app/admin/orders/page.tsx` with view tabs (`Paid Orders` vs `Order Logs`), filtering `status !== "pending"` for main table and `status === "pending"` for logs view.
- [x] Step 5: TypeScript compile check (`npx tsc --noEmit`) and production build verification (`npm run build`).
- [x] Step 6: Commit and push to main.

## Changes Made
- `app/(storefront)/account/orders/page.tsx`: Added `.neq("status", "pending")` so unpaid checkouts are omitted from customer order history.
- `app/(storefront)/account/orders/[id]/page.tsx`: Added 404 gate if customer navigates to a pending order URL.
- `app/(storefront)/account/page.tsx`: Added `.neq("status", "pending")` on recent orders.
- `app/admin/page.tsx`: Total order count & recent orders now exclude `pending` orders.
- `app/admin/orders/page.tsx`: Added top action toggles: `Paid Orders (N)` and `📋 Order Logs (N)` with seamless tab switching via `?view=logs`.

## Review & Notes
- TypeScript compiler passed with 0 errors.
- Production build passed across all 38 static and dynamic routes.

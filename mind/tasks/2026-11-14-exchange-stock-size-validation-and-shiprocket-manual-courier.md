---
title: "Exchange In-Stock Size Filtering & Shiprocket Manual Courier Selection"
date: 2026-11-14
status: completed
tags:
  - task
  - storefront
  - admin
  - db
---

# Task: Exchange In-Stock Size Filtering & Shiprocket Manual Courier Selection

> [!info] Objective
> 1. Restrict customer size exchanges to only sizes that currently have stock (`stock > 0`) for that product; disable out-of-stock sizes and prevent selecting the current size.
> 2. Add backend validation in `app/api/orders/[id]/returns/route.ts` to ensure requested exchange sizes have available inventory.
> 3. Update Shiprocket fulfillment to create orders on Shiprocket without auto-assigning courier/AWB, allowing store admin to manually select the cheapest delivery service in the Shiprocket dashboard.

## Context & Links
- Relates to: [[PRD]], [[architecture]], [[rules]]
- Preceded by: [[2026-11-13-return-exchange-customer-and-menu-tees|Customer Return & Exchange Flow]]

## Implementation Plan
- [x] Step 1: Update `app/(storefront)/account/orders/[id]/page.tsx` to fetch available variants & stock for each order item's product
- [x] Step 2: Update `components/account/customer-order-actions.tsx` to display real-time stock for exchange sizes, disable `stock <= 0` and current size, and alert if all sizes are out of stock
- [x] Step 3: Add server-side stock validation in `app/api/orders/[id]/returns/route.ts`
- [x] Step 4: Update Shiprocket order push in `app/api/admin/orders/[id]/fulfill/route.ts` and `lib/shiprocket.ts` so orders are pushed to Shiprocket in "New/Processing" status for manual courier selection without auto-assigning expensive couriers
- [x] Step 5: Update admin order status manager in `components/admin/order-status-manager.tsx` with "Push to Shiprocket" button and direct link to pick courier
- [x] Step 6: Run typecheck (`npm run typecheck`) and Next.js production build (`npm run build`)
- [x] Step 7: Commit, push to `main`, and update task status

## Changes Made
- `app/(storefront)/account/orders/[id]/page.tsx`: Queries product variants (by variant ID and product name fallback) to pass live size inventory to the client actions modal.
- `components/account/customer-order-actions.tsx`:
  - Added size stock badge chips (`In stock`, `Only X left`, `Out of stock`, `Current size`).
  - Disabled selection of out-of-stock sizes and currently owned size.
  - Added warning banner if no alternate sizes are available in stock.
- `app/api/orders/[id]/returns/route.ts`:
  - Added backend validation verifying exchange size exists and has `stock > 0` before allowing exchange request submission.
- `lib/shiprocket.ts`:
  - Exported `pushOrderToShiprocket(payload)` which calls `createShiprocketOrder` without calling `/courier/assign/awb`.
- `app/api/admin/orders/[id]/fulfill/route.ts`:
  - Pushes order details to Shiprocket, stores `shiprocket_order_id` and `shipment_id`, sets status to `confirmed`, and records note for manual courier selection.
- `components/admin/order-status-manager.tsx`:
  - Replaced "Ship with Shiprocket" with "Push to Shiprocket".
  - Added "Pushed to Shiprocket" status banner with direct link to `https://app.shiprocket.in/orders/processing`.

## Review & Notes
- Prevents customers from requesting exchanges for sizes that are out of stock.
- Gives the merchant full control to pick the lowest courier rates in Shiprocket.

---
title: "Checkout Packaging Charge (₹9) & Free Delivery Above ₹2,000"
date: 2026-11-14
status: completed
tags:
  - task
  - storefront
  - payment
---

# Task: Checkout Packaging Charge (₹9) & Free Delivery Above ₹2,000

> [!info] Objective
> 1. Add ₹9 packaging charge to checkout orders.
> 2. Implement free delivery for cart values above ₹2,000 (subtotal >= 2,000 without shipping or packaging fees).
> 3. Enforce pricing and packaging fees strictly on the backend (`lib/pricing.ts`, `lib/razorpay.ts`, `/api/create-order`, `/api/verify-payment`) without storing or trusting packaging amounts in the frontend cart store.

## Context & Links
- Relates to: [[PRD]], [[architecture]], [[security]]
- Relevant rules: [[rules]]

## Implementation Plan
- [x] Step 1: Create `lib/pricing.ts` with authoritative pricing logic (packaging: ₹9, free shipping: subtotal >= ₹2,000, else ₹99).
- [x] Step 2: Update `lib/razorpay.ts` (`calculateVerifiedCartTotal`) to authoritatively compute verified subtotal, free delivery qualification, packaging fee, and genuine total.
- [x] Step 3: Update `app/api/verify-payment/route.ts` to save genuine totals and pass packaging fee to Resend order confirmation email.
- [x] Step 4: Update `lib/email/templates.ts` and `lib/email/resend.ts` to include packaging fee in email breakdown.
- [x] Step 5: Update storefront UI (`app/(storefront)/checkout/page.tsx`, `app/(storefront)/cart/page.tsx`, `components/storefront/cart-drawer.tsx`, `app/(storefront)/account/orders/[id]/page.tsx`, `app/admin/orders/[id]/page.tsx`) to show the breakdown and dynamic free delivery incentive banner.
- [x] Step 6: Verify with `npm run typecheck` and `npm run build`.
- [x] Step 7: Commit, push to `main`, and mark task completed.

## Changes Made
- `lib/pricing.ts`: Added canonical calculation helper `calculateOrderPricing(subtotal)`.
- `lib/razorpay.ts`: Backend recalculates genuine subtotal from DB, sets shipping to ₹0 if subtotal >= ₹2,000 (else ₹99), adds ₹9 packaging fee, and computes the tamper-proof Razorpay order total.
- `app/api/verify-payment/route.ts`: Stores verified totals and includes packaging fee in order metadata & email.
- `lib/email/templates.ts` & `lib/email/resend.ts`: Added packaging fee row and Free shipping badge to customer confirmation email.
- `app/(storefront)/checkout/page.tsx`: Displays subtotal, delivery (Free if >= ₹2,000), packaging charge (₹9), and free delivery incentive banner.
- `app/(storefront)/cart/page.tsx` & `components/storefront/cart-drawer.tsx`: Updated breakdown and added live "Add ₹X more for FREE Delivery" progress indicator.
- `app/(storefront)/account/orders/[id]/page.tsx` & `app/admin/orders/[id]/page.tsx`: Displays packaging fee in order receipts.

## Review & Notes
- Packaging charge is NOT stored in client-side storage or cart store; it is computed authoritatively by the server.
- Free delivery threshold is evaluated strictly on the items subtotal before delivery or packaging charges.

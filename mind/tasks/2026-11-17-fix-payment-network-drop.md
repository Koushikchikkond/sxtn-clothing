---
title: Fix payment network drop — order not created on mobile UPI
date: 2026-11-17
status: completed
tags: [task, payment, storefront]
---

# Fix: Payment Network Drop — Order Not Created

Linked: [[rules]] [[architecture]] [[security]]

## Problem

Customer paid ₹2,207 via UPI on iPhone Safari. Razorpay captured the payment but
the order never appeared in admin because `fetch("/api/verify-payment")` dropped
when the browser resumed after switching to UPI app.

## Root Cause

Order creation only happened inside `/api/verify-payment`. If client dropped the
connection (mobile Safari throttles background fetches), no order was saved and
the webhook had no existing order row to update.

## Checklist

- [x] `/api/create-order` — pre-save a `pending` order + items to DB before the Razorpay modal opens (non-fatal if DB fails; Razorpay order still returned)
- [x] `/api/verify-payment` — check for existing `pending` order by `razorpay_order_id`; upgrade it to `paid` + decrement stock + send email instead of inserting a duplicate
- [x] `/api/verify-payment` — if webhook already promoted order to `paid`, return success idempotently
- [x] `/api/webhooks/razorpay` — existing code already handles `pending→paid` upgrade via `order.paid` event (added clarifying comment)
- [x] `checkout/page.tsx` — retry `fetch("/api/verify-payment")` up to 3× with 1.2s/2.4s backoff before showing error; improved error message includes payment ID for support
- [x] TypeScript check passes (`tsc --noEmit` exit 0)
- [x] Committed & pushed to `main` (commit `b12449a`)

## Changes Made

- `app/api/create-order/route.ts`
- `app/api/verify-payment/route.ts`
- `app/api/webhooks/razorpay/route.ts`
- `app/(storefront)/checkout/page.tsx`

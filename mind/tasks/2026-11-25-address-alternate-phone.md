---
title: "Add Alternative Phone Number (Primary & Secondary) to Address List"
date: 2026-11-25
status: completed
tags:
  - task
  - storefront
  - checkout
---

# Task: Add Alternative Phone Number (Primary & Secondary) to Address List

> [!info] Objective
> Add an alternative/secondary phone number field alongside the primary phone number in the address list and checkout address form, enforcing that primary and secondary phone numbers cannot be the same.

## Context & Links
- Relates to: [[PRD]], [[architecture]]
- Relevant rules: [[rules]]

## Implementation Plan
- [x] Inspect existing address schema, account addresses page, and checkout usage
- [x] Create shared helper `lib/address.ts` (`parseAddressMeta`, `encodeAddressMeta`, `validatePhonePair`)
- [x] Update `app/(storefront)/account/addresses/page.tsx` with Primary & Secondary phone inputs, mismatch validation, and card display
- [x] Update `app/(storefront)/checkout/page.tsx` and `app/api/verify-payment/route.ts` to support Primary & Secondary phone on saved addresses and checkout orders
- [x] Display Secondary phone in order details (`app/(storefront)/account/orders/[id]/page.tsx`, `app/admin/orders/[id]/page.tsx`), email template (`lib/email/templates.ts`), and Shiprocket (`lib/shiprocket.ts`)
- [x] Run assert self-check and `npx tsc --noEmit`
- [x] Update `mind/tasks/README.md`

## Changes Made
- [lib/address.ts](file:///d:/personal%20project/SXTN_Webapp/lib/address.ts): Added address metadata parser/encoder and `validatePhonePair` rejecting matching primary/secondary phone numbers.
- [app/(storefront)/account/addresses/page.tsx](file:///d:/personal%20project/SXTN_Webapp/app/(storefront)/account/addresses/page.tsx): Added Primary Phone & Secondary/Alternative Phone inputs, live duplicate-number error, and card rendering.
- [app/(storefront)/checkout/page.tsx](file:///d:/personal%20project/SXTN_Webapp/app/(storefront)/checkout/page.tsx): Added Secondary phone input, validation, saved-address card display, and payload propagation.
- [app/api/verify-payment/route.ts](file:///d:/personal%20project/SXTN_Webapp/app/api/verify-payment/route.ts): Preserved secondary phone when auto-saving address to `addresses`.
- [app/(storefront)/account/orders/[id]/page.tsx](file:///d:/personal%20project/SXTN_Webapp/app/(storefront)/account/orders/%5Bid%5D/page.tsx): Displayed Primary & Secondary phone in Ship To.
- [app/admin/orders/[id]/page.tsx](file:///d:/personal%20project/SXTN_Webapp/app/admin/orders/%5Bid%5D/page.tsx): Displayed Primary & Secondary phone in Shipping To.
- [lib/email/templates.ts](file:///d:/personal%20project/SXTN_Webapp/lib/email/templates.ts): Included secondary phone in confirmation email shipping block.
- [lib/shiprocket.ts](file:///d:/personal%20project/SXTN_Webapp/lib/shiprocket.ts): Included alternate phone in `billing_address_2`/`shipping_address_2`.

## Review & Notes
- Stored secondary phone inside `addresses.line2` metadata (`[Tag | Alt: <num>]`) to ship safely without requiring manual Supabase SQL migration; `orders.shipping_address` JSONB also stores `secondaryPhone` cleanly.
- Assert self-check and `npx tsc --noEmit` passed cleanly.

---
title: "Checkout Email Verification & Smart Pre-Payment Review"
date: 2026-11-19
status: completed
tags:
  - task
  - storefront
  - payment
---

# Task: Checkout Email Verification & Smart Pre-Payment Review

> [!info] Objective
> Prevent customers from placing orders with misspelled or invalid email addresses (e.g. typos like @gamil.com or mistyped usernames) by adding real-time inline typo suggestions, MX DNS domain validation, and prominent pre-payment email confirmation in checkout.

## Context & Links
- Relates to: [[PRD]], [[architecture]]
- Relevant rules: [[rules]], [[security]]

## Implementation Plan
- [x] Step 1: Create email validation helper `lib/email-validator.ts` with common typo domain detection (e.g. gamil.com -> gmail.com, yaho -> yahoo.com) and RFC format check.
- [x] Step 2: Create lightweight validation endpoint `/api/checkout/validate-email` with DNS MX resolution to ensure domain can receive mail without blocking on timeouts.
- [x] Step 3: Update `app/(storefront)/checkout/page.tsx` with real-time typo correction chip ("Did you mean user@gmail.com? Tap to fix").
- [x] Step 4: Add bold email review banner right above "PAY INR XXX" button with 1-click edit shortcut.
- [x] Step 5: Add safety gate before opening Razorpay if typo is detected.
- [x] Step 6: Fix product item size truncation in Order Summary so sizes (S, M, L) are never cut off.
- [x] Step 7: Thorough testing, TypeScript typecheck (`npx tsc --noEmit`), and production build verification (`npm run build`).

## Changes Made
- `lib/email-validator.ts`: Domain typo dictionary, TLD typo detection, and RFC 5322 regex validation.
- `app/api/checkout/validate-email/route.ts`: Node.js MX DNS resolution endpoint with fail-open fallback.
- `app/(storefront)/checkout/page.tsx`: Real-time typo chip, onBlur validation, smart pre-payment email review banner in Order Summary, and size truncation fix.
- `app/api/create-order/route.ts`: Sanitization and trimming/lowercasing for guest emails.
- `app/api/verify-payment/route.ts`: Sanitization and trimming/lowercasing for order address emails.

## Review & Notes
- Passed `npx tsc --noEmit` with 0 type errors.
- Passed `npm run build` with 0 build errors across all 38 static and dynamic routes.

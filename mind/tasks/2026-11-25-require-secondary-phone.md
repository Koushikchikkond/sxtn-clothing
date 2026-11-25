---
title: "Make Secondary / Alternative Phone Number Compulsory"
date: 2026-11-25
status: completed
tags:
  - task
  - storefront
  - checkout
---

# Task: Make Secondary / Alternative Phone Number Compulsory

> [!info] Objective
> Make the secondary / alternative phone number mandatory across the address book and checkout forms, while preserving the 10-digit check and `primary !== secondary` validation.

## Context & Links
- Relates to: [[PRD]], [[architecture]], [[2026-11-25-address-alternate-phone]]
- Relevant rules: [[rules]]

## Implementation Plan
- [x] Update `validatePhonePair` in `lib/address.ts` to require a valid 10-digit secondary phone
- [x] Mark Secondary / Alternative Phone input & label as required (`*`) in `app/(storefront)/account/addresses/page.tsx` and `app/(storefront)/checkout/page.tsx`
- [x] Run assert self-check and `npx tsc --noEmit`
- [x] Complete task note and update `mind/tasks/README.md`

## Changes Made
- [lib/address.ts](file:///d:/personal%20project/SXTN_Webapp/lib/address.ts): Made secondary phone mandatory in `validatePhonePair`.
- [app/(storefront)/account/addresses/page.tsx](file:///d:/personal%20project/SXTN_Webapp/app/(storefront)/account/addresses/page.tsx): Added `required` attribute and `*` label to Secondary / Alternative Phone input.
- [app/(storefront)/checkout/page.tsx](file:///d:/personal%20project/SXTN_Webapp/app/(storefront)/checkout/page.tsx): Added `required` attribute and `*` label to Secondary / Alternative Phone input.

## Review & Notes
- Legacy saved addresses missing a secondary phone will prompt the user to fill it in during checkout or edit.
- Assert self-check and `npx tsc --noEmit` passed.

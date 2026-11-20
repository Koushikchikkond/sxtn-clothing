---
title: "Customer Care & Storefront Updates"
date: 2026-11-20
status: completed
tags:
  - task
  - storefront
  - admin
---

# Task: Customer Care & Storefront Updates

> [!info] Objective
> 1. Disable return/exchange requests 1 day (24 hours) after order delivery date.
> 2. Add "Collections" in sidebar menu with dynamic/mapped "Hoodies" and "Tees" mapped to admin collections.
> 3. Allow address updates/editing, "Set as default", and address tagging ("Home", "Office", etc.) in customer address menu.
> 4. Remove "#6XTN #STREETWEAR" badge from 3D Circular Customer Showcase.

## Context & Links
- Relates to: [[PRD]], [[architecture]]
- Relevant rules: [[rules]]

## Implementation Plan
- [x] Initialize Obsidian task note
- [x] Enforce 1-day (24h) return/exchange policy in backend API (`app/api/orders/[id]/returns/route.ts`) and storefront order detail UI (`components/account/customer-order-actions.tsx`)
- [x] Add Collections submenu (Hoodies, Tees, and all dynamic collections) in sidebar drawer with proper routing (`components/storefront/header.tsx` & `app/(storefront)/collections/[slug]/page.tsx`)
- [x] Implement Address editing, default setting, and tag selection ("Home", "Office", etc.) in `/account/addresses` and checkout display (`app/(storefront)/account/addresses/page.tsx` & `app/(storefront)/checkout/page.tsx`)
- [x] Remove "#6XTN #STREETWEAR" badge from `components/storefront/community-gallery-section.tsx`
- [x] Run typechecks (`tsc --noEmit`) and build verification (`npm run build`)
- [x] Update Obsidian documentation & push code to production

## Changes Made
- `app/api/orders/[id]/returns/route.ts`: Added 24-hour delivery timestamp comparison rejecting expired requests.
- `components/account/customer-order-actions.tsx`: Added remaining window indicator and disabled/notice banner when expired beyond 24h.
- `app/(storefront)/account/orders/[id]/page.tsx`: Passed `orderUpdatedAt={order.updated_at}` to `CustomerOrderActions`.
- `components/storefront/header.tsx`: Created dynamic "Collections" section in full screen drawer featuring Tees, Hoodies, and admin-defined collections.
- `app/(storefront)/collections/[slug]/page.tsx`: Robust slug matching for singular/plural aliases (`hoodie`/`hoodies`, `tees`/`t-shirts`) and dynamic admin collections.
- `app/(storefront)/account/addresses/page.tsx`: Full address edit support, default address checkbox/button, and tag selector (Home, Office, Other).
- `app/(storefront)/checkout/page.tsx`: Display formatted address tags on saved address cards.
- `components/storefront/community-gallery-section.tsx`: Removed the `#6XTN #STREETWEAR` / `#6XTN COMMUNITY` hashtag badge.

## Review & Notes
- TypeScript checks and full production build passed cleanly.

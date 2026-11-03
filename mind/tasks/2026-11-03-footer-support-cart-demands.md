---
title: "Storefront Info & Support, Cart Stock Validation, and Admin Demands"
date: 2026-11-03
status: completed
tags:
  - task
  - storefront
  - admin
  - db
---

# Task: Storefront Info & Support, Cart Stock Validation, and Admin Demands

> [!info] Objective
> 1. Update footer Info list (remove FAQ, update Support email to `6xtn.in@gmail.com`, remove phone number).
> 2. Implement About, Contact, Privacy, and Terms static pages with user-provided brand copy.
> 3. Add live stock validation in Cart (mark out-of-stock and removed products, disable checkout for unavailable items).
> 4. Display Out of Stock badges and "Notify Me" buttons on home page feed, collections, and PDP.
> 5. Create `product_demands` table and dedicated Admin Demands section (`/admin/demands`).

## Context & Links
- Relates to: [[PRD]], [[architecture]], [[rules]], [[design-system-and-ui]]
- Task Index: [[README|Tasks Archive]]

## Implementation Plan
- [x] Step 1: Update `components/storefront/footer.tsx` (remove FAQ, remove phone, update email to `6xtn.in@gmail.com`).
- [x] Step 2: Create static pages (`/about`, `/contact`, `/privacy`, `/terms`) with 6XTN brand copy and contact details.
- [x] Step 3: Create database migration `supabase/migrations/20241103_product_demands.sql` for customer stock alerts / demands.
- [x] Step 4: Create API endpoint `POST /api/demands` to store customer demand requests.
- [x] Step 5: Create API endpoint `POST /api/cart/validate` to check live stock & active status for cart items.
- [x] Step 6: Update `components/storefront/cart-drawer.tsx` and `app/(storefront)/cart/page.tsx` with live stock/removal badges and checkout gate.
- [x] Step 7: Update `components/storefront/product-card.tsx`, `app/page.tsx`, and `components/storefront/product-details.tsx` with Out of Stock overlay & "Notify Me" modal.
- [x] Step 8: Create `/admin/demands` page and add "Demands" navigation item in `components/admin/admin-sidebar.tsx`.
- [x] Step 9: Verify TypeScript compilation (`pnpm typecheck`) with zero errors.

## Changes Made
- Modified `components/storefront/footer.tsx`: Removed FAQ link from desktop & mobile footer Info list; removed phone number; updated support email to `6xtn.in@gmail.com`.
- Modified `components/account/customer-order-actions.tsx`: Updated customer support email from `support@6xtn.in` to `6xtn.in@gmail.com`.
- Created `app/(storefront)/(static)/about/page.tsx`: Added user's brand identity text ("6XTN is a name I created...").
- Created `app/(storefront)/(static)/contact/page.tsx`: Added brand contact layout, hours (Mon-Sat, 12PM-6PM IST), and official email `6xtn.in@gmail.com`.
- Created `app/(storefront)/(static)/privacy/page.tsx`: Added comprehensive privacy policy detailing Razorpay payments, Shiprocket logistics, and customer rights.
- Created `app/(storefront)/(static)/terms/page.tsx`: Added standard e-commerce DTC terms of service for India.
- Created `supabase/migrations/20241103_product_demands.sql`: SQL migration creating `product_demands` table with RLS policies and performance indexes.
- Created `app/api/demands/route.ts`: Secure endpoint for submitting customer email restock notifications (`POST`), status updates (`PATCH`), and cleanup (`DELETE`).
- Created `app/api/cart/validate/route.ts`: Live inventory validation endpoint checking variant stock and parent product active status.
- Modified `components/storefront/cart-drawer.tsx` & `app/(storefront)/cart/page.tsx`: Added real-time stock and catalog status badges ("Out of stock", "Removed from catalog"), warning banners, 1-click removal, and checkout prevention for unavailable items.
- Created `components/storefront/notify-me-modal.tsx`: Brutalist restock notification modal with size selection, email validation, and feedback state.
- Modified `components/storefront/product-card.tsx` & `app/page.tsx`: Added Out of Stock badges, dimmed imagery, and "Notify Me" modal triggers across home feed and collection grids.
- Modified `components/storefront/product-details.tsx`: Integrated `NotifyMeModal` when a variant or size is out of stock.
- Created `app/admin/demands/page.tsx` & `components/admin/demands-manager.tsx`: Full-featured Admin Demands dashboard with stats, restock links, customer contact links, and notification status toggles.
- Modified `components/admin/admin-sidebar.tsx`: Added "Demands" navigation tab.

## Review & Notes
- TypeScript compilation passed cleanly with 0 errors (`pnpm typecheck`).
- The database migration `supabase/migrations/20241103_product_demands.sql` needs to be run in the Supabase SQL editor.

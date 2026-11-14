---
title: "Admin Sidebar Returns & Exchanges Navigation and Dedicated Management Page"
date: 2026-11-14
status: completed
tags:
  - task
  - admin
  - db
---

# Task: Admin Sidebar Returns & Exchanges Navigation and Dedicated Management Page

> [!info] Objective
> Add a dedicated "Returns & Exchanges" link in the left Admin Sidebar and create a central admin page (`/admin/returns`) where store admins can view, filter, and manage all customer return and size exchange requests across all orders.

## Context & Links
- Relates to: [[PRD]], [[architecture]]
- Relevant rules: [[rules]], [[security]]
- Preceded by: [[2026-11-13-return-exchange-customer-and-menu-tees|Customer Return & Exchange Flow]]

## Implementation Plan
- [x] Step 1: Add "Returns & Exchanges" to `NAV` in `components/admin/admin-sidebar.tsx`
- [x] Step 2: Create `/admin/returns/page.tsx` displaying all return/exchange requests with summary metric cards, status filters (All, Requested, Approved, Picked Up, Completed, Rejected), request details, and direct links to manage each order
- [x] Step 3: Verify TypeScript typing and run `npm run typecheck`
- [x] Step 4: Run production build verification (`npm run build`)
- [x] Step 5: Commit, push to `main`, and update Obsidian task tracking

## Changes Made
- `components/admin/admin-sidebar.tsx`: Added "Returns & Exchanges" item to desktop sidebar and mobile bottom tab navigation with transfer/exchange icon.
- `components/admin/returns-table-manager.tsx`: Interactive client dashboard with metric cards, status filter tabs (All, Pending, In Transit, Completed, Rejected), type filter (Exchanges vs Returns), search bar, and full requests table.
- `app/admin/returns/page.tsx`: Server component with `requireAdmin()` auth guard that fetches all `order_returns` records joined with order details.

## Review & Notes
- Direct sidebar access (`/admin/returns`) allows viewing every return and exchange request across all customers without digging into individual orders.
- Typecheck and full Next.js production build (`next build`) passed with 0 errors.


## Review & Notes
- Provides a centralized command center for reverse logistics in addition to the per-order management view.

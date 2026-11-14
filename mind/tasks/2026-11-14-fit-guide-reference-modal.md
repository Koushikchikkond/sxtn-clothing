---
title: "Boxy Fit vs Regular Fit Guide Note on Size Selection & Add to Cart"
date: 2026-11-14
status: completed
tags:
  - task
  - storefront
---

# Task: Boxy Fit vs Regular Fit Guide Note on Size Selection & Add to Cart

> [!info] Objective
> When a customer selects a size or adds a t-shirt to cart, display a clean, lightweight fit guide reference popup/modal comparing Regular Fit vs Boxy Fit with the reference image. The modal/note must feature a small optimized image, a close button (X) and an "Understood" / "Got It" button. The reference image is stored in Cloudflare R2 and served from R2 (with local fallback).

## Context & Links
- Relates to: [[PRD]], [[architecture]]
- Relevant rules: [[rules]]

## Implementation Plan
- [x] Step 1: Upload the reference image (`media_1794653639519_638ca54a.jpg`) to Cloudflare R2 bucket as `site/fit-guide-boxy-vs-regular.webp` (~9 KB) and `site/fit-guide-boxy-vs-regular.jpg` (and store an optimized copy in `/public/images/fit-guide.webp` as static fallback)
- [x] Step 2: Create a reusable `<FitGuideModal />` in `components/storefront/fit-guide-modal.tsx` with optimized R2 image, 'X' close button, and 'Understood' button
- [x] Step 3: Trigger the note when selecting size / adding t-shirt to cart in `components/storefront/product-details.tsx` and in `components/account/customer-order-actions.tsx`
- [x] Step 4: Run typecheck (`npm run typecheck`) and Next.js production build (`npm run build`)
- [x] Step 5: Commit, push to `main`, and update task status

## Changes Made
- `scripts/upload-fit-guide-r2.mjs`: Script that processed the reference image with `sharp` to 800px WebP (~9 KB) and uploaded it to Cloudflare R2 (`https://pub-424a99ce2b4c4f80be87dfa7907a0911.r2.dev/site/fit-guide-boxy-vs-regular.webp`).
- `public/images/fit-guide.webp`: Local static fallback for the optimized fit guide image.
- `components/storefront/fit-guide-modal.tsx`: Reusable modal displaying the comparison image, size tip, top-right 'X' close button, and 'Understood & Add to Bag' / 'Understood' buttons.
- `components/storefront/product-details.tsx`:
  - Added "Fit Guide (Boxy vs Regular)" link button above size selection.
  - Added inline fit cut note below size selection.
  - Triggers the fit guide confirmation note when clicking "Add to Bag" on t-shirts before adding to cart (unless already acknowledged in the session).
- `components/account/customer-order-actions.tsx`:
  - Added "Fit Guide" link in the Exchange size selector so customers can check the boxy vs regular silhouette comparison before selecting replacement sizes.

## Review & Notes
- Extremely lightweight (~9 KB WebP) served via Cloudflare R2 CDN for fast, instant loading.
- Enhances customer sizing confidence and minimizes size-related exchanges.

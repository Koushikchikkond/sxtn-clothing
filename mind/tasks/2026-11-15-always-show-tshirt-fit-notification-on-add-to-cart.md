---
title: "Always Show T-Shirt Fit Notification on Every Add to Cart"
date: 2026-11-15
status: completed
tags:
  - task
  - storefront
---

# Task: Always Show T-Shirt Fit Notification on Every Add to Cart

> [!info] Objective
> Ensure the Boxy Fit vs Regular Fit notification modal appears every single time a customer adds a t-shirt to their bag, rather than silencing after the first acknowledgment.

## Context & Links
- Relates to: [[PRD]], [[architecture]]
- Relevant rules: [[rules]]
- Preceded by: [[2026-11-14-fit-guide-reference-modal|Boxy Fit vs Regular Fit Guide Note on Size Selection & Add to Cart]]

## Implementation Plan
- [x] Step 1: Remove session caching (`hasAcknowledgedFit` & `sessionStorage`) in `components/storefront/product-details.tsx`.
- [x] Step 2: Ensure `handleAddToCart` triggers `FitGuideModal` every time `isTee` is true unless confirmed via modal action (`skipFitNotice = true`).
- [x] Step 3: Run typecheck (`npm run typecheck`) and build verification (`npm run build`).
- [x] Step 4: Commit and update task log.

## Changes Made
- `components/storefront/product-details.tsx`:
  - Removed `sessionStorage` persistence and session acknowledgment state.
  - Configured `handleAddToCart` to open `FitGuideModal` on every "Add to Bag" click for t-shirts.
  - Clicking "Understood & Add to Bag" in the modal completes that specific add-to-bag action. Any subsequent addition triggers the notification again.

## Review & Notes
- Prevents customer surprise regarding boxy fit sizing by ensuring every addition is confirmed with the visual guide.

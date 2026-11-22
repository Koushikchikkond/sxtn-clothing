---
title: "Interface Craft Cards Horizontal Scroll Customer Review Showcase"
date: 2026-11-22
status: completed
tags:
  - task
  - storefront
  - reviews
---

# Task: Interface Craft Cards Horizontal Scroll Customer Review Showcase

> [!info] Objective
> Replace the auto-scrolling customer review marquee with Aceternity UI's Interface Craft Cards (`@aceternity/interface-crafts-cards`).
> Feature manual horizontal scrolling (no auto-scroll marquee, users scroll at their own pace), card-by-card addition from Supabase reviews, interactive tilt/scale animations with spring physics, `#ff6d75` heart ratings, and responsive mobile/desktop fit.

## Context & Links
- Relates to: [[PRD]], [[architecture]]
- Relevant rules: [[rules]]

## Implementation Plan
- [x] Initialize Obsidian task note
- [x] Create `components/ui/interface-craft-cards.tsx` based on Aceternity UI's Cards component with motion spring physics
- [x] Implement `CustomerReviewsCraftCards` in `components/storefront/customer-reviews-marquee.tsx`:
  - [x] Remove auto-scrolling marquee tag and CSS keyframes
  - [x] Build responsive horizontal scrolling rail with `overflow-x-auto`, `snap-x`, and smooth touch/drag scrolling
  - [x] Add Left / Right navigation arrows for desktop scrolling
  - [x] Map live customer reviews from Supabase with fallback streetwear cards
  - [x] Render 5 coral-red heart icons (`#ff6d75`)
  - [x] Enable tap-to-expand / active focus with spring physics and full customer comment reveal
- [x] Ensure compatibility with `app/page.tsx` via component aliases (`CustomerReviewsMarquee` and `CustomerReviewsCraftCards`)
- [x] Run `npx tsc --noEmit` and `npm run build` (verified: 0 errors, 38/38 pages built)
- [x] Complete task note and update `mind/tasks/README.md`

## Changes Made
- `components/ui/interface-craft-cards.tsx`: Added Aceternity UI Interface Craft Cards primitive with spring physics, rotation offsets, and active card expansion.
- `components/storefront/customer-reviews-marquee.tsx`: Replaced marquee animation with manual horizontal scroll rail, touch-friendly swipe, desktop arrows, coral-red heart ratings (`#ff6d75`), verified buyer badge, location tag, and spring card transitions.
- `mind/tasks/2026-11-22-interface-craft-cards-review-showcase.md`: Created and completed task log.
- `mind/tasks/README.md`: Added task to archive index.

## Review & Notes
- Tested with `npx tsc --noEmit`: 0 TypeScript errors.
- Verified with `npm run build`: All 38 routes successfully generated with Next.js 16.3.4 (Turbopack).

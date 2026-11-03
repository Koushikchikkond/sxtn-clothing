---
title: "Remove Keyboard Arrow Navigation from Product Gallery"
date: 2026-11-03
status: completed
tags:
  - task
  - storefront
  - ui
---

# Task: Remove Keyboard Arrow Navigation from Product Gallery

> [!info] Objective
> Remove global window keyboard arrow listeners (`ArrowLeft`/`ArrowRight`) from the product gallery while keeping touch swipe gestures and onscreen left/right switcher buttons intact.

## Context & Links
- Relates to: [[PRD]], [[architecture]], [[rules]], [[design-system-and-ui]]
- Task Index: [[README|Tasks Archive]]

## Implementation Plan
- [x] Step 1: Remove window `keydown` listener and unused `useCallback` hook in `components/storefront/product-details.tsx`.
- [x] Step 2: Verify touch swipe gestures (`handleTouchStart`, `handleTouchEnd`) and onscreen arrow buttons are retained.
- [x] Step 3: Run `pnpm typecheck` to verify zero regressions.
- [x] Step 4: Mark task as completed.

## Changes Made
- `components/storefront/product-details.tsx`: Removed the global `window.addEventListener("keydown")` listener for `ArrowLeft`/`ArrowRight` and cleaned up unused `useCallback` imports, preserving touch swipe gestures and onscreen left/right click navigation.

## Review & Notes
- Tested with `pnpm typecheck` (`tsc --noEmit`) - passed cleanly with 0 errors.

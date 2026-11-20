---
title: "Animated Curved Menu Integration (Left Side)"
date: 2026-11-20
status: completed
tags:
  - task
  - storefront
---

# Task: Animated Curved Menu Integration (Left Side)

> [!info] Objective
> Integrate the 21st.dev animated curved menu component into the SXTN storefront:
> - Keep styling, colors, and animated icon AS IS (white background, black animated 3-bar/X icon, white curve SVG, letter-by-letter hover animation).
> - Position menu and trigger on the LEFT side.
> - Update navigation items to match SXTN: Home, Shop All, Tees, Hoodies, Account, Orders, Wishlist.
> - Ensure SSR safety for Next.js (no window.innerHeight crash during build).
> - Do NOT push to production until user confirms.

## Context & Links
- Relates to: [[PRD]], [[architecture]], [[rules]]
- Touched files:
  - `components/ui/curved-menu.tsx`
  - `components/storefront/header.tsx`

## Implementation Plan
- [x] Initialize Obsidian task note
- [x] Create `components/ui/curved-menu.tsx` with left-side geometry, SSR-safe curve SVG, and SXTN navigation items
- [x] Update `components/storefront/header.tsx` to integrate the curved menu
- [x] Run `npx tsc --noEmit` and verify 0 TypeScript errors
- [x] Run `npm run build` and verify full static page compilation
- [x] Theme inside menu from white to black (bg-[#0a0a0a], text-white, fill: #0a0a0a on curve)
- [x] Theme menu icon to black/dark (remove white background, resize slightly smaller: 9x9 / 10x10, align properly in header row)
- [x] Group Tees, Hoodies & other categories under "Collections" expandable submenu
- [x] Fix storefront Header, Footer, and CartDrawer leaking into `/admin` routes via `usePathname().startsWith("/admin")`
- [x] Remove Twitter and GitHub icons from menu footer (retaining Instagram & 6XTN.IN)
- [x] Make menu trigger button transparent (removed black box and border, styled with subtle hover)
- [x] Run typecheck & build test
- [ ] Present changes to the user for review without pushing to production

## Changes Made
- `components/ui/curved-menu.tsx`: Built Left-side sliding panel (`h-[100dvh] w-screen max-w-screen-sm fixed left-0 top-0`), transparent animated toggle icon with 3 white bars rotating into 'X', curved SVG edge on the right border (`fill: #0a0a0a`), letter-by-letter hover animation, and social footer (Instagram & 6XTN.IN only).
- `components/storefront/header.tsx`: Added `usePathname().startsWith("/admin")` check so storefront header unmounts cleanly on all admin routes.
- `components/storefront/footer.tsx`: Converted to client component and added `usePathname().startsWith("/admin")` guard.
- `components/storefront/cart-drawer.tsx`: Added `usePathname().startsWith("/admin")` guard.

## Review & Notes
- Tested build: compiled successfully, TypeScript passed, 38/38 static pages generated cleanly.
- Code has NOT been pushed to production, awaiting user confirmation.

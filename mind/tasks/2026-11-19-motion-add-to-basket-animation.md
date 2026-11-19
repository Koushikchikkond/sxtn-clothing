---
title: "Interactive Motion Add-to-Basket Flight Animation"
date: 2026-11-19
status: completed
tags:
  - task
  - storefront
---

# Task: Interactive Motion Add-to-Basket Flight Animation

> [!info] Objective
> Integrate the 21st.dev `motion-add-to-basket` flight arc animation into the SXTN storefront whenever a customer adds a product to the cart. The product tile flies along a parabolic Bezier arc into the cart icon, with rotation, velocity impulse spring on the cart icon, and expanding ripple ping. Once verified, push code to production.

## Context & Links
- Relates to: [[PRD]], [[architecture]]
- Relevant rules: [[rules]]

## Implementation Plan
- [x] Create `components/ui/motion-add-to-basket.tsx` and utility CSS based on the 21st.dev prompt.
- [x] Create standalone demo in `components/ui/motion-add-to-basket-demo.tsx`.
- [x] Create `lib/cart-flight.ts` with `flyProductToBasket()` leveraging the quadratic Bezier arc mixer from 21st.dev.
- [x] Update `components/storefront/header.tsx` with targeted cart IDs and data attributes for desktop and mobile navigation.
- [x] Integrate flight animation into `components/storefront/product-details.tsx` when user adds product to cart, triggering thumbnail launch, rotational arc, cart button bounce, and ping ring on impact.
- [x] Verify TypeScript (`npx tsc --noEmit`) and Next.js build (`npm run build`).
- [x] Push to production with 0 errors.

## Changes Made
- `package.json` & `pnpm-lock.yaml`: Added `motion` dependency.
- `components/ui/motion-add-to-basket.tsx`: Core component with arc mixer, Bezier curve mathematics, and BasketIcon.
- `components/ui/motion-add-to-basket-utils/index.css`: Styles for tile, cart icon, ripple ping, and global flying flyer.
- `components/ui/motion-add-to-basket-demo.tsx`: Interactive demo component.
- `lib/cart-flight.ts`: Global fly-to-cart animation controller detecting visible cart icons and launching the product thumbnail in a parabolic arc with spring bounce and ping ring on arrival.
- `components/storefront/header.tsx`: Added targeting selectors on desktop, mobile top bar, and mobile bottom capsule bag icons.
- `components/storefront/product-details.tsx`: Hooked "Add to Bag" action to `flyProductToBasket()`.

## Review & Notes
- Tested and verified with both `npx tsc --noEmit` and `npm run build` exiting code 0.
- Fully compatible with mobile touch and desktop viewports.

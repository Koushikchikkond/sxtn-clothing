---
title: "Customer Community Photos Gallery & Admin Banner Section with 3D Circular Animation"
date: 2026-11-19
status: completed
tags:
  - task
  - storefront
  - admin
---

# Task: Customer Community Photos Gallery & Admin Banner Section with 3D Circular Animation

> [!info] Objective
> Implement a customer photo showcase section on the homepage right after the t-shirt grid displaying customers wearing 6XTN brand tees, powered by the 3D rotating `CircularGallery` animated component from 21st.dev. Provide management and upload capabilities in the Admin Banner section, with direct Cloudflare R2 uploads and Supabase persistence. Keep code local without pushing to production until user confirms.

## Context & Links
- Relates to: [[PRD]], [[architecture]]
- Relevant rules: [[rules]]

## Implementation Plan
- [x] Create `components/ui/circular-gallery.tsx` from the 21st.dev prompt with proper Tailwind, TypeScript, touch/mouse drag gestures, responsive radius, and auto-rotation.
- [x] Create `lib/community-gallery.ts` for database fetching/storing in `site_settings` (key: `community_gallery`) with defaults and Redis cache fallback.
- [x] Build `components/storefront/community-gallery-section.tsx` with streetwear styling ("WORN BY YOU / #6XTN CLUB", responsive radius, drag/scroll interaction, modern aesthetics).
- [x] Embed the gallery section at the end of the t-shirt grid on the homepage (`app/page.tsx`).
- [x] Add community photo gallery management into the Admin Banner section (`app/admin/hero-banner/page.tsx`), allowing admins to add/delete/reorder customer photos, customer handles, caption/t-shirt name, and upload images to Cloudflare R2.
- [x] Create `/api/admin/community-gallery` API route for GET/POST.
- [x] Verify TypeScript (`npx tsc --noEmit`) and Next.js build (`npm run build`).
- [x] Keep code local (DO NOT push to production until user explicitly confirms).

## Changes Made
- `components/ui/circular-gallery.tsx`: 3D cylinder rotating gallery component with mouse/touch drag, scroll sensitivity, responsive radius, and auto-rotation.
- `lib/community-gallery.ts`: Server-side data helpers with Supabase `site_settings` upsert/fetch, Upstash Redis caching, and curated default streetwear items.
- `components/storefront/community-gallery-section.tsx`: Homepage section positioned after the t-shirt grid with Instagram link, hashtag badge, and interactive hints.
- `app/page.tsx`: Embedded `<CommunityGallerySection config={communityGallery} />` right after the product drops grid.
- `components/admin/community-gallery-manager.tsx`: Dedicated admin manager with direct Cloudflare R2 upload (`/api/upload` -> `products/community-gallery/`), client-side WebP compression, reordering, photo cards, and live 3D circular simulator preview.
- `app/admin/hero-banner/page.tsx`: Added tab switcher for "Hero Banner Carousel" and "Customer Photos Gallery (3D Motion)".
- `components/admin/admin-sidebar.tsx`: Renamed navigation label to "Banners & Gallery".
- `app/api/admin/community-gallery/route.ts`: Secure admin API route for fetching and saving community gallery settings.

## Review & Notes
- Tested R2 uploads with `PutObjectCommand` into existing `sxtn-images` bucket. Uploads are stored under `products/community-gallery/` and served via Cloudflare R2's CDN.
- All 38 Next.js routes built cleanly with code 0.
- Changes are strictly kept local per user instruction ("dont push this code to the production untile i say").

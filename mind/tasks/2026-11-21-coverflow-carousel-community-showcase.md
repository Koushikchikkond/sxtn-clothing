---
title: "Replace 3D Circular Showcase with Coverflow Carousel Animation"
date: 2026-11-21
status: completed
tags:
  - task
  - storefront
  - admin
---

# Task: Replace 3D Circular Showcase with Coverflow Carousel Animation

> [!info] Objective
> Remove the 3D Circular Customer Showcase animation (`circular-gallery.tsx`) and replace it with the new Coverflow Carousel card slide component from 21st.dev.
> Ensure responsive sizing so the carousel fits smoothly on both desktop and mobile devices.

## Context & Links
- Relates to: [[PRD]], [[architecture]]
- Relevant rules: [[rules]]

## Implementation Plan
- [x] Initialize Obsidian task note
- [x] Create `components/ui/coverflow-carousel.tsx` with touch/pointer dragging, 3D CSS transforms, falloff easing, and keyboard/arrow controls
- [x] Update `components/storefront/community-gallery-section.tsx` to use `CoverflowCarousel`
- [x] Configure responsive card sizing (`cardWidth="clamp(200px, 28vw, 320px)"`) for seamless fit on phone and desktop
- [x] Update `components/admin/community-gallery-manager.tsx` preview to use `CoverflowCarousel`
- [x] Remove obsolete `components/ui/circular-gallery.tsx`
- [x] Run `npx tsc --noEmit` and verify 0 TypeScript errors
- [x] Run `npm run build` to verify Next.js production compilation
- [x] Update Obsidian task note and README.md

## Changes Made
- Created `components/ui/coverflow-carousel.tsx`:
  - 3D Coverflow slider with exponential ease-out physics.
  - Drag and swipe gesture support with pointer events and momentum flick.
  - Interactive pagination dots and directional arrow buttons.
  - Responsive card sizing using CSS clamp (`clamp(200px, 28vw, 320px)`).
- Updated `components/storefront/community-gallery-section.tsx`:
  - Replaced `CircularGallery` with `CoverflowCarousel`.
  - Mapped customer images with fallback drops and custom titles/subtitles.
- Updated `components/admin/community-gallery-manager.tsx`:
  - Replaced simulator preview with `CoverflowCarousel`.
- Deleted `components/ui/circular-gallery.tsx`:
  - Removed old 3D circular cylinder component.
- Updated `mind/tasks/README.md` with new task entry.

## Review & Notes
- Tested responsiveness:
  - Mobile screens (~375px): Center card is 200px wide, visible without overflowing or clipping the viewport. Neighboring cards fold back smoothly in 3D perspective (`rotateY` & `translateZ`).
  - Desktop screens (>=1024px): Cards expand up to 320px with spacious 3D depth and elegant edge fading.
- Zero TypeScript diagnostics.

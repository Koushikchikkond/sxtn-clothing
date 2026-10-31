---
title: "SXTN Design System & UI Components"
date: 2026-10-29
tags:
  - brain
  - design-system
  - ui
  - tailwind
  - animations
  - typography
---

# 🎨 SXTN Design System & UI Components

> [!abstract] Brand Aesthetic
> SXTN embodies a modern, luxury brutalist streetwear visual identity inspired by platforms like bluorng.com. It favors bold high-contrast monochrome tones, sharp architectural corners (`0px` border radius), oversized typography, and buttery-smooth micro-interactions.

---

## 1. Design Tokens & Variables (`app/globals.css`)

### Color Palette
```css
/* Core Monochrome Scale */
--sxtn-black:    #000000;
--sxtn-white:    #ffffff;
--sxtn-gray-50:  #f9f9f9;
--sxtn-gray-100: #f2f2f2;
--sxtn-gray-200: #e5e5e5;
--sxtn-gray-300: #d4d4d4;
--sxtn-gray-400: #a3a3a3;
--sxtn-gray-500: #737373;
--sxtn-gray-600: #525252;
--sxtn-gray-700: #404040;
--sxtn-gray-800: #262626;
--sxtn-gray-900: #171717;

/* Semantic Variables */
--background:    var(--sxtn-black);
--foreground:    var(--sxtn-white);
--border:        var(--sxtn-gray-800);
--card:          var(--sxtn-gray-900);
```

### Typography Scale
- **Display Font**: `Space Grotesk` (Google Font)
  - Used for headings (`h1`–`h4`), drop titles, collection banners, and price numbers.
  - Characterized by tight tracking, uppercase styling, and brutalist geometric cuts.
- **Body Font**: `Plus Jakarta Sans` (Google Font)
  - Used for body copy, specifications, forms, and product descriptions.
  - Ultra-crisp rendering across mobile Retina and desktop screens.

### Spatial Constraints & Shapes
- **Border Radius**: Strictly **`0px`** for the brutalist storefront (`--radius: 0px`). No pill buttons or rounded cards.
- **Header**: Fixed top bar (`h-16`) with black backdrop, subtle border (`border-white/10`), and marquee ticker support.

---

## 2. Animation & Motion Rules

Implemented using **Framer Motion 12** and **Lenis** inertia scrolling:

1. **Lenis Smooth Scroll** ([`app/smooth-scrolling.tsx`](file:///d:/personal%20project/SXTN_Webapp/app/smooth-scrolling.tsx)):
   Wraps the application in a Lenis provider to deliver weightless luxury scrolling while preserving native anchor tags.

2. **Animation Durations**:
   - Micro-interactions (button press, hover): `150ms` (`--duration-fast`)
   - Drawer slide-over & dropdowns: `250ms` (`--duration-normal`)
   - Page transitions & gallery swipes: `400–500ms` (`--duration-page`)

3. **Accessibility**:
   All motion components must respect `prefers-reduced-motion`. On devices where reduced motion is enabled, transitions instantly swap states without sliding or fading.

---

## 3. Storefront UI Component Catalog

| Component | Path | Key Capabilities |
|---|---|---|
| **Header** | `components/storefront/header.tsx` | Fixed navigation, collection links, live search bar, cart drawer toggle with active count badge, account link |
| **HeroBannerSlider** | `components/storefront/hero-banner-slider.tsx` | Dynamic hero carousel with automated slide timer, mobile/desktop image swapping, and headline overlays |
| **ProductCard** | `components/storefront/product-card.tsx` | Secondary image hover reveal, price comparison (sale badge), quick-add button, wishlist toggle |
| **ProductGrid** | `components/storefront/product-grid.tsx` | Responsive CSS grid (2 cols mobile, 3–4 cols desktop) with empty drop fallbacks |
| **ProductDetails** | `components/storefront/product-details.tsx` | Thumbnail image gallery, size selector with inventory badges, sticky mobile add-to-cart bar |
| **CartDrawer** | `components/storefront/cart-drawer.tsx` | Slide-over drawer, quantity adjustments, item removal, free shipping meter, direct checkout button |
| **WishlistButton** | `components/storefront/wishlist-button.tsx` | Heart icon toggle supporting guest localStorage and logged-in account sync |
| **Footer** | `components/storefront/footer.tsx` | Brand manifesto, policy navigation links, newsletter signup, copyright notice |

---

## 4. Admin UI Component Catalog

| Component | Path | Key Capabilities |
|---|---|---|
| **AdminSidebar** | `components/admin/admin-sidebar.tsx` | Sticky dark navigation sidebar with active link highlights and quick storefront exit |
| **ProductForm** | `components/admin/product-form.tsx` | Multi-image uploader, size matrix generator (S/M/L/XL/XXL stock inputs), bullet editor, slug generator |
| **ImageUpload** | `components/admin/image-upload.tsx` | Direct drag-and-drop file upload to Cloudflare R2 bucket with live preview and reordering |
| **OrderStatusManager** | `components/admin/order-status-manager.tsx` | Manual status transitions with trigger for customer notifications |


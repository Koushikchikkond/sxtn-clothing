---
title: "SXTN Routes & Page Catalog"
date: 2026-10-29
tags:
  - brain
  - routing
  - pages
  - nextjs
  - app-router
---

# 🛣️ SXTN Routes & Page Catalog

> [!abstract] Overview
> SXTN leverages the Next.js 16 App Router with route groups `(storefront)`, `(auth)`, `admin`, and `api`. Route groups provide clear layout isolation between customer-facing storefronts, account dashboards, and the administrative backend.

---

## 1. Storefront Routes `app/(storefront)`

All storefront routes share the root layout in [`app/layout.tsx`](file:///d:/personal%20project/SXTN_Webapp/app/layout.tsx), which provides the fixed brutalist [`Header`](file:///d:/personal%20project/SXTN_Webapp/components/storefront/header.tsx), slide-over [`CartDrawer`](file:///d:/personal%20project/SXTN_Webapp/components/storefront/cart-drawer.tsx), and [`Footer`](file:///d:/personal%20project/SXTN_Webapp/components/storefront/footer.tsx).

### 1. Homepage (`app/page.tsx`)
- **URL**: `/`
- **Rendering**: Server Component (SSR)
- **Features**:
  - Fetches the dynamic hero banner from `site_settings` via `getHeroBanner()`
  - Renders the [`HeroBannerSlider`](file:///d:/personal%20project/SXTN_Webapp/components/storefront/hero-banner-slider.tsx) with autoplay, progress indicators, and responsive mobile/desktop URLs
  - Fetches latest 8 active drops from `products` joined with `product_images`
  - Integrated [`WishlistButton`](file:///d:/personal%20project/SXTN_Webapp/components/storefront/wishlist-button.tsx) on each product card

### 2. Product Detail Page (PDP) (`app/(storefront)/products/[slug]/page.tsx`)
- **URL**: `/products/[slug]`
- **Rendering**: Incremental Static Regeneration (ISR) with `revalidate = 60` and `generateStaticParams()`
- **Features**:
  - Fetches product, images ordered by position, and variants (sizes, stock, price override)
  - Interactive [`ProductDetails`](file:///d:/personal%20project/SXTN_Webapp/components/storefront/product-details.tsx) client component
  - Size selector with disabled out-of-stock states
  - Sticky bottom "Add to Cart" bar on mobile viewports
  - Related product recommendations based on category
  - Breadcrumbs navigation

### 3. Collections & Catalog (PLP) (`app/(storefront)/collections/[slug]/page.tsx`)
- **URL**: `/collections/[slug]` (or `/collections/all`)
- **Rendering**: Server Component with ISR
- **Features**:
  - Category filtering, price sorting, and responsive product grid
  - Shows sale badges if `compare_at_price > price`

### 4. Cart View (`app/(storefront)/cart/page.tsx`)
- **URL**: `/cart`
- **Rendering**: Client Component
- **Features**:
  - Full-page alternative to the slide-over cart drawer
  - Quantity adjusters capped by variant stock
  - Free shipping progress bar (threshold: ₹999)
  - Subtotal and estimated tax/shipping breakdown

### 5. Checkout Flow (`app/(storefront)/checkout/page.tsx`)
- **URL**: `/checkout`
- **Rendering**: Client Component (`"use client"`)
- **Features**:
  - Two-column responsive checkout (form + order summary)
  - Supports guest checkout (email only) or authenticated checkout
  - Saved address selector for logged-in users with option to save new address to profile
  - Indian states & cities dropdowns via [`lib/data/india-locations.ts`](file:///d:/personal%20project/SXTN_Webapp/lib/data/india-locations.ts)
  - Razorpay standard checkout popup invocation (`Razorpay(options).open()`)
  - Redirects to `/order-success?orderId=...` on payment confirmation

### 6. Order Success (`app/(storefront)/order-success/page.tsx`)
- **URL**: `/order-success`
- **Rendering**: Server Component
- **Features**:
  - Displays confirmed order ID, delivery estimate, shipping address snapshot, and order receipt
  - Clears client-side cart upon landing

### 7. Customer Account Area (`app/(storefront)/account/`)
- Protected by user authentication; redirects unauthenticated visitors to `/login?next=/account`.
- **Pages**:
  - `/account`: Overview with user profile, total orders count, and recent purchases
  - `/account/orders`: Full paginated order history with live status badges
  - `/account/orders/[id]`: Detailed order tracking with courier name, tracking number (AWB), and Shiprocket live link
  - `/account/addresses`: Saved shipping address management (add, edit, delete, set default)
  - `/account/wishlist`: Grid of bookmarked items with one-click "Move to Cart"

### 8. Static / Editorial Pages (`app/(storefront)/(static)/`)
- Clean, SEO-optimized policy and brand pages:
  - `/about`: Brand vision, philosophy, aesthetic roots
  - `/contact`: Customer support channels, email, response SLAs
  - `/faq`: Sizing guides, delivery times, payment options
  - `/shipping-policy`: Dispatch timelines, delivery partners, free shipping thresholds
  - `/returns`: 7-day return policy and exchange instructions

---

## 2. Authentication Routes `app/(auth)`

- Minimalist brutalist styling matching the brand identity.
- **Pages**:
  - `/login`: Email + password authentication with remember-me and redirect support (`?next=...`)
  - `/signup`: Customer registration with full name, email, and password; triggers `handle_new_user()`
  - `/forgot-password`: Password reset request triggering Supabase reset email
  - `/auth/callback`: Server route handler exchanging OAuth/magic link auth codes for session cookies

---

## 3. Admin Panel Routes `app/admin`

Protected by [`app/admin/layout.tsx`](file:///d:/personal%20project/SXTN_Webapp/app/admin/layout.tsx) which queries `public.profiles.role = 'admin'`. Non-admins are immediately redirected to the storefront homepage.

- **`/admin`**: Dashboard overview showing total revenue, pending orders count, active products, and low-stock alerts.
- **`/admin/products`**: Product inventory table with live search, category filters, stock counts, and visibility toggles.
- **`/admin/products/new`**: Comprehensive product creation form with multi-image drag-and-drop upload to Cloudflare R2, size/variant matrix generator, pricing, tags, and bulleted descriptions.
- **`/admin/products/[id]/edit`**: Edit existing product details, reorder images, and adjust variant stock levels.
- **`/admin/orders`**: Master order queue showing order statuses (`pending`, `paid`, `confirmed`, `shipped`, `delivered`, `cancelled`).
- **`/admin/orders/[id]`**: Granular order management:
  - Shows line items, customer contact, and payment IDs
  - One-click Shiprocket fulfillment trigger
  - Manual status override manager ([`components/admin/order-status-manager.tsx`](file:///d:/personal%20project/SXTN_Webapp/components/admin/order-status-manager.tsx))
- **`/admin/hero-banner`**: Live hero banner management for updating desktop/mobile slider URLs and promotional copy.
- **`/admin/collections`**: Category management (create categories, upload category banner images, reorder positions).

---

## 4. API Endpoints Catalog `app/api`

| Endpoint | Method | Runtime | Auth | Purpose |
|---|---|---|---|---|
| `/api/create-order` | `POST` | `nodejs` | Public (Rate Limited) | Recalculates genuine cart price from DB and creates Razorpay Order |
| `/api/verify-payment` | `POST` | `nodejs` | Public (Rate Limited) | Validates HMAC signature, saves order, calls stock decrement RPC, sends email |
| `/api/checkout/create-order` | `POST` | `nodejs` | Public (Rate Limited) | Alias/proxy to `/api/create-order` |
| `/api/checkout/verify-payment` | `POST` | `nodejs` | Public (Rate Limited) | Alias/proxy to `/api/verify-payment` |
| `/api/orders/[id]/cancel` | `POST` | `nodejs` | Authenticated Owner / Admin | Cancels order and restores stock via `increment_variant_stock` |
| `/api/upload` | `POST` | `nodejs` | Admin Only | Uploads product assets to Cloudflare R2 bucket |
| `/api/admin/hero-banner` | `POST` | `nodejs` | Admin Only | Saves hero slider configuration to `site_settings` |
| `/api/admin/orders/[id]/fulfill` | `POST` | `nodejs` | Admin Only | Dispatches order to Shiprocket and fetches AWB number |
| `/api/admin/orders/[id]/status` | `PATCH` | `nodejs` | Admin Only | Updates order status and triggers customer status update email |
| `/api/webhooks/razorpay` | `POST` | `nodejs` | HMAC Signature | Fallback payment reconciliation webhook |
| `/api/webhooks/shiprocket` | `POST` | `nodejs` | Token Header | Realtime courier delivery status sync |


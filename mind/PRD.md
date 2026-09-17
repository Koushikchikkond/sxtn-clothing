# PRD — SXTN (Clothing Brand E-Commerce Store)

## 1. Overview
SXTN is a direct-to-consumer streetwear/clothing brand. This PRD covers the web
platform: a customer-facing store (browse, cart, checkout, account) and an
internal admin panel (products, orders, inventory). Visual/interaction
inspiration: bluorng.com (clean product-first UI, smooth micro-interactions,
bold typography). Animations sourced from transitions.dev + Framer Motion.

## 2. Goals
- Launch a fast, mobile-first store that feels premium (not template-generic).
- Support full purchase flow: browse → PDP → cart → checkout → payment → order
  confirmation → order tracking.
- Give the brand a lightweight admin panel to manage products, variants
  (size/color), stock, and orders without touching code.
- Keep infra cost near-zero until real revenue justifies upgrades.

## 3. Non-Goals (Out of Scope for v1)
- Multi-vendor marketplace features.
- Native mobile app.
- Subscription/recurring billing.
- Multi-currency / international shipping (India-only for v1).
- Advanced recommendation engine (can add later).

## 4. Target Users
- **Shopper**: Gen-Z/young-adult buyer, mobile-heavy browsing, expects fast
  load and smooth transitions, price-sensitive but responds to strong visuals.
- **Admin/Brand owner**: Non-technical, needs a simple dashboard to add
  products, update stock, and see/manage orders.

## 5. Core Features

### 5.1 Customer-Facing
| Feature | Description |
|---|---|
| Home page | Hero banner(s), featured drops/collections, new arrivals grid |
| Collections/PLP | Filter by category, size, color, price; sort; pagination or infinite scroll |
| Product Detail Page (PDP) | Image gallery (swipe/zoom), size & color selector, stock status, add-to-cart, related products |
| Cart | Slide-in drawer (mini-cart) + full cart page, quantity update, remove item, promo code field |
| Checkout | Guest checkout allowed; address form; shipping method; Razorpay payment; order review step |
| Auth | Email/password + optional Google OAuth via Supabase Auth; signup/login/forgot-password |
| Account dashboard | Order history, order detail/tracking status, saved addresses, profile edit |
| Wishlist | Add/remove products, view saved items (requires login) |
| Search | Basic product search (name/tags), instant results dropdown |
| Static pages | About, Contact, Shipping Policy, Returns/Exchange, FAQ, Terms, Privacy |

### 5.2 Admin Panel (protected route, role-based)
| Feature | Description |
|---|---|
| Product management | Create/edit/delete products, variants (size/color/stock), images, pricing, categories |
| Inventory | Stock levels per variant, low-stock indicator |
| Order management | View orders, update status (pending/confirmed/shipped/delivered/cancelled), view customer/shipping info |
| Category management | Create/edit collections/categories |
| Basic dashboard | Total orders, revenue (simple sum), recent orders widget |

## 6. Key User Stories
- As a shopper, I can browse collections and filter by size/color so I only
  see items relevant to me.
- As a shopper, I can add a product to cart from the PDP and see the cart
  update instantly with a smooth drawer animation.
- As a shopper, I can check out as a guest without creating an account.
- As a shopper, I can pay via UPI/card/netbanking through Razorpay.
- As a shopper, I can view my past orders and their current status.
- As an admin, I can add a new product with multiple images and variants in
  under 3 minutes.
- As an admin, I can mark an order as "shipped" and the customer can see the
  updated status.

## 7. Non-Functional Requirements
- **Performance**: Lighthouse score ≥ 90 (mobile) for home/PLP/PDP. Images
  lazy-loaded and served via Next/Image + Supabase Storage CDN.
- **SEO**: SSR/SSG product & collection pages, proper meta tags, sitemap.xml,
  structured data (Product schema) for rich snippets.
- **Accessibility**: Keyboard navigable, proper alt text, respects
  `prefers-reduced-motion` for all transitions.
- **Security**: Supabase Row Level Security on all tables; no service-role key
  exposed client-side; Razorpay signature verification server-side.
- **Responsiveness**: Mobile-first; breakpoints for tablet/desktop.
- **Reliability**: Payment webhook idempotency (no duplicate orders on retry).

## 8. Visual/Interaction Direction
- Product-grid-first homepage, minimal chrome, bold sans-serif type — similar
  density and rhythm to bluorng.com.
- Micro-interactions from transitions.dev: mini-cart drawer slide, button
  hover/press states, skeleton loaders while products fetch, toast
  notifications on add-to-cart, accordion for PDP details (size guide,
  materials, shipping info), tab-sliding for account dashboard sections.
- Page-level transitions (route change, image gallery zoom) via Framer Motion.

## 9. Success Metrics (v1)
- Checkout completion rate (cart → paid order).
- Page load time (LCP) on PDP.
- Admin time-to-publish a new product.
- Zero payment/order data mismatches (webhook reliability).

## 10. Milestones (maps to BUILD_PROMPT.md phases)
1. Project scaffold + design system
2. Database + auth
3. Product catalog (browse/PDP)
4. Cart
5. Checkout + payments
6. Account/orders
7. Admin panel
8. Animation/SEO/perf polish
9. Testing + deploy

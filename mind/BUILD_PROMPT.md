# BUILD_PROMPT.md — SXTN Build Plan (Brick by Brick)

Feed each phase to Claude Code **one at a time, in order**. Don't skip ahead.
Before Phase 0, put `PRD.md`, `architecture.md`, and `rules.md` in the repo
root — reference them explicitly in every prompt so the agent stays
consistent across sessions.

Master instruction to paste at the start of every session:
> "Read PRD.md, architecture.md, and rules.md in this repo before doing
> anything. Follow them exactly — tech stack, folder structure, and coding
> rules are not optional. Ask me before deviating from any of them."

---

## PHASE 0 — Project Scaffold & Design System Foundation

```
Read PRD.md, architecture.md, and rules.md first.

Set up the base project for SXTN, a clothing e-commerce store:

1. Initialize a Next.js 15 app (App Router, TypeScript, Tailwind CSS,
   pnpm) matching the exact folder structure in architecture.md section 3.
2. Install and configure: shadcn/ui, framer-motion (package name "motion"
   is fine too, use "framer-motion"), zustand, @tanstack/react-query,
   react-hook-form, zod, @supabase/supabase-js, @supabase/ssr.
3. Create lib/supabase/client.ts and lib/supabase/server.ts per
   architecture.md (do NOT create admin.ts yet, that's Phase 2).
4. Set up tailwind.config.ts with a placeholder SXTN brand theme: a bold
   sans-serif display font for headings, a neutral base font for body,
   a mostly black/white/one-accent-color palette (I'll finalize the exact
   hex codes later — use sensible placeholders and make them easy to swap
   in one place).
5. Create .env.example with all variables listed in architecture.md
   section 6.
6. Create a minimal root layout.tsx with a placeholder header/footer and
   confirm the dev server runs clean with no TS errors.

Do not build any actual product/cart features yet — this phase is scaffold
only. Show me the final folder tree when done.
```

---

## PHASE 1 — Database Schema, Auth & Supabase Setup

```
Read architecture.md section 4 (Database Schema) and rules.md section 2
(Supabase rules) before starting.

1. Write SQL migration files in supabase/migrations/ that create every
   table listed in architecture.md section 4, in dependency order
   (categories → products → product_images/product_variants → profiles →
   addresses → orders → order_items → wishlists).
2. Enable RLS on every table and write the policies described in
   architecture.md section 4 (public read for active products/categories,
   owner-only read/write for orders/addresses/wishlists, admin override).
3. Add a Postgres trigger that auto-creates a `profiles` row when a new
   `auth.users` row is created (default role 'customer').
4. Create lib/supabase/admin.ts (service-role client) — server-only file,
   never imported by any client component. Add a comment at the top
   warning against client-side use.
5. Build the auth pages: /login, /signup, /forgot-password using Supabase
   Auth (email/password). Use react-hook-form + zod for validation.
   Style with shadcn/ui form components.
6. Generate types/database.types.ts from the schema and wire it into both
   supabase clients for full type safety.

Confirm RLS works by describing the test you'd run (or write it as a
Playwright/manual test) for: an anonymous user cannot read another user's
orders.
```

---

## PHASE 2 — Product Catalog: Categories, PLP, PDP

```
Read PRD.md section 5.1 (Collections/PLP, PDP) and rules.md section 2
(Next.js, Styling, Animation rules) before starting.

1. Seed supabase/seed.sql with ~15 sample products across 3-4 categories,
   each with 2-3 variants (size/color) and 2-4 placeholder images, so the
   UI has real data to render against.
2. Build components/storefront/ProductCard, ProductGrid, and CategoryFilter
   (filter by category/size/color/price, sort by price/newest).
3. Build /collections/[slug]/page.tsx as a Server Component: fetch products
   for that category from Supabase, render ProductGrid, apply filters via
   URL search params (so filtering is shareable/bookmarkable).
4. Build /products/[slug]/page.tsx (PDP): image gallery (swipeable on
   mobile, thumbnail strip on desktop), size/color selector (disable
   out-of-stock variants), quantity stepper, add-to-cart button, an
   accordion for description/materials/shipping info (use a transitions.dev
   accordion pattern), and a "related products" row.
5. Add a skeleton loading state (transitions.dev skeleton-to-content
   pattern) for the product grid while data streams in.
6. Ensure both pages are Server Components fetching data directly — only
   the interactive bits (gallery, selectors, add-to-cart button) are
   Client Components.

Reference bluorng.com's product-grid density and clean typography as the
visual bar — bold headings, generous whitespace, image-forward layout.
```

---

## PHASE 3 — Cart

```
Read PRD.md section 5.1 (Cart) and rules.md (Animation, Zustand naming)
before starting.

1. Build lib/stores/useCartStore.ts (Zustand, persisted to localStorage
   for guests): add item, remove item, update quantity, compute subtotal.
   Cart items reference product_variant_id + a denormalized snapshot
   (name, price, size, color, image) so the cart still renders correctly
   even if the product later changes.
2. Build components/cart/CartDrawer.tsx: a slide-in drawer (adapt the
   transitions.dev "panel reveal" / cart-drawer pattern) that opens on
   add-to-cart, shows line items, subtotal, and a checkout CTA.
3. Wire "Add to cart" on the PDP to: (a) push to the Zustand store, (b) open
   the drawer, (c) fire a toast notification (transitions.dev toast
   pattern) confirming the add.
4. Build /cart/page.tsx as a full-page cart view (same data, different
   layout) for users who navigate there directly.
5. Add a small persistent cart icon in the header showing item count with
   a subtle pop/bounce animation when it changes.

All monetary calculations shown here are for display only — remind me in
your summary that Phase 4 (checkout) will recompute everything server-side
before payment, per rules.md.
```

---

## PHASE 4 — Checkout & Razorpay Payments

```
Read PRD.md section 5.1 (Checkout), architecture.md section 5 (Payment
Flow), and rules.md (Payments rules) carefully — this phase handles real
money, follow the server-side verification rules exactly.

1. Build /checkout/page.tsx: a multi-step flow (address → review →
   payment) using tab-sliding transition between steps. Support both
   guest checkout (email + address, no login) and logged-in checkout
   (pick saved address).
2. Build a Server Action `createOrder(cartItems, addressOrGuestInfo)` that:
   - Re-fetches current price + stock for each variant from Supabase
     (never trusts the client's cart prices).
   - Rejects if any item is out of stock.
   - Creates a Razorpay Order via the Razorpay Orders API.
   - Inserts a local `orders` row (status 'pending') + `order_items`.
   - Returns the Razorpay order id + amount to the client.
3. On the client, open Razorpay's Checkout widget with that order id.
4. Build the webhook: app/api/webhooks/razorpay/route.ts — verify the
   signature using RAZORPAY_WEBHOOK_SECRET, then on `payment.captured`:
   mark the order 'paid', decrement `product_variants.stock`, and send a
   confirmation email via Resend. Make this idempotent (check
   razorpay_payment_id before reprocessing).
5. Build /checkout/success and /checkout/failed pages. Success page reads
   order status from the DB (not from client-side payment response) before
   showing "confirmed."
6. Clear the Zustand cart store only after confirmed success.

Explain in your summary exactly where the "never trust the client" rule is
enforced in this flow.
```

---

## PHASE 5 — Account Dashboard & Order History

```
Read PRD.md section 5.1 (Account dashboard, Wishlist) before starting.

1. Build /account/page.tsx: simple dashboard with tabs (transitions.dev
   tab-sliding pattern) for Orders / Addresses / Wishlist / Profile.
2. /account/orders: list of the logged-in user's orders (status, date,
   total) fetched server-side, respecting RLS.
3. /account/orders/[id]: order detail — items, shipping address, status
   timeline (simple stepper: pending → paid → shipped → delivered).
4. /account/addresses: CRUD for saved addresses.
5. /account/wishlist: list of wishlisted products with quick add-to-cart;
   wire a heart/like icon on ProductCard and PDP to toggle wishlist status
   (transitions.dev like-button burst animation).
6. Add profile edit (name, phone) using the existing profiles table.

Confirm every query here is filtered to auth.uid() and relies on RLS, not
manual `WHERE user_id = ...` alone, per rules.md.
```

---

## PHASE 6 — Admin Panel

```
Read PRD.md section 5.2 (Admin panel) and rules.md (Admin Panel rules)
before starting.

1. Build app/admin/layout.tsx: server-side check that
   profiles.role === 'admin' for the current session; redirect non-admins.
   Simple sidebar nav (Dashboard, Products, Categories, Orders).
2. /admin/page.tsx: basic dashboard — total orders, total revenue (sum of
   paid orders), recent orders table.
3. /admin/products: table of all products with search + edit/delete;
   /admin/products/new and /admin/products/[id]/edit: a form (react-hook-
   form + zod) to create/edit product name, description, price, category,
   multiple variants (size/color/stock), and image upload to the
   `product-images` Supabase Storage bucket.
4. /admin/categories: simple CRUD for categories.
5. /admin/orders: table of all orders with status filter;
   /admin/orders/[id]: detail view with a dropdown to update status
   (pending/confirmed/shipped/delivered/cancelled) — this write must use
   the admin (service-role) client since it bypasses the "owner-only" RLS
   policy, but must still verify the caller is an admin server-side first.

Flag clearly in your summary every place you use the service-role client
and why the regular RLS-scoped client wasn't enough.
```

---

## PHASE 7 — Animation, SEO & Performance Polish Pass

```
Read PRD.md section 8 (Visual/Interaction Direction) and rules.md
(Animation, Performance sections) before starting.

1. Do a pass across the whole storefront applying/refining transitions.dev
   patterns: page transitions between PLP→PDP (shared layout animation on
   the product image using Framer Motion layoutId), skeleton loaders
   everywhere data streams in, button hover/press states, error-state
   shake on failed form validation (checkout, login).
2. Verify every animation has a `prefers-reduced-motion` fallback.
3. Add SEO: dynamic metadata (title/description) per product/category page,
   sitemap.xml, robots.txt, Product structured data (JSON-LD) on PDPs,
   Open Graph images.
4. Run a performance pass: confirm next/image everywhere, check bundle
   size, lazy-load below-the-fold sections, verify Lighthouse mobile score
   on home/PLP/PDP is 90+.
5. Accessibility pass: keyboard nav through the whole purchase flow, alt
   text on all product images, focus states visible, color contrast check
   against the brand palette.

Give me a before/after summary of Lighthouse scores if you can run them.
```

---

## PHASE 8 — Testing & Deployment

```
Read rules.md section 5 (Testing) before starting.

1. Write a Playwright e2e test covering the critical path: browse →
   add to cart → guest checkout → Razorpay test-mode payment → order
   confirmation → order visible in account (skip account step if guest).
2. Write Vitest unit tests for: cart total calculation, checkout Zod
   schemas, and the Razorpay webhook signature verification function.
3. Set up GitHub Actions: run lint, typecheck, unit tests, and the
   Playwright smoke test on every PR.
4. Prepare production deployment: Vercel project connected to the repo,
   all env vars from .env.example set in Vercel + Supabase production
   project, Razorpay switched from test to live keys, Resend domain
   verified.
5. Give me a launch checklist: RLS policies double-checked, webhook URL
   registered in Razorpay dashboard, custom domain connected, error
   monitoring (e.g. Vercel's built-in logs or Sentry free tier) wired up.
```

---

## Notes for running this with Claude Code
- Paste the "master instruction" once per new session before Phase N's
  prompt.
- After each phase, actually run the app and click through it before
  moving to the next phase — catching drift early is much cheaper than
  fixing it after Phase 8.
- If Claude Code proposes deviating from architecture.md or rules.md (e.g.
  a different library), make it ask first — that's baked into the master
  instruction, but reinforce it if it drifts.

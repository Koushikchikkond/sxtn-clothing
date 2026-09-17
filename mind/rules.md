# Rules — SXTN Development Conventions

These rules apply to any human or AI agent (Claude Code, etc.) working on
this repo. Read `PRD.md` and `architecture.md` before writing code.

## 1. General Principles
- Ship in the order defined in `BUILD_PROMPT.md`. Don't jump ahead to admin
  panel before storefront basics work.
- Prefer boring, working code over clever code. This is a commerce site —
  bugs cost real money.
- Every feature that touches money (cart totals, checkout, payment,
  stock) must be computed/verified **server-side**, never trust client input.
- Small, reviewable commits. One logical change per commit.

## 2. Tech-Specific Rules

### Next.js / React
- Use **Server Components by default**. Only add `"use client"` when the
  component needs interactivity, state, or browser APIs.
- Use **Server Actions** for mutations instead of hand-rolled API routes,
  except for webhooks (Razorpay) which must be Route Handlers.
- Co-locate route-specific components inside the route folder if they're
  only used there; shared components go in `/components`.
- No default exports for components except `page.tsx`/`layout.tsx` (Next.js
  requires it there). Everything else: named exports.

### TypeScript
- `strict: true` in tsconfig. No `any` unless truly unavoidable (and then
  comment why).
- Generate `types/database.types.ts` from the live Supabase schema
  (`supabase gen types typescript`) and re-generate after every migration —
  never hand-write DB types.
- All Zod schemas live in `lib/validators/` and are the single source of
  truth for both client-side and server-side validation of the same data.

### Styling / UI
- Tailwind utility classes only; avoid ad-hoc inline styles.
- Use shadcn/ui components as the base; customize via `tailwind.config` theme
  tokens (colors, radius, font) rather than overriding classes ad hoc, so the
  whole site restyles from one place.
- Define the brand's color palette, type scale, and spacing once in
  `tailwind.config.ts` — pull from a mood-board decision, not per-component
  guesses.

### Animation (transitions.dev + Framer Motion)
- Every animation must respect `prefers-reduced-motion` — provide a
  no-motion fallback (opacity/instant state change).
- Use transitions.dev snippets for: cart drawer open/close, toast
  notifications, skeleton loaders, accordion (PDP details), tab-sliding
  (account dashboard), button press/hover states.
- Use Framer Motion for: page/route transitions, image gallery
  zoom/swipe, layout animations (`layoutId`) when items move between
  positions (e.g. product card → PDP hero image).
- Keep animation durations short (150–350ms) for UI feedback; longer
  (400–600ms) only for page-level transitions. Nothing should feel laggy on
  a mid-range phone.
- Don't animate for animation's sake — every transition should communicate
  state change (loading, added-to-cart, error) or spatial continuity.

### Supabase
- **Never** import the service-role key into any file that could be bundled
  client-side. It only belongs in `lib/supabase/admin.ts`, used only inside
  Server Actions/Route Handlers that explicitly need to bypass RLS (e.g.
  admin bulk operations, webhook writes).
- Every new table needs an RLS policy in the same migration that creates it.
  No table ships without RLS enabled.
- All schema changes go through numbered SQL files in `supabase/migrations/`
  — no manual dashboard edits in production once launched.

### Payments
- Recompute cart total server-side from the DB before creating a Razorpay
  order — never trust a client-submitted total.
- Verify the Razorpay webhook signature before processing it.
- Treat the webhook as the source of truth for order status, not the
  client-side redirect after payment.
- Make webhook handling idempotent (check if `razorpay_payment_id` already
  processed before decrementing stock / sending email again).

### Admin Panel
- Every admin route/action must check `profiles.role === 'admin'`
  server-side (not just hide the UI link).
- Product image uploads go to Supabase Storage in a dedicated
  `product-images` bucket with a public read policy and admin-only write
  policy.

## 3. Naming Conventions
- Files/folders: kebab-case (`product-card.tsx`).
- Components: PascalCase (`ProductCard`).
- Zustand stores: `useCartStore`, `useUiStore`.
- DB tables/columns: snake_case (matches Postgres convention).
- Zod schemas: `checkoutSchema`, `productFormSchema`.

## 4. Git / Workflow
- Branch per feature: `feat/cart-drawer`, `fix/checkout-total-mismatch`.
- Commit message format: `type(scope): message` (e.g. `feat(cart): add
  slide-in drawer with transitions.dev animation`).
- Don't commit `.env` — only `.env.example` with empty values.

## 5. Testing
- Add a Playwright smoke test for the critical path: browse → add to cart →
  checkout → payment success (mock Razorpay in test mode) → order appears
  in account. Keep this green at all times; nothing merges to `main` if this
  breaks.
- Unit test all Zod validators and any pure functions that compute totals/
  discounts.

## 6. Performance
- Use `next/image` for every image; always set width/height or `fill` with a
  sized parent.
- Paginate or virtualize product grids beyond ~40 items.
- Avoid client-side fetching for data that can be server-rendered (product
  lists, PDP data).

## 7. What NOT to do
- Don't hardcode prices, stock, or shipping fees in the frontend.
- Don't build a custom auth system — use Supabase Auth as-is.
- Don't add a second animation library "just to try it" — Framer Motion +
  transitions.dev snippets are enough for v1.
- Don't skip RLS "temporarily" — it's easy to forget to add it back.
- Don't call Razorpay APIs from the client with the secret key.

# Architecture — SXTN

## 1. Tech Stack (final)

| Concern | Choice | Notes |
|---|---|---|
| Framework | Next.js 15 (App Router), TypeScript | SSR for SEO, Server Actions for mutations |
| Styling | Tailwind CSS v4 | Utility-first, fast to theme |
| UI primitives | shadcn/ui | Copied into repo, not an npm black box — fully editable |
| Animation | Framer Motion (`motion`) + transitions.dev snippets | Framer for layout/page transitions; transitions.dev for micro-interactions (cart, buttons, skeletons, toasts) |
| Client state | Zustand | Cart store, UI toggles (drawer/modal open state) |
| Server/cache state | TanStack Query | Product lists, wishlist, order history caching |
| Forms/validation | React Hook Form + Zod | Checkout, auth, admin product forms |
| Backend | Supabase (Postgres, Auth, Storage, Realtime, Edge Functions) | Single vendor for DB+auth+storage keeps cost/complexity low |
| ORM/DB access | Supabase JS client (server + client) — Drizzle optional later for complex admin queries | Start simple, add Drizzle only if raw queries get messy |
| Payments | Razorpay (Orders API + Webhooks) | INR-native, no monthly fee |
| Email | Resend | Order confirmation, shipping update, password reset (Supabase can also handle auth emails) |
| Hosting | Vercel (web) + Supabase Cloud (backend) | Free tier both; scale independently |
| Package manager | pnpm | |
| Testing | Vitest (unit) + Playwright (e2e, checkout flow) | Add from Phase 3 onward |

## 2. High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Vercel (Next.js)                     │
│  App Router: Server Components (data fetch) +            │
│  Client Components (interactivity/animation)             │
│  Server Actions: mutations (cart→order, admin CRUD)       │
└───────────────┬───────────────────────────┬──────────────┘
                │                           │
                ▼                           ▼
      ┌──────────────────┐        ┌──────────────────┐
      │     Supabase      │        │     Razorpay      │
      │  Postgres + RLS   │        │  Orders + Webhook │
      │  Auth (JWT)        │        │  (payment verify) │
      │  Storage (images)  │        └──────────────────┘
      │  Edge Functions     │
      └──────────────────┘
                │
                ▼
        ┌──────────────┐
        │    Resend     │  (transactional email)
        └──────────────┘
```

- **Server Components** fetch product/collection data directly from Supabase
  (server-side, using anon key + RLS — safe to expose).
- **Server Actions** handle writes (add order, update cart in DB if
  persisting server-side cart, admin mutations) — never expose the Supabase
  **service role key** to the browser; only use it inside server-only code
  (webhooks, admin-privileged actions) via Route Handlers.
- **Razorpay webhook** hits a Next.js Route Handler (`/api/webhooks/razorpay`)
  which verifies signature, then writes the order as "paid" server-side —
  this is the source of truth, not the client redirect.

## 3. Folder Structure

```
sxtn/
├── app/
│   ├── (storefront)/
│   │   ├── page.tsx                     # Home
│   │   ├── collections/
│   │   │   └── [slug]/page.tsx          # PLP
│   │   ├── products/
│   │   │   └── [slug]/page.tsx          # PDP
│   │   ├── cart/page.tsx
│   │   ├── checkout/page.tsx
│   │   ├── account/
│   │   │   ├── page.tsx                 # dashboard
│   │   │   ├── orders/page.tsx
│   │   │   ├── orders/[id]/page.tsx
│   │   │   ├── addresses/page.tsx
│   │   │   └── wishlist/page.tsx
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   ├── signup/page.tsx
│   │   │   └── forgot-password/page.tsx
│   │   └── (static)/
│   │       ├── about/page.tsx
│   │       ├── contact/page.tsx
│   │       ├── shipping-policy/page.tsx
│   │       ├── returns/page.tsx
│   │       └── faq/page.tsx
│   ├── admin/
│   │   ├── layout.tsx                   # role-gated layout
│   │   ├── page.tsx                     # dashboard
│   │   ├── products/
│   │   │   ├── page.tsx
│   │   │   ├── new/page.tsx
│   │   │   └── [id]/edit/page.tsx
│   │   ├── categories/page.tsx
│   │   └── orders/
│   │       ├── page.tsx
│   │       └── [id]/page.tsx
│   ├── api/
│   │   └── webhooks/
│   │       └── razorpay/route.ts
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── ui/                              # shadcn primitives (button, input, etc.)
│   ├── transitions/                     # transitions.dev snippets adapted (cart-drawer, toast, skeleton, accordion, tabs)
│   ├── storefront/                      # ProductCard, ProductGrid, Filters, Gallery, SizeSelector
│   ├── cart/                            # CartDrawer, CartItem, CartSummary
│   ├── checkout/                        # AddressForm, PaymentStep, OrderReview
│   └── admin/                           # ProductForm, OrderTable, StockBadge
├── lib/
│   ├── supabase/
│   │   ├── client.ts                    # browser client (anon key)
│   │   ├── server.ts                    # server client (per-request, cookies)
│   │   └── admin.ts                     # service-role client, server-only
│   ├── razorpay/
│   │   ├── client.ts
│   │   └── verify-signature.ts
│   ├── validators/                      # Zod schemas (checkout, product, auth)
│   ├── stores/                          # Zustand stores (cart, ui)
│   └── utils.ts
├── types/
│   └── database.types.ts                # generated from Supabase schema
├── supabase/
│   ├── migrations/                      # SQL migrations
│   └── seed.sql
├── public/
├── .env.example
├── PRD.md
├── architecture.md
├── rules.md
└── package.json
```

## 4. Database Schema (Supabase / Postgres)

```sql
-- profiles (extends auth.users)
profiles (
  id uuid primary key references auth.users(id),
  full_name text,
  phone text,
  role text default 'customer', -- 'customer' | 'admin'
  created_at timestamptz default now()
)

categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  image_url text,
  created_at timestamptz default now()
)

products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references categories(id),
  name text not null,
  slug text unique not null,
  description text,
  price numeric(10,2) not null,
  compare_at_price numeric(10,2),
  is_active boolean default true,
  created_at timestamptz default now()
)

product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products(id) on delete cascade,
  url text not null,
  position int default 0
)

product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products(id) on delete cascade,
  size text not null,        -- S, M, L, XL...
  color text,
  sku text unique,
  stock int not null default 0,
  price_override numeric(10,2)
)

addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  line1 text, line2 text, city text, state text, pincode text,
  phone text, is_default boolean default false
)

orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),  -- nullable for guest checkout
  guest_email text,
  address_id uuid references addresses(id),
  status text default 'pending', -- pending|paid|confirmed|shipped|delivered|cancelled
  subtotal numeric(10,2),
  shipping_fee numeric(10,2) default 0,
  total numeric(10,2),
  razorpay_order_id text,
  razorpay_payment_id text,
  created_at timestamptz default now()
)

order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id) on delete cascade,
  variant_id uuid references product_variants(id),
  product_name text,        -- denormalized snapshot at time of order
  size text, color text,
  quantity int not null,
  unit_price numeric(10,2)
)

wishlists (
  user_id uuid references profiles(id),
  product_id uuid references products(id),
  primary key (user_id, product_id)
)
```

**Row Level Security (RLS)**: enabled on all tables.
- `products`, `categories`, `product_images`, `product_variants`: public
  `SELECT` for `is_active = true`; `INSERT/UPDATE/DELETE` restricted to
  `role = 'admin'`.
- `orders`, `order_items`, `addresses`, `wishlists`: user can only
  `SELECT/INSERT/UPDATE` rows where `user_id = auth.uid()`; admin role can
  read/update all orders.
- Never trust client-sent prices — server action recomputes totals from DB
  before creating a Razorpay order.

## 5. Payment Flow
1. Client calls Server Action `createRazorpayOrder(cartItems, addressId)`.
2. Server recalculates prices from DB, creates Razorpay Order via Razorpay
   API, inserts local `orders` row with status `pending`.
3. Client opens Razorpay Checkout widget with the order id.
4. On success, Razorpay redirects/callbacks client — client calls a
   confirm endpoint, **but the real confirmation is the webhook**.
5. `/api/webhooks/razorpay` verifies signature → updates `orders.status =
   'paid'`, decrements `product_variants.stock`, triggers Resend
   confirmation email.

## 6. Environment Variables (`.env.example`)
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=        # server-only, never exposed to client
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
RESEND_API_KEY=
NEXT_PUBLIC_SITE_URL=
```

## 7. Deployment
- `main` branch → Vercel production deploy.
- Supabase: one project, `staging` schema optional later; for v1 just one
  production project with careful migrations.
- CI: GitHub Actions running lint + typecheck + Playwright smoke test on PR.

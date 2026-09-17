# security.md — SXTN Vibe-Coded App Security Checklist

Source: adapted from "Vibe-Coded App Security — Part 1/4, Checks 01–18"
(@byarnieverma). Cumulative document — Part 2 (checks 19–36: web, sessions,
APIs & payments) will be merged in when available.

> **The rule:** if you cannot point to the code, setting, configuration,
> test, or log that proves a guardrail exists, treat it as missing.

This file exists because AI-built apps (this one included) tend to ship
convenient shortcuts that look fine in a demo and are unsafe in production.
Run the audit below **before every production deploy**, and again after any
change touching auth, payments, admin, or data access.

---

## How to use this

| Step | What |
|---|---|
| **01 Audit** | Run the copy/paste prompt below against the repo + deployed config |
| **02 Fix** | Every `FAIL` or `UNKNOWN` gets fixed before launch |
| **03 Verify** | Test the actual deployed path, not just the code |
| **04 Re-run** | Re-audit after any major change (new route, new table, new integration) |

## Copy/paste audit prompt

Paste this into Claude Code (or any coding agent) against the SXTN repo:

```
Act as a security reviewer for this application. Audit the repository and
deployed configuration against checks 1–18 in security.md. For every
relevant item return PASS, FAIL, UNKNOWN, or NOT APPLICABLE. Cite the exact
file, configuration or setting supporting the result. Do not mark PASS
without evidence. For FAIL or UNKNOWN, explain the realistic failure mode
in one sentence, give the smallest safe fix, and tell me how to verify it.
Prioritise anything touching authentication, authorization, private data,
payments, admin access, secrets, AI tools or spend. Do not change
production data or infrastructure during the audit.
```

Result key: **PASS** · **FAIL** · **UNKNOWN** · **N/A**

---

## Part 1: Secrets, Authentication & Input (Checks 01–18)

Stop the obvious shortcuts AI-generated apps tend to ship with.

### 01 — Exposed database credentials
Keep database usernames, passwords, and connection strings server-side;
rotate anything that was exposed.
- **SXTN-specific**: `SUPABASE_SERVICE_ROLE_KEY` and any direct Postgres
  connection string must only exist in Vercel's server-side env vars —
  never in `NEXT_PUBLIC_*` vars, never in a client component.

### 02 — Public `.env` files
Keep environment files out of Git, public builds, and static hosting; use
platform secret storage in production.
- **SXTN-specific**: confirm `.env`, `.env.local` are in `.gitignore`; only
  `.env.example` (empty values) is committed. Check Vercel project settings
  for env vars, not a checked-in file.

### 03 — Hardcoded API keys or secrets
Move private keys to server-side environment variables or a secret
manager, and rotate leaked values.
- **SXTN-specific**: `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`,
  `RESEND_API_KEY` must never appear in client bundles — grep the built
  `.next` output for these strings before deploying.

### 04 — Weak or missing authentication
Use a proven auth system and require authentication on every route that
should be private.
- **SXTN-specific**: Supabase Auth handles this — confirm `/account/*` and
  `/admin/*` routes check session server-side (middleware or per-page),
  not just hide nav links client-side.

### 05 — Missing server-side authorization
Check what the signed-in user is allowed to do on the server before every
sensitive action.
- **SXTN-specific**: every Server Action that mutates orders, addresses,
  or admin data must re-check `auth.uid()` / `profiles.role` server-side —
  never rely on the client only calling the "right" action.

### 06 — Cross-user data access
Scope reads and writes to the authenticated user or tenant so changing an
ID cannot expose someone else's data.
- **SXTN-specific**: test `/account/orders/[id]` and
  `/account/addresses/[id]` with another user's ID while logged in as a
  different user — must 403/404, not leak data. This must be enforced by
  RLS, not just app-level filtering.

### 07 — Open database permissions
Default-deny database access and grant the application only the reads and
writes it genuinely needs.
- **SXTN-specific**: every table in `supabase/migrations/` must have RLS
  **enabled** with explicit policies (see architecture.md §4). No table
  ships with RLS off "temporarily."

### 08 — Misconfigured Firebase / Supabase / S3
Review database and storage rules, then test them while signed out and as
the wrong user.
- **SXTN-specific**: test the `product-images` Storage bucket — public
  read is fine, but confirm **write** is admin-only. Test signed-out and
  as a non-admin customer.

### 09 — Unprotected admin routes
Enforce admin permissions on the server; a hidden button or secret URL is
not an access control.
- **SXTN-specific**: `app/admin/layout.tsx` must verify
  `profiles.role === 'admin'` server-side on every request, not just on
  first load. Directly hitting `/admin/orders` as a logged-in customer
  must redirect/403.

### 10 — Production debug tools exposed
Disable or strongly protect debug consoles, test routes, profilers, and
internal developer tools.
- **SXTN-specific**: no `/api/debug`, seed-data reset endpoints, or
  Next.js debug routes reachable in production. Razorpay must be in live
  mode, not test mode, at launch.

### 11 — Build logs leaking secrets
Mask credentials in CI/CD and make sure scripts never print tokens, keys,
or connection strings.
- **SXTN-specific**: check GitHub Actions logs and Vercel build logs don't
  echo env vars (e.g. no `console.log(process.env)` left in the code).

### 12 — Verbose production errors
Return generic errors to users and keep stack traces, queries, paths, and
internal details in private logs.
- **SXTN-specific**: checkout/payment failure pages must show a friendly
  message, not a raw Supabase/Razorpay error. Log full errors server-side
  (Vercel logs / Sentry), not to the client console.

### 13 — Secrets in Git history
Treat a committed secret as exposed even after deletion; rotate it and
remove it from history where appropriate.
- **SXTN-specific**: if any Razorpay or Supabase key was ever committed
  during development (common with AI-assisted scaffolding), rotate it —
  deleting the file in a later commit is not enough.

### 14 — Secrets shipped in frontend JavaScript
Anything sent to the browser is readable by users; private service
credentials must stay server-side.
- **SXTN-specific**: only `NEXT_PUBLIC_SUPABASE_URL`,
  `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and the Razorpay **public** key ID
  should ever reach the client. The anon key is safe by design (RLS
  protects it) — the service role key and Razorpay secret are not.

### 15 — Client-side-only security checks
Repeat validation, authorization, and entitlement checks on the trusted
server, not only in the UI.
- **SXTN-specific**: disabling an out-of-stock "Add to cart" button
  client-side is a UX nicety, not a control — the checkout Server Action
  must re-check stock and price from the DB (per rules.md, "never trust
  the client").

### 16 — Missing input validation
Validate type, length, format, allowed values, and size for every piece of
untrusted input on the server.
- **SXTN-specific**: every Server Action and Route Handler validates input
  with the Zod schemas in `lib/validators/` server-side — not just via
  React Hook Form on the client, which a user can bypass entirely.

### 17 — SQL injection
Use parameterized queries or safe ORM bindings instead of concatenating
user input into SQL.
- **SXTN-specific**: using the Supabase client's query builder (`.eq()`,
  `.match()`, etc.) is safe by default. Flag any raw SQL string
  concatenation in Edge Functions or admin bulk-query features.

### 18 — NoSQL injection
Validate object shapes and operators and use safe query APIs so
user-controlled objects cannot change query logic.
- **SXTN-specific**: mostly N/A on Postgres/Supabase, but applies if any
  filter/search feature builds a query object from raw user JSON (e.g. an
  admin "advanced filter" UI) — validate the shape with Zod before it
  reaches any query builder.

---

## Official sources
- [OWASP ASVS](https://owasp.org/www-project-application-security-verification-standard/)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [OWASP Authorization Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html)
- [OWASP Secrets Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
- [OWASP Input Validation Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html)

## Coming in Part 2 (checks 19–36, to be merged here)
Web, sessions, APIs & payments — directly relevant to SXTN's checkout and
Razorpay integration (session fixation, CSRF, rate limiting, webhook
replay protection, idempotency). Re-run the audit once these are added.

## Important
This is an educational security checklist, not a penetration test, legal
advice, or a guarantee the app can't be compromised. Given SXTN handles
payments and personal data (addresses, orders), a professional security
review before public launch is worth the cost.

## When to run this against SXTN specifically
- After **Phase 1** (auth + RLS) — checks 04–08.
- After **Phase 4** (checkout + Razorpay) — checks 01–03, 11–17 all apply
  directly to the payment flow.
- After **Phase 6** (admin panel) — checks 09, 10.
- Before going live with real Razorpay keys — full 01–18 pass required,
  no `UNKNOWN`s left.

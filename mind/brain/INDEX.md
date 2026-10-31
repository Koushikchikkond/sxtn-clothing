---
title: "SXTN Second Brain — Knowledge Index"
date: 2026-10-29
tags:
  - brain
  - index
  - moc
  - architecture
---

# 🧠 SXTN Webapp — Second Brain (Knowledge Base)

> [!abstract] Overview
> **SXTN (6XTN)** is a high-performance direct-to-consumer (DTC) luxury streetwear e-commerce platform built with Next.js 16 (App Router), React 19, Supabase Postgres, Tailwind CSS v4, Framer Motion, Razorpay, Shiprocket, and Cloudflare R2 / AWS S3.

This Second Brain serves as the persistent truth engine for human developers and autonomous AI coding agents working on the codebase.

---

## 🗺️ Map of Content (Brain Modules)

| Module | Description | Wikilink |
|---|---|---|
| **System Architecture** | End-to-end topology, data flow, edge routing & security boundaries | [[system-architecture]] |
| **Database Schema** | Detailed tables, constraints, RPC procedures, triggers & RLS policies | [[database-schema]] |
| **Routes & Page Catalog** | App Router map: Storefront, Customer Accounts, Admin & API endpoints | [[routes-and-pages]] |
| **State & Data Flow** | Zustand client stores, Supabase auth sessions & mutation lifecycles | [[state-and-data-flow]] |
| **Payments & Logistics** | Razorpay server-side verification, Shiprocket fulfillment & Resend emails | [[logistics-and-payments]] |
| **Design System & UI** | Brutalist aesthetic, color tokens, typography scale & motion guidelines | [[design-system-and-ui]] |
| **Security Audit Report** | Full defensive vulnerability audit, RLS policies, payment & concurrency analysis | [[security-audit-report]] |
| **Feature Status Matrix** | Implemented features, partially complete modules & backlog roadmap | [[implementation-status]] |

---

## 📚 Core Project Documentation
- [[PRD]]: Official Product Requirements Document (goals, non-goals, user flows)
- [[architecture]]: High-level architecture and technology trade-offs
- [[rules]]: Mandatory coding conventions, server/client component rules
- [[security]]: Zero-trust security guidelines and threat models
- [[BUILD_PROMPT]]: Brick-by-brick phased build history
- [[mind/tasks/README|Tasks Archive]]: History of all AI agent execution logs

---

## ⚡ Fast Reference

### Key Repositories & Tech Stack
- **Framework**: Next.js 16.3.4 (App Router, Node.js runtime) + React 19.2.8
- **Styling**: Tailwind CSS v4 with `@tailwindcss/postcss`
- **Database & Auth**: Supabase Postgres 15+ (`@supabase/ssr`, `@supabase/supabase-js`)
- **State**: Zustand 5 (persistent cart & wishlist)
- **Logistics**: Shiprocket API (`lib/shiprocket.ts`)
- **Payments**: Razorpay Standard Checkout & Orders API (`lib/razorpay.ts`)
- **Asset Storage**: Cloudflare R2 / AWS S3 (`lib/r2.ts`)
- **Email**: Resend Transactional Emails (`lib/email/resend.ts`)
- **Rate Limiting**: Upstash Redis sliding-window token bucket (`lib/rate-limit.ts`)

### Essential CLI Commands
```powershell
# Development server (accessible on local network)
pnpm dev

# Type check
pnpm typecheck

# Production build test
pnpm build

# Linting
pnpm lint
```


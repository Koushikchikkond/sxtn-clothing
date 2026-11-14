---
title: "Google-Only One-Click Authentication (Remove Email & Password)"
date: 2026-11-14
status: completed
tags:
  - task
  - storefront
  - auth
---

# Task: Google-Only One-Click Authentication (Remove Email & Password)

> [!info] Objective
> Remove email/password form inputs, verification emails, and password reset flows. Transition storefront authentication to an effortless, one-click "Continue with Google" system across login, signup, and account access to eliminate rate limits, spam/delivery issues, and forgotten passwords.

## Context & Links
- Relates to: [[PRD]], [[architecture]], [[security]]
- Relevant rules: [[rules]]

## Implementation Plan
- [x] Step 1: Update `app/(auth)/login/page.tsx` into a modern, streamlined Google-only 1-click authentication page with state handling (loading, error) and clean branding
- [x] Step 2: Update `app/(auth)/signup/page.tsx` into Google-only 1-click registration
- [x] Step 3: Update `app/(auth)/forgot-password/page.tsx` with guidance that passwords are no longer needed, linking directly to Google login
- [x] Step 4: Run typecheck (`npm run typecheck`) and Next.js production build (`npm run build`)
- [x] Step 5: Commit, push to `main`, and update task status

## Changes Made
- `app/(auth)/login/page.tsx`: Replaced email/password form with high-conversion 1-click "Continue with Google" button with active loader and error handling.
- `app/(auth)/signup/page.tsx`: Replaced registration form with 1-click Google account creation.
- `app/(auth)/forgot-password/page.tsx`: Replaced password reset form with clear informational notice that accounts are authenticated via Google, directing users to login.

## Review & Notes
- Completely bypasses Supabase SMTP rate limits and email delivery dependencies.
- Eliminates the need for customer password storage, recovery tokens, and email confirmations.
- Full Next.js production build (`next build`) and typecheck verified with 0 errors.


## Review & Notes
- Completely bypasses Supabase SMTP rate limits and email delivery dependencies.
- Eliminates the need for customer password storage, recovery tokens, and email confirmations.

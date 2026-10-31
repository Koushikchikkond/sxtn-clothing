---
title: "Install Cloudflare Security Audit Skill"
date: 2026-10-29
status: completed
tags:
  - task
  - security
  - skills
---

# Task: Install Cloudflare Security Audit Skill

> [!info] Objective
> Install and configure the official Cloudflare `security-audit-skill` repository (https://github.com/cloudflare/security-audit-skill) into the project's `.agents/skills/` and global skill directory so coding agents can run comprehensive security audits.

## Context & Links
- Relates to: [[security]], [[rules]]
- Brain Index: [[INDEX|Second Brain]]
- Task Index: [[README|Tasks Archive]]

## Implementation Plan
- [x] Inspect the structure of `https://github.com/cloudflare/security-audit-skill`
- [x] Install the skill into the project repository (`.agents/skills/security-audit/`) via `skills add`
- [x] Install the skill into the global agent directory (`~/.agents/skills/security-audit/` and `~/.gemini/config/skills/security-audit/`)
- [x] Verify `SKILL.md` format, supporting attack classes, validators, and report schemas
- [x] Document usage and update Obsidian Second Brain and task log

## Changes Made
- Installed Cloudflare `security-audit` skill into `.agents/skills/security-audit/` (20 files including `SKILL.md`, attack class modules, and validator scripts)
- Synced global skill definitions to `~/.gemini/config/skills/security-audit/` and `~/.agents/skills/security-audit/`
- Added entry to `mind/tasks/README.md`

## Review & Notes
- The Cloudflare `security-audit-skill` provides a 6-phase structured vulnerability discovery workflow: Reconnaissance, Coverage-led hunting, Candidate validation, Structured output (`findings.json`), Independent verification, and Target-neutral reporting.


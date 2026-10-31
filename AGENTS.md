<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# SXTN Project Guidelines & Obsidian Task Tracking

Every AI coding assistant working on this project must adhere to the conventions defined in [`mind/rules.md`](mind/rules.md).

## Mandatory Obsidian Task Tracking
For **every** task, feature implementation, or bugfix assigned by the user:
1. **Initialize a Task Note**: Before writing code, create a note at `mind/tasks/YYYY-MM-DD-<short-task-slug>.md` following the template at [`mind/tasks/_template.md`](mind/tasks/_template.md).
2. **Metadata**: Include YAML frontmatter with `title`, `date`, `status: in-progress`, and relevant `tags` (`task`, `storefront`, `admin`, `auth`, `payment`, `db`, `docs`).
3. **Checklist**: Break down requirements into an actionable checklist (`- [ ]`).
4. **Wikilinks**: Link relevant context notes (`[[PRD]]`, `[[architecture]]`, `[[rules]]`, `[[security]]`).
5. **Completion**: When the task is done, update `status: completed`, check off items (`- [x]`), record all touched files under `## Changes Made`, and add the entry to [`mind/tasks/README.md`](mind/tasks/README.md).


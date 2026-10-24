# KickstartKit — project guide for Claude

KickstartKit turns a signed deal into a fully prepared project: agencies upload a
proposal/brief/contract/transcript, Claude extracts an onboarding checklist, the
agency reviews it, and the client completes it through one secure tokenized link.

@AGENTS.md

## Stack

Next.js 16 App Router (Turbopack, `cacheComponents` on) · TypeScript · Tailwind v4 ·
shadcn/ui (hand-vendored in `src/components/ui`) · Supabase (Postgres, Auth, Storage) ·
Zod v4 · Vitest · Playwright. Coming in later milestones: Anthropic, Resend, Stripe,
PostHog, Sentry.

## Commands

| Task                          | Command                                                                                                   |
| ----------------------------- | --------------------------------------------------------------------------------------------------------- |
| Start local Supabase (Docker) | `npm run db:start` (if ghcr.io is blocked: `SUPABASE_INTERNAL_IMAGE_REGISTRY=docker.io npm run db:start`) |
| Reset DB + apply migrations   | `npm run db:reset`                                                                                        |
| Regenerate DB types           | `npm run db:types`                                                                                        |
| Dev server                    | `npm run dev`                                                                                             |
| Typecheck                     | `npm run typecheck` (runs `next typegen` first)                                                           |
| Lint                          | `npm run lint`                                                                                            |
| Unit tests                    | `npm test`                                                                                                |
| RLS / database tests (pgTAP)  | `npm run test:db`                                                                                         |
| E2E tests                     | `npm run test:e2e` (needs local Supabase + `.env.local`)                                                  |
| All fast checks               | `npm run check`                                                                                           |
| Regenerate test fixtures      | `node scripts/generate-fixtures.mjs` (writes `tests/fixtures/`)                                           |

After every milestone: `npm run check && npm run test:db && npm run build && npm run test:e2e`.

## Layout

- `src/app/(marketing)` landing page · `(auth)` login/signup + auth server actions ·
  `(dashboard)` protected agency app · `onboard/[token]` public client page · `api/*` route handlers.
- `src/lib/supabase/` — `server.ts` (user client, RLS), `admin.ts` (service role, server-only),
  `proxy.ts` (session refresh + auth redirects, used by `src/proxy.ts`).
- `src/lib/auth/session.ts` — Data Access Layer: `getCurrentUser()` / `requireUser()`.
- `src/lib/validation/` — Zod schemas. Every server action / route parses input with these.
- `src/types/database.ts` — generated; never edit by hand.
- `supabase/migrations/` — SQL migrations. `supabase/tests/` — pgTAP tests.
- `tests/unit` (Vitest), `tests/e2e` (Playwright).

## Conventions

- Server Components by default; `"use client"` only for interactivity (forms, menus).
- With `cacheComponents`, anything reading cookies/session must sit inside `<Suspense>`
  (route `loading.tsx` counts). Never `await` the session at the top of a layout.
- All writes go through Server Actions or route handlers. Validate with Zod first, then call
  `requireUser()` (actions/pages re-check auth; the proxy is not the security boundary).
- Use the RLS-bound client (`lib/supabase/server.ts`) for agency work. Use the service-role
  client only for token-authenticated client routes, webhooks and cron — and scope every
  query to the project behind the token yourself.
- Every new table: enable RLS, add workspace-scoped policies, revoke from `anon`, and add
  pgTAP coverage in `supabase/tests/`.
- Storage paths always start with `{workspace_id}/{project_id}/…` — storage policies rely on it.
- Never collect raw passwords from clients; access items take instructions/invite links.
- Never hardcode secrets; add new env vars to `.env.example`. `NEXT_PUBLIC_*` is browser-visible.
- Server actions return typed state objects (`{ status, message, fieldErrors }`) for `useActionState`.
- Formatting: Prettier (120 cols). Run `npm run format` before committing.

## Product decisions log

- One workspace per user, created with the profile by the `handle_new_user` DB trigger at signup
  (workspace name comes from the signup form).
- Signup supports both Supabase modes: with email confirmation off it logs straight in; with it on
  it shows "check your inbox" and `/auth/confirm` verifies the `token_hash` link.
- Project statuses: `draft`, `awaiting_client`, `in_progress`, `ready`, `archived`.
- One active (non-revoked) client link per project, enforced by a partial unique index.
- Client submissions, reminders and subscriptions are server-written only (no `authenticated` writes).
- Source document uploads go browser → Storage via a one-time signed upload URL (avoids Vercel's 4.5 MB
  body limit), then `processDocument` downloads the file, verifies its real type from magic bytes
  (`lib/documents/extract.ts`), and extracts text. Files failing the content check are deleted.
- Source files: PDF/DOCX/TXT, max 10 MB, max 20 documents per project. Stored text is capped at 200k chars.
- Failed extractions store a user-facing reason in `source_documents.extraction_error`.

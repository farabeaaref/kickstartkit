# KickstartKit

**Turn a signed deal into a fully prepared project with one client link.**

KickstartKit helps creative agencies skip the post-signature chase: upload a proposal, brief,
contract, email thread or call transcript, review the AI-generated onboarding checklist, and
send your client one secure link to submit briefs, assets, approvals and access details.

## Local setup

Requirements: Node 20.9+, Docker.

```bash
npm install
npm run db:start                # starts local Supabase and applies migrations
cp .env.example .env.local      # then paste the URL / anon key / service-role key printed above
npm run dev                     # http://localhost:3000
```

Local auth emails (if confirmations are enabled) are visible in Mailpit at http://127.0.0.1:54324.

## Testing

```bash
npm run check       # typecheck + lint + unit tests
npm run test:db     # pgTAP row-level-security tests
npm run test:e2e    # Playwright (desktop + mobile)
```

## Production Supabase checklist

- Apply migrations: `npx supabase link --project-ref <ref> && npx supabase db push`.
- Auth → URL configuration: set Site URL to your app URL and allow `https://<app>/auth/confirm`.
- Auth → Email templates → "Confirm signup": link to
  `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/dashboard`.

See `CLAUDE.md` for architecture and conventions.

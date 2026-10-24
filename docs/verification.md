# Verification record

Date: 2026-10-24. Source tested locally; production services are not provisioned.

- `npm run check`: passed syntax and entrypoint checks.
- `npm test`: 30 tests passed, 0 failed. Includes actual migration execution in embedded PostgreSQL (PGlite), RLS, RPC permissions, persistence, retry/idempotency, rate limiting, audit, version conflicts and validation.
- `npm run test:browser`: 8 passed. Chromium against local Wrangler; remote API and Turnstile responses mocked. Includes mobile layout, booking success/failure, consent/phone checks, staff text rendering, logout and stale session races.
- `npx wrangler deploy --dry-run`: passed; 95 static files, Worker bundle 14.37 KiB.
- Independent specification and quality reviews completed; reported issues resolved.

Live Supabase migrations, real staff authentication, production Turnstile, simultaneous multi-client booking traffic, domain/email DNS and backup restoration still require staging/launch verification. Requests remain pending until staff manually confirm an appointment; automated messaging and capacity scheduling are outside this release.
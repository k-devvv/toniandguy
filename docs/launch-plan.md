# Salon launch design and implementation plan

Approved design: preserve the supplied HTML design; Cloudflare Worker/static assets; Supabase PostgreSQL/Auth; manual staff confirmation; branch-restricted CRM. No automated WhatsApp, payments, capacity scheduling or customer self-service accounts in this release.

## Before-code failure walkthrough
- Duplicate click or response lost after DB commit: stable idempotency key and atomic database insertion return the original reference; payload mismatch returns conflict.
- Database outage: leave entered form details intact and show retry; never render success before persistence.
- Invalid/overseas/too-long phone: reject instead of truncating. Validate India mobile E.164 format.
- Date boundary: evaluate date and label in Asia/Kolkata; reject past/out-of-horizon dates on server.
- Branch/service switch: reset incompatible inputs. Specialist types are preferences, not real named staff.
- Cross-branch reads, guessed IDs, exports: authenticated staff membership and RLS on each operation.
- Concurrent staff edits: expected version required, stale changes return 409.
- Injection/spam: body limits, escaped UI, safe CSV, server Turnstile verification, durable rate limits.
- Missing configuration: explicit unavailable response; production never silently uses demo storage.
- Expired staff session: clear sensitive UI, require login again, no cached API responses.

## Planned files and order
1. public/index.html + public/site.css + public/site.js: extract supplied assets/styles/JS; preserve design; repair client state/date/phone/call behavior.
2. src/worker.js + shared validation + supabase/migrations: public booking endpoint, staff endpoints, configuration/status, Supabase RPCs/RLS, idempotency/versioning/audit/rate limits.
3. public/admin/: staff login, filters, booking management, notes and authorized CSV; separate customer contact consent from marketing.
4. tests/: meaningful API validation, failure simulation, idempotency/auth/version/CSV coverage; browser flow checks with mocked API; migration integration checks when a local DB exists.
5. README.md + .env.example + wrangler.jsonc + CI: development/build/deployment, staff bootstrapping, backups, launch checklist and clear credential requirements.
6. Subagent spec review followed by code quality review; fix findings; run final checks; publish committed source to github.com/k-devvv/toniandguy.

## Verification boundaries
Local checks can prove behavior against mocks and any locally available database. Actual cloud persistence, email delivery, Turnstile production verification and live domain require configured service credentials and deployment. Never describe these as verified without evidence.

## Content and ownership
Repo public: no secrets, customer records or data dumps. Preserve original HTML locally as design reference and ignore it in Git after extraction. Both branches configured but phone/hours launch content must be supplied; blank settings disable actions honestly. Remove sample reviews and unsupported promises from production UI. Retain source image provenance caveats and require client approval before launch.

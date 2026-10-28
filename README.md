# TONI&GUY Bengaluru

Public salon website, appointment requests and staff CRM for Sobha Arcadia and Prestige Tech Forest. Original design is preserved; images/fonts are extracted into static assets.

## Scope

- Customer chooses branch, service, specialist preference and preferred date/window.
- Validated request is stored as **pending**, with a durable reference. This is not instant scheduling.
- Staff use invite-only login, branch-restricted booking lists, customer lookup, notes, audit history, status updates and CSV export.
- Exact appointment time is agreed manually. No automated WhatsApp messages, payments, loyalty programme or real stylist calendar is configured.
- Changing status never claims to send a customer message.

## Architecture

GitHub -> Cloudflare Worker + static assets -> Supabase PostgreSQL/Auth.

## Public pages and SEO

Public pages now use clean URLs such as `/services`, `/book`, `/salons/sobha-arcadia` and `/salons/prestige-tech-forest`. Existing hash links are translated in the browser, including service-selection queries. Navigation supports browser back/forward and direct refresh.

`npm run build` renders the current page functions into `dist/` using linkedom. Cloudflare runs this build before local development and deployment. Generated HTML contains actual page content, unique titles/descriptions, canonical URLs, Open Graph metadata and JSON-LD. Edit source files under `public/`, never generated `dist/` files. No backend credentials are needed for the build. Interactive booking still requires the runtime configuration and customer consent.

The generated `/sitemap.xml` lists public indexable pages; `/robots.txt` points to it. Booking, the interactive quiz, placeholder review content and individual stylist archetypes have `noindex,follow`. Admin pages have a noindex response header, and unknown paths return a real 404. Submit the sitemap in the client's Google Search Console after domain ownership is verified there. Indexing and rankings remain Google's decision.

Branch structured data reuses the existing published contact, hours and addresses. Confirm the exact shop/unit addresses and map pins with the client before relying on them in Google Business Profile. No review scores or named staff are invented.

Customer data is stored in Supabase. Public clients cannot read bookings. Worker service credentials are used only for narrow booking/rate-limit database functions. Staff APIs pass the authenticated staff JWT to database policies. Privileged keys never enter the browser.

## Requirements

Node.js 22+, npm, a Cloudflare account and a Supabase project. Production account ownership should belong to the client, with developer access delegated.

## Local development

1. Run `npm ci`.
2. Copy `.env.example` to `.dev.vars`. Insert your actual Supabase values and Turnstile keys. Never commit `.dev.vars`.
3. Apply migrations from `supabase/migrations` in filename order in Supabase SQL Editor. Read `supabase/README.md` for staff provisioning and database details.
4. Run `npm run dev`; visit http://127.0.0.1:8787 and /admin/.

Without service credentials, the public website still renders, but online booking and staff operations fail closed. No browser-only fake storage fallback exists.

## Supabase setup

Use a client-owned project. Disable public signup in Auth settings; create/invite staff from the Supabase dashboard. Add trusted staff memberships using the SQL examples in `supabase/README.md`. Never trust user-editable Auth metadata for role assignment. Use a dedicated staff email account; do not share owner credentials.

Configure Auth site URL and any invitation/password-reset redirect URLs to the real domain. Dashboard-issued invitations may need the Supabase-supported account setup flow; the CRM itself provides password login and session refresh, not a public signup flow. Initially set staff passwords using a trusted admin provisioning process. Test login with each role before launch. Enable MFA for project owners and protect service accounts.

## Bot protection and booking limits

Create a Cloudflare Turnstile widget, allow the real production hostname and local testing hostname as needed, and set both widget keys. The frontend sends its token; the Worker validates it server-side. Use Cloudflare's documented test keys only for local/staging checks; replace them before production. Never make a production bot-protection bypass.

Turnstile is separate from contact consent. Rate limits persist in the database; transient process memory is not used as an abuse boundary. Booking retries reuse an idempotency key. Changed request details create a new key. Keep idempotency records at least as long as the supported retry window.

## Content configuration

Edit `public/site-settings.json` for verified branch phone, WhatsApp and hours. Blank values do not invent a number. The supplied addresses, service descriptions, indicative durations, photos and specialist archetypes need owner review. Prices are agreed with the salon. Specialist preferences do not represent named staff availability.

Before launch, remove/rewrite unsupported offers and promotional claims, verify map pins/unit addresses, replace sample photography with client-approved assets and confirm image usage rights. Sample review cards are disabled. Publish final branch contacts, privacy contact and a retention policy. `public/privacy.html` documents the implemented data flow and includes remaining owner actions.

## Verification

- `npm run check` - syntax and referenced entrypoint checks.
- `npm test` - backend/frontend failure scenarios and actual migration tests using embedded PostgreSQL (PGlite).
- `npx playwright install chromium` once, then `npm run test:browser` - real browser flows, using mocked remote APIs.
- `npx wrangler deploy --dry-run` - bundle validation without deployment.

Browser tests verify form behavior and staff UI against mocked network responses; they do not prove live Supabase persistence or real credentials. Embedded PostgreSQL tests exercise persistence, RLS, permissions, idempotency, rate limits and audit updates. Live Supabase staging checks and concurrent-client validation remain launch requirements (see Supabase setup). No customer data is used in test fixtures.

## Cloudflare deployment

1. Run `npx wrangler login` on your own computer and approve the correct account.
2. Configure each secret using `npx wrangler secret put NAME`: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`.
3. Run `npm run deploy` after tests pass.
4. Confirm `/api/config` reports booking availability and `/api/health` succeeds. Send a real test request, verify it in the CRM, then test unauthorised and branch-restricted access.
5. Add `toniandguybangalore.in` as a Worker custom domain in Cloudflare. Follow the dashboard's DNS onboarding instructions. If nameservers move from GoDaddy, copy every required email MX/SPF/DKIM/DMARC record first; verify receiving and sending afterwards.
6. Use HTTPS. Configure Turnstile allowed hostnames. Keep staging and production databases separate.

For automatic builds, connect this GitHub repository to Cloudflare Workers Builds, use `npm ci` for installation and `npm run deploy` as the deployment command. Keep credentials in Cloudflare secrets, not GitHub files. The GitHub CI workflow validates source but does not deploy automatically.

## Operating the CRM

Visit `/admin/`. Apply branch/status/date/name/phone filters. Select a request, contact the customer manually and set an agreed Bengaluru appointment time before marking confirmed. Review conflicts outside the system until named-stylist capacity scheduling is added. Use the version-conflict message to refresh rather than overwrite another staff member's edits. CSV exports contain personal data and must be stored securely.

## Backups, retention and handover

Free database plans are not a backup strategy. Before accepting real bookings, arrange regular encrypted exports or a paid backup solution, define access and retention, and run a restore exercise. Keep backups out of this public repository. Document who checks pending requests and handles deletion/correction requests. Review platform usage, inactivity pausing and cost limits in the provider dashboards. The system has no paid uptime guarantee on free plans.

## Launch gates

- [ ] Verified branch contacts, opening hours, service catalogue and content approved by owner.
- [ ] Real domain and production Supabase/Cloudflare/Turnstile settings configured.
- [ ] Migrations applied and role-based access tested with real staff sessions.
- [ ] Save request -> CRM -> manual contact -> confirmation verified end to end.
- [ ] Duplicate retry, server failure and staff edit-conflict scenarios checked against live staging.
- [ ] Backups/restore, retention and privacy contact agreed.
- [ ] GoDaddy email DNS checked after domain configuration.
- [ ] Remove test bookings and test widget keys; do not delete real customer data.

## Costs

Cloudflare static hosting and Supabase may start within free-plan limits; dynamic API/database limits still apply. Domain/email renewal and any messaging provider fees are separate. Earlier purchase screenshots are estimates, not guaranteed current prices. No paid services or live deployment are provisioned by merely pushing this repository.

## Calendar booking update
Reserve now opens a single calendar/time/service/contact page. Requested half-hour start time and exact imported menu item are saved in booking notes; existing broad service category/window fields remain for CRM compatibility. Times are preferences and are not capacity reservations. Hours: daily 10 AM–9 PM. Both branches use +91 81237 29873. Menu prices now come from the client-supplied TONY_AND_GUY_NEW_MENU.pdf. Both differing haircut tables are preserved. See docs/pdf-menu-update.md.

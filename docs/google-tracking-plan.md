# Consent-based Google measurement

Client account: `toniandguyblrteam@gmail.com`. GTM container: `GTM-WV9QPHQ2`. GA4 web stream: `G-MWCQD9CTTC`.

## Scope approved in chat
Use GTM and GA4 for public-page views, saved booking requests, WhatsApp, call and directions clicks. Load measurement only after the visitor accepts analytics. Advertising storage, advertising user data, advertising personalization and Google signals remain disabled. No Google Ads, remarketing, enhanced conversions or customer data upload is included.

## Implementation
- Add `public/analytics.js` with a small Accept/Reject analytics banner and a footer control for changing the choice. Store only the consent preference locally, for six months. Default denied. Respect Global Privacy Control and Do Not Track.
- Load GTM only on the production domain and www, after consent. Do not load it in admin, API, local tests or static rendering. Provide a test-only factory with injected configuration for unit/browser tests, not a production bypass.
- Send manual page views once per actual page navigation, after the page title is updated. Strip query strings/fragments and use an allowlist of known public paths. Do not send document referrer, free-text titles, full link URLs or input fields.
- Emit booking-request success only after the API returns a saved reference; never include that reference in tracking. Count a WhatsApp click separately from a message sent or appointment confirmed.
- Use fixed event names and enum branch IDs only. Do not track names, phone numbers, notes, appointment dates, selected treatments or custom uploaded photos.
- GTM owns one consent-gated HTML bridge: it configures the Google tag with automatic page views off, drains safe queued events once, then listens for the same controlled events from the site. The published source is kept in `docs/gtm-analytics-tag.html`. No other GA4 installation is allowed. Disable enhanced measurement in GA4 to avoid outbound WhatsApp links leaking the prepared message.
- Update the privacy page and add tests for consent, duplicate views, rejected consent, safe payloads and booking behavior. Build, unit/database tests, browser tests and deployment dry-run must pass before publishing.

## Verification
Verify GTM published version, no Google requests before consent, one page view after consent, clean route changes, click events, and GA4 collection/Realtime. Do not send customer messages or create additional live bookings for analytics QA.

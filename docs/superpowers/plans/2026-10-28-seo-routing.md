# SEO routing implementation plan

**Approved scope:** Clean public URLs, page-specific HTML and metadata, sitemap and accurate salon structured data, with old hash links preserved. Existing booking storage, manual confirmation and visual design stay in place.

**Architecture:** Keep the current JavaScript application and use its existing rendering functions at build time with a lightweight DOM. Generate actual HTML files for each public route. Share path mapping and metadata between the generator and the browser so server HTML and client navigation agree. Cloudflare serves generated assets; booking APIs keep their current Worker path.

**Tech stack:** JavaScript modules, Node.js, linkedom (build only), Cloudflare Workers static assets and the existing Supabase backend.

## Tasks
- [ ] Add `public/seo.js` for path/hash conversion, canonical URLs and accurate metadata/schema. Add unit tests for query preservation, invalid paths and escaping.
- [ ] Update `public/site.js` to use History API navigation, real hrefs and legacy-hash conversion. Preserve prefill state and browser back/forward. Update booking query parsing and menu links.
- [ ] Add `scripts/build-seo.mjs` to render every valid public route into `dist/`, including a noindex 404, sitemap and robots file. Reuse current content rather than inventing prices, reviews or staff.
- [ ] Configure build/deploy and CI to generate static pages. Verify direct HTML contains route-specific content with JavaScript disabled; unknown paths return 404. Keep admin and API out of sitemap.
- [ ] Run unit/database and browser regression tests, verify build/dry-run, then push a single reviewed update to the production branch. Check live services, both salons, old links, metadata, sitemap and booking form.

## Acceptance checks
`npm run build`, `npm run check`, `npm test`, `npm run test:browser`, and `npx wrangler deploy --dry-run` must pass. New SEO tests check HTML content without JS, clean links, canonical, sitemap coverage, legacy query conversion and booking success with mocked network. Public production checks do not create additional customer bookings.

## Rollback
Revert the SEO commit to return to the previously deployed hash router. No database migrations or secret changes are required.

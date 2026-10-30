# Technical SEO gap fixes — 30 October 2026

Audited generated public HTML and visually reviewed a 66-image contact sheet. Meaningful image descriptions already existed; corrected one blonde-hair description that incorrectly described two people. Hero-film images are decorative and correctly keep empty alternatives under aria-hidden.

Added measured intrinsic dimensions for 91 local image assets; shared renderers now include dimensions, lazy loading and asynchronous decoding. Current hero image remains eager; hidden slideshow scenes receive sources only when selected. Mobile-invisible columns defer loading. Local fonts use font-display:swap.

Corrected skipped heading levels across home, stylist listings, service steps, occasion timelines and aftercare. Footer section headings now use H2 while preserving their visual size. Added missing privacy-page description and canonical URL. Added a repeatable generated-HTML audit command: npm run audit:seo.

Validation: 43 unit/database tests and 18 browser tests passed. Audit covers 49 public HTML documents and 551 image instances. Lab mobile homepage image requests fell from 36 to 12; image bytes fell from 1,399,429 to 443,069. These resource counts compare production before changes and local after changes; local-versus-production LCP times are not comparable and are not claimed as a speed improvement. Real-user Core Web Vitals require field data over time.

The homepage now reuses its server-rendered DOM at boot, while attaching its existing interactive handlers. A regression test verifies heading-node identity and navigation into booking. This avoids deleting and repainting initial text when the JavaScript module graph finishes loading. Critical display/body fonts are preloaded.

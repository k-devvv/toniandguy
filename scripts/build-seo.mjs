import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseHTML } from "linkedom";
import { routeToPath, pageMetadata, SITE_ORIGIN } from "../public/seo.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const output = path.join(root, "dist");
if (path.dirname(output) !== root || path.basename(output) !== "dist") throw new Error("Unsafe output path");
fs.rmSync(output, { recursive: true, force: true });
fs.cpSync(path.join(root, "public"), output, { recursive: true });
const template = fs.readFileSync(path.join(root, "public/index.html"), "utf8");
const { document, window } = parseHTML(template);
Object.assign(globalThis, {
  __BUILD_SEO__: true, document, window,
  location: new URL(SITE_ORIGIN),
  addEventListener() {}, scrollTo() {}, scrollY: 0,
  matchMedia: () => ({ matches: true }),
  localStorage: { getItem: () => null, setItem() {} },
});
window.location = globalThis.location;
globalThis.history = { replaceState(_state, _title, url) { globalThis.location = new URL(url, SITE_ORIGIN); window.location = globalThis.location; } };
const { staticRouteIds, renderBuildRoute } = await import("../public/site.js");
const settings = JSON.parse(fs.readFileSync(path.join(root, "public/site-settings.json"), "utf8"));
const routes = staticRouteIds();
for (const id of [...routes, "not-found"]) {
  const pathname = id === "not-found" ? "/missing-page" : routeToPath(id);
  globalThis.location = new URL(pathname, SITE_ORIGIN);
  window.location = globalThis.location;
  renderBuildRoute(settings);
  if (!document.querySelector("main h1")) throw new Error("No content rendered: " + id);
  if (document.querySelector('a[href^="#"]')) throw new Error("Legacy link in static page: " + id);
  const filename = id === "home" ? "index.html" : id === "not-found" ? "404.html" : pathname.slice(1) + ".html";
  const target = path.join(output, filename);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, document.toString());
}
const urls = routes.filter(id => pageMetadata(id).robots === "index,follow").map(id => SITE_ORIGIN + routeToPath(id));
fs.writeFileSync(path.join(output, "sitemap.xml"), '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + urls.map(url => "  <url><loc>" + url + "</loc></url>").join("\n") + "\n</urlset>\n");
fs.writeFileSync(path.join(output, "robots.txt"), "User-agent: *\nDisallow: /admin/\nDisallow: /api/\nSitemap: " + SITE_ORIGIN + "/sitemap.xml\n");
console.log(`Built ${routes.length} public HTML pages, 404 page and sitemap with ${urls.length} indexable URLs.`);

// Shared by the browser router and static HTML build. No private booking data belongs here.
export const SITE_ORIGIN = "https://toniandguybangalore.in";
export const PAGE_PATHS = Object.freeze({
  home: "/", services: "/services", book: "/book",
  "sobha-arcadia": "/salons/sobha-arcadia",
  "prestige-tech-forest": "/salons/prestige-tech-forest",
  "colour-room": "/colour-room", stylists: "/stylists",
  occasions: "/occasions", voices: "/voices", visit: "/visit",
  "find-your-look": "/find-your-look", aftercare: "/aftercare", standard: "/standard",
});
const PREFIXES = { service: "services", colour: "colours", stylist: "stylists", occasion: "occasions" };
export function routeToPath(value) {
  const [id, query] = String(value).replace(/^#/, "").split(/\?(.*)/s);
  let path = PAGE_PATHS[id];
  const match = id.match(/^(service|colour|stylist|occasion)-([a-z0-9-]+)$/);
  if (!path && match) path = "/" + PREFIXES[match[1]] + "/" + match[2];
  return path ? path + (query ? "?" + query : "") : null;
}
export function pathToRoute(pathname) {
  const path = pathname === "/" ? "/" : pathname.replace(/\/$/, "");
  for (const [id, value] of Object.entries(PAGE_PATHS)) if (value === path) return id;
  for (const [id, prefix] of Object.entries(PREFIXES)) {
    const match = path.match(new RegExp("^/" + prefix + "/([a-z0-9-]+)$"));
    if (match) return id + "-" + match[1];
  }
  return null;
}
export function normalizeLinks(root) {
  for (const link of root.querySelectorAll('a[href^="#"]')) {
    const path = routeToPath(link.getAttribute("href"));
    if (path) link.setAttribute("href", path);
  }
}
const DETAILS = {
  home: ["TONI&GUY Bengaluru | Sobha Arcadia & Prestige Tech Forest", "Explore TONI&GUY salons at Sobha Arcadia, Thanisandra and Prestige Tech Forest, Varthur. Browse hair, beauty and grooming services and request an appointment."],
  services: ["Salon Services & Prices in Bengaluru | TONI&GUY", "Browse the TONI&GUY Bengaluru menu for haircuts, colouring, styling, hair spa, facials and grooming. View menu prices and request your preferred appointment."],
  book: ["Request a Salon Appointment in Bengaluru | TONI&GUY", "Choose Sobha Arcadia or Prestige Tech Forest, a service, date and preferred time. Open daily 10 AM–9 PM. The salon confirms appointments manually on WhatsApp."],
  "sobha-arcadia": ["TONI&GUY Sobha Arcadia, Thanisandra | Bengaluru Salon", "Visit TONI&GUY at Sobha Arcadia on Thanisandra Main Road, Bengaluru. Explore services, directions and daily 10 AM–9 PM hours. Request an appointment."],
  "prestige-tech-forest": ["TONI&GUY Prestige Tech Forest, Varthur | Bengaluru Salon", "Visit TONI&GUY at Prestige Tech Forest, Lake Road, Varthur, Bengaluru. Explore services, directions and daily 10 AM–9 PM hours. Request an appointment."],
  visit: ["Salon Locations, Hours & Directions | TONI&GUY Bengaluru", "Find TONI&GUY at Sobha Arcadia, Thanisandra and Prestige Tech Forest, Varthur. View addresses and directions. Open every day from 10 AM to 9 PM."],
};
export function pageMetadata(route, { title = "TONI&GUY Bengaluru", description = "" } = {}) {
  const predefined = DETAILS[route];
  return {
    title: predefined?.[0] || title.replace(/\s*\|\s*TONI&GUY.*$/, "") + " | TONI&GUY Bengaluru",
    description: predefined?.[1] || description.replace(/\s+/g, " ").trim().slice(0, 175) || "Explore hair, beauty and grooming at TONI&GUY Bengaluru, Sobha Arcadia and Prestige Tech Forest.",
    canonical: SITE_ORIGIN + (routeToPath(route) || "/"),
    robots: ["book", "find-your-look", "voices", "not-found"].includes(route) || route.startsWith("stylist-") ? "noindex,follow" : "index,follow",
  };
}
const salons = [
  { slug: "sobha-arcadia", name: "Sobha Arcadia", street: "Shop 4B, Devin Paradise Enclave, Thanisandra Main Road", postal: "560064", lat: 13.0771852, lng: 77.6340648 },
  { slug: "prestige-tech-forest", name: "Prestige Tech Forest", street: "Unit 4, Lake Road, ITI Colony, Varthur", postal: "560087", lat: 12.9495205, lng: 77.7457457 },
];
export function structuredData(route, metadata) {
  const graph = [{ "@type": "WebSite", "@id": SITE_ORIGIN + "/#website", url: SITE_ORIGIN + "/", name: "TONI&GUY Bengaluru", inLanguage: "en-IN" },
    { "@type": "WebPage", "@id": metadata.canonical + "#webpage", url: metadata.canonical, name: metadata.title, description: metadata.description, isPartOf: { "@id": SITE_ORIGIN + "/#website" }, inLanguage: "en-IN" }];
  if (["home", "visit", ...salons.map(s => s.slug)].includes(route)) {
    for (const salon of salons.filter(s => ["home", "visit", s.slug].includes(route))) {
      graph.push({ "@type": "HairSalon", "@id": SITE_ORIGIN + PAGE_PATHS[salon.slug] + "#salon",
        name: "TONI&GUY " + salon.name, url: SITE_ORIGIN + PAGE_PATHS[salon.slug], telephone: "+918123729873",
        address: { "@type": "PostalAddress", streetAddress: salon.street, addressLocality: "Bengaluru", addressRegion: "Karnataka", postalCode: salon.postal, addressCountry: "IN" },
        geo: { "@type": "GeoCoordinates", latitude: salon.lat, longitude: salon.lng },
        openingHoursSpecification: [{ "@type": "OpeningHoursSpecification", dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"], opens: "10:00", closes: "21:00" }],
        hasMap: "https://www.google.com/maps/search/?api=1&query=" + salon.lat + "," + salon.lng });
    }
  }
  return { "@context": "https://schema.org", "@graph": graph };
}
export function applyPageMetadata(document, route, options) {
  const metadata = pageMetadata(route, options);
  document.title = metadata.title;
  const put = (selector, tag, attrs) => {
    let el = document.head.querySelector(selector);
    if (!el) { el = document.createElement(tag); document.head.appendChild(el); }
    for (const [name, value] of Object.entries(attrs)) el.setAttribute(name, value);
  };
  put('meta[name="description"]', "meta", { name: "description", content: metadata.description });
  put('meta[name="robots"]', "meta", { name: "robots", content: metadata.robots });
  put('link[rel="canonical"]', "link", { rel: "canonical", href: metadata.canonical });
  for (const [key, content] of Object.entries({ title: metadata.title, description: metadata.description, url: metadata.canonical, type: "website", site_name: "TONI&GUY Bengaluru", locale: "en_IN" }))
    put('meta[property="og:' + key + '"]', "meta", { property: "og:" + key, content });
  for (const el of document.head.querySelectorAll('script[type="application/ld+json"]')) el.remove();
  const schema = document.createElement("script"); schema.type = "application/ld+json";
  schema.textContent = JSON.stringify(structuredData(route, metadata)).replace(/</g, "\\u003c");
  document.head.appendChild(schema);
  return metadata;
}

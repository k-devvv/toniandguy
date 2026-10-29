import CONFIG from "./analytics-config.json" with { type: "json" };
import { SITE_ORIGIN, routeToPath } from "./seo.js";

const CONSENT_KEY = "tg-analytics-consent-v1";
const CONSENT_LIFETIME = 180 * 24 * 60 * 60 * 1000;
const EVENTS = new Set(["page_view", "booking_request", "whatsapp_click", "phone_click", "directions_click"]);
const DENIED = { analytics_storage: "denied", ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied" };

// The only analytics values accepted here are controlled route IDs and branch enums.
export function analyticsPayload(event, page, branch = "") {
  if (!EVENTS.has(event) || !page?.path || !page.path.startsWith("/") || /[?#@<>]/.test(page.path)) return null;
  return {
    event: "salon_event", analytics_event: event,
    safe_page_location: SITE_ORIGIN + page.path,
    safe_page_title: page.title,
    salon_branch: ["s", "p"].includes(branch) ? branch : "",
  };
}

export function createAnalytics({ window, document, routes, config = CONFIG, now = Date.now }) {
  const allowed = new Set(routes);
  const enabled = config.allowedHosts.includes(window.location.hostname) && !/^\/(admin|api)(\/|$)/.test(window.location.pathname);
  const privacySignal = () => window.navigator?.globalPrivacyControl === true || ["1", "yes"].includes(window.navigator?.doNotTrack);
  let choice = "", loaded = false, current = null, lastPath = "";
  try {
    const saved = JSON.parse(window.localStorage.getItem(CONSENT_KEY));
    if (saved && ["granted", "denied"].includes(saved.value) && saved.expires > now()) choice = saved.value;
  } catch {}
  if (privacySignal()) choice = "denied";
  const queue = () => (window.dataLayer ||= []);
  function gtag() { queue().push(arguments); }
  function load() {
    if (loaded || !enabled || choice !== "granted" || privacySignal()) return;
    window["ga-disable-" + config.measurementId] = false;
    gtag("consent", "default", { ...DENIED });
    gtag("consent", "update", { ...DENIED, analytics_storage: "granted" });
    gtag("set", "ads_data_redaction", true);
    gtag("set", "allow_google_signals", false);
    gtag("set", "allow_ad_personalization_signals", false);
    // Set safe defaults before GTM initialization; never use document.referrer or a WhatsApp URL.
    queue().push({ safe_page_location: SITE_ORIGIN + current.path, safe_page_title: current.title });
    queue().push({ "gtm.start": now(), event: "gtm.js" });
    const script = document.createElement("script");
    script.id = "salon-gtm"; script.async = true;
    script.src = "https://www.googletagmanager.com/gtm.js?id=" + config.containerId;
    document.head.appendChild(script);
    loaded = true;
  }
  function action(event, branch) {
    if (!enabled || choice !== "granted" || privacySignal() || !current) return;
    const payload = analyticsPayload(event, current, branch);
    if (!payload) return;
    load(); queue().push(payload);
    if (window.CustomEvent) document.dispatchEvent(new window.CustomEvent("salon-analytics", { detail: payload }));
  }
  function page(id, title) {
    if (!allowed.has(id)) return;
    const path = routeToPath(id);
    if (!path || path.includes("?")) return;
    current = { path, title: String(title).slice(0, 160) };
    if (choice === "granted" && lastPath !== path) {
      action("page_view"); lastPath = path;
    }
  }
  function removeAnalyticsCookies() {
    for (const cookie of (document.cookie || "").split(";")) {
      const name = cookie.split("=")[0].trim();
      if (!/^_ga(?:_|$)/.test(name)) continue;
      for (const domain of ["", window.location.hostname, ".toniandguybangalore.in"])
        document.cookie = name + "=; Max-Age=0; path=/" + (domain ? "; domain=" + domain : "");
    }
  }
  function choose(value) {
    if (value === "granted" && privacySignal()) value = "denied";
    const previous = choice;
    choice = value;
    try { window.localStorage.setItem(CONSENT_KEY, JSON.stringify({ value, expires: now() + CONSENT_LIFETIME })); } catch {}
    document.getElementById("analytics-consent")?.remove();
    if (value === "granted" && current && previous !== "granted") {
      lastPath = ""; action("page_view"); lastPath = current.path;
    } else if (value === "denied" && loaded) {
      window["ga-disable-" + config.measurementId] = true;
      removeAnalyticsCookies();
      // A clean reload removes the already-loaded Google scripts and their listeners.
      window.location.reload();
    }
  }
  function preferences() {
    if (!enabled || document.getElementById("analytics-consent")) return;
    const region = document.createElement("section");
    region.id = "analytics-consent"; region.className = "analytics-consent";
    region.setAttribute("role", "region"); region.setAttribute("aria-label", "Analytics preferences");
    region.innerHTML = '<h2>Your analytics choice.</h2><p>Allow Google Analytics to measure page visits and booking/contact actions? Booking names, phone numbers and notes stay excluded.</p><p class="small"><a href="/privacy.html">Privacy details</a>. Change your choice anytime using Analytics preferences in the footer.</p><div class="row"><button class="btn sm sec" id="analytics-reject">Reject analytics</button><button class="btn sm" id="analytics-accept">Allow analytics</button></div>';
    if (privacySignal()) {
      const message = document.createElement("p"); message.className = "small";
      message.textContent = "Your browser privacy preference is active. Analytics stays off.";
      region.appendChild(message);
      region.querySelector("#analytics-accept").disabled = true;
    }
    region.querySelector("#analytics-reject").addEventListener("click", () => choose("denied"));
    region.querySelector("#analytics-accept").addEventListener("click", () => choose("granted"));
    document.body.appendChild(region);
  }
  if (enabled) {
    const button = document.createElement("button"); button.type = "button";
    button.className = "analytics-preferences"; button.textContent = "Analytics preferences";
    button.addEventListener("click", preferences);
    (document.querySelector("footer .wrap") || document.body).appendChild(button);
    if (!choice) preferences();
    document.addEventListener("click", event => {
      const link = event.target.closest?.("a,button[data-act]");
      if (!link) return;
      const href = link.getAttribute("href") || "", act = link.dataset.act;
      const branch = document.getElementById("booking-branch")?.value || document.body.dataset.loc;
      if (act === "wa" || /^https:\/\/wa\.me\//.test(href)) action("whatsapp_click", branch);
      else if (act === "call" || href.startsWith("tel:")) action("phone_click", branch);
      else if (/^https:\/\/(www\.)?google\.com\/maps\//.test(href)) action("directions_click", branch);
    });
  }
  return { page, action, preferences, choose };
}

let client;
export function initAnalytics(routes) {
  client ||= createAnalytics({ window, document, routes });
}
export function trackPageView(id, title) { client?.page(id, title); }
export function trackAction(event, branch) { client?.action(event, branch); }

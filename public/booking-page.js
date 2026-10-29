import { whatsappBookingUrl } from "./whatsapp-booking.js";
import { trackAction } from "./analytics.js";
import { renderMenuCard } from "./menu-card.js";
import { referenceMarkup } from "./service-images.js";
import { localDate, normalizePhone, sendBooking } from "./booking-utils.js";
import { PRICE_GROUPS, PRICE_SOURCE } from "./service-prices.js";
const esc = (v) =>
  String(v ?? "").replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
  );
const money = (v) =>
  typeof v === "number" ? "₹" + v.toLocaleString("en-IN") : v;
const dateLabel = (d) =>
  new Date(d + "T12:00:00+05:30").toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
const timeLabel = (t) =>
  new Date("2000-01-01T" + t + ":00+05:30").toLocaleTimeString("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "numeric",
    minute: "2-digit",
  });
export const renderPrices = renderMenuCard;
export function renderSimpleBooking(
  app,
  { draft: d, runtime, mountChallenge, rerender, locations, location: branch },
) {
  const all = PRICE_GROUPS.flatMap((g, gi) =>
    g.items.map((i, si) => ({ ...i, key: gi + "-" + si, group: g.name })),
  );
  const query = new URLSearchParams(
    window.location.search || window.location.hash.split("?")[1] || "",
  ).get("service");
  if (query && query !== d.queryService) {
    d.item = query;
    d.queryService = query;
  }
  d.loc ||= branch || "s";
  const selected = all.find((i) => i.key === d.item);
  const base = new Date(localDate() + "T12:00:00+05:30"),
    min = localDate(new Date(base.getTime() + 86400000)),
    max = localDate(new Date(base.getTime() + 90 * 86400000));
  d.calendar ||= min.slice(0, 7);
  const [year, month] = d.calendar.split("-").map(Number),
    first = new Date(Date.UTC(year, month - 1, 1));
  const slots = Array.from(
    { length: 22 },
    (_, i) =>
      String(10 + Math.floor(i / 2)).padStart(2, "0") +
      ":" +
      (i % 2 ? "30" : "00"),
  );
  if (d.reference) {
    app.innerHTML =
      '<section class="booking-page wrap"><div class="cap">Request received · Pending confirmation</div><h1>Thank you,<br>' +
      esc(d.name?.split(" ")[0]) +
      '.</h1><p class="lead">Your request is saved. Send these details to our salon on WhatsApp to arrange confirmation. Your appointment is not confirmed yet.</p><div class="booking-panel"><h2>' +
      esc(dateLabel(d.date)) +
      " · " +
      esc(timeLabel(d.time)) +
      "</h2><p>" +
      esc(locations[d.loc].name) +
      " · " +
      esc(selected?.name) +
      "</p><strong>" +
      esc(d.reference) +
      '</strong></div><p><a class="btn" id="send-booking-whatsapp" href="' + esc(whatsappBookingUrl({ ...d, branch: locations[d.loc].name, service: selected?.group + " / " + selected?.name, price: money(selected?.price) })) + '" target="_blank" rel="noopener noreferrer">Send booking on WhatsApp ↗</a></p><p class="small mute">WhatsApp opens a prepared message. Press Send there; nothing is sent automatically.</p><button class="btn sec" id="new-request">New request</button></section>';
    app.querySelector("#new-request").onclick = () => {
      Object.keys(d).forEach((k) => delete d[k]);
      rerender();
    };
    return;
  }
  const options = PRICE_GROUPS.map(
    (g, gi) =>
      '<optgroup label="' +
      esc(g.name) +
      '">' +
      g.items
        .map(
          (i, si) =>
            '<option value="' +
            gi +
            "-" +
            si +
            '" ' +
            (d.item === gi + "-" + si ? "selected" : "") +
            ">" +
            esc(i.name) +
            " — " +
            esc(money(i.price)) +
            "</option>",
        )
        .join("") +
      "</optgroup>",
  ).join("");
  const dates = Array.from(
    { length: new Date(Date.UTC(year, month, 0)).getUTCDate() },
    (_, i) => {
      const date = d.calendar + "-" + String(i + 1).padStart(2, "0");
      return (
        '<button type="button" data-date="' +
        date +
        '" aria-label="' +
        esc(dateLabel(date)) +
        '" aria-pressed="' +
        (d.date === date) +
        '" ' +
        (date < min || date > max ? "disabled" : "") +
        ">" +
        (i + 1) +
        "</button>"
      );
    },
  ).join("");
  app.innerHTML =
    '<section class="booking-page wrap"><div class="booking-heading"><div><div class="cap">Your next good hair day</div><h1>Make time<br>for yourself.</h1><p class="lead">Pick a date. Choose a time. We’ll take it from here.</p></div><div class="booking-hours"><span class="opening-dot"></span> Open every day<strong>10:00 AM — 9:00 PM</strong><a href="tel:+918123729873">+91 81237 29873</a></div></div><form id="simple-booking" novalidate><div class="booking-layout"><div class="booking-panel"><div class="booking-section-label"><span>01</span><h2>Choose your day</h2></div><div class="field"><label for="booking-branch">Salon</label><select id="booking-branch">' +
    ["s", "p"]
      .map(
        (id) =>
          '<option value="' +
          id +
          '" ' +
          (d.loc === id ? "selected" : "") +
          ">" +
          esc(locations[id].name) +
          "</option>",
      )
      .join("") +
    '</select></div><div class="calendar-nav"><button type="button" id="month-prev" aria-label="Previous month" ' +
    (d.calendar <= min.slice(0, 7) ? "disabled" : "") +
    '>←</button><h3 aria-live="polite">' +
    first.toLocaleDateString("en-IN", {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }) +
    '</h3><button type="button" id="month-next" aria-label="Next month" ' +
    (d.calendar >= max.slice(0, 7) ? "disabled" : "") +
    '>→</button></div><div class="booking-calendar" role="group" aria-label="Choose appointment date">' +
    ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
      .map((w) => '<span class="calendar-weekday">' + w + "</span>")
      .join("") +
    "<span></span>".repeat((first.getUTCDay() + 6) % 7) +
    dates +
    '</div><p class="small mute">Bengaluru time (IST). From tomorrow, up to 90 days ahead.</p><div class="booking-section-label"><span>02</span><h2>Choose your time</h2></div><p class="small mute">' +
    (d.date ? esc(dateLabel(d.date)) : "Select a date above.") +
    '</p><div class="booking-slots" role="group" aria-label="Preferred appointment time">' +
    slots
      .map(
        (t) =>
          '<button type="button" data-time="' +
          t +
          '" aria-pressed="' +
          (d.time === t) +
          '" ' +
          (!d.date ? "disabled" : "") +
          ">" +
          timeLabel(t) +
          "</button>",
      )
      .join("") +
    '</div><p class="small mute">Preferred start times only, not live availability. The salon confirms capacity, duration and your appointment on WhatsApp.</p></div><div class="booking-panel booking-details"><div class="booking-section-label"><span>03</span><h2>Your appointment</h2></div><div class="field"><label for="booking-service">Service</label><select id="booking-service"><option value="">Select a service</option>' +
    options +
    "</select></div>" +
    (selected ? referenceMarkup(selected) : "") +
    '<p class="small mute">Government taxes as applicable. Conditions apply. <a href="#services" data-go="services">Full service menu ↗</a></p><div class="booking-selection" aria-live="polite"><span>' +
    esc(locations[d.loc].name) +
    "</span><strong>" +
    (d.date ? esc(dateLabel(d.date)) : "Choose a date") +
    "</strong><span>" +
    (d.time ? esc(timeLabel(d.time)) : "Choose a time") +
    "</span>" +
    (selected
      ? "<span>" +
        esc(selected.name) +
        " · " +
        esc(money(selected.price)) +
        "</span>"
      : "") +
    '</div><div class="field"><label for="nm">Your name</label><input id="nm" maxlength="100" autocomplete="name" value="' +
    esc(d.name) +
    '"></div><div class="field"><label for="ph">Mobile / WhatsApp number</label><input id="ph" type="tel" maxlength="20" autocomplete="tel" placeholder="+91" value="' +
    esc(d.phone) +
    '"></div><div class="field"><label for="nt">Note (optional)</label><textarea id="nt" rows="2" maxlength="750">' +
    esc(d.note) +
    '</textarea></div><label class="consent"><input id="contact-consent" type="checkbox" ' +
    (d.contactConsent ? "checked" : "") +
    '> I agree to appointment contact. <a href="/privacy.html" target="_blank" rel="noopener">Privacy</a></label><div class="hp" aria-hidden="true"><label for="booking-website">Website</label><input id="booking-website" tabindex="-1" autocomplete="off"></div><div id="booking-bot"></div><p id="err" role="alert"></p><button class="btn" type="submit" id="bn" ' +
    (runtime.bookingEnabled ? "" : "disabled") +
    ">Request appointment ↗</button>" +
    (runtime.bookingEnabled
      ? ""
      : '<p class="small mute">Online setup is in progress. Call or WhatsApp to book now.</p>') +
    '<a id="booking-whatsapp-enquiry" class="booking-whatsapp" href="https://wa.me/918123729873" target="_blank" rel="noopener">Book on WhatsApp ↗</a></div></div></form></section>';
  const $ = (s) => app.querySelector(s);
  $("#month-prev").onclick = () => {
    d.calendar = new Date(Date.UTC(year, month - 2, 1))
      .toISOString()
      .slice(0, 7);
    rerender();
  };
  $("#month-next").onclick = () => {
    d.calendar = new Date(Date.UTC(year, month, 1)).toISOString().slice(0, 7);
    rerender();
  };
  app.querySelectorAll("[data-date]").forEach(
    (b) =>
      (b.onclick = () => {
        d.date = b.dataset.date;
        rerender();
      }),
  );
  app.querySelectorAll("[data-time]").forEach(
    (b) =>
      (b.onclick = () => {
        d.time = b.dataset.time;
        rerender();
      }),
  );
  $("#booking-branch").onchange = (e) => {
    d.loc = e.target.value;
    rerender();
  };
  $("#booking-service").onchange = (e) => {
    d.item = e.target.value;
    rerender();
  };
  for (const [id, key] of [
    ["nm", "name"],
    ["ph", "phone"],
    ["nt", "note"],
  ])
    $("#" + id).oninput = (e) => {
      d[key] = e.target.value;
    };
  $("#contact-consent").onchange = (e) => {
    d.contactConsent = e.target.checked;
  };
  const enquiry = $("#booking-whatsapp-enquiry");
  enquiry.onclick = () => {
    enquiry.href = whatsappBookingUrl({ ...d, branch: locations[d.loc].name,
      service: selected ? selected.group + " / " + selected.name : "",
      price: selected ? money(selected.price) : "" });
  };
  mountChallenge();
  $("#simple-booking").onsubmit = async (e) => {
    e.preventDefault();
    if (d.submitting) return;
    const error = $("#err"),
      phone = normalizePhone(d.phone),
      fail = (m) => {
        error.textContent = m;
      };
    if (!selected) return fail("Choose a service.");
    if (!d.date || !slots.includes(d.time))
      return fail("Choose a date and preferred time.");
    if ((d.name || "").trim().length < 2)
      return fail("Enter your name (at least two characters).");
    if (!phone) return fail("Enter a valid Indian mobile number.");
    if (!d.contactConsent) return fail("Please agree to appointment contact.");
    if (!runtime.bookingEnabled)
      return fail(
        "Please call or WhatsApp while online booking is being configured.",
      );
    if (!d.botToken) return fail("Please complete the security check.");
    const payload = {
      branchId: d.loc,
      serviceId: selected.serviceId,
      stylistPreference: "",
      occasion: "",
      preferredDate: d.date,
      preferredWindow:
        Number(d.time.slice(0, 2)) < 12
          ? "am"
          : Number(d.time.slice(0, 2)) < 16
            ? "noon"
            : "pm",
      customerName: d.name.trim(),
      customerPhone: phone,
      notes:
        "Requested time: " +
        d.time +
        " IST\nService: " +
        selected.group +
        " / " +
        selected.name +
        "\nMenu price: " +
        money(selected.price) +
        (d.note ? "\n" + d.note.trim() : ""),
      contactConsent: true,
    };
    const signature = JSON.stringify(payload);
    if (signature !== d.payloadSignature) {
      d.payloadSignature = signature;
      d.idempotencyKey = crypto.randomUUID();
    }
    Object.assign(payload, {
      idempotencyKey: d.idempotencyKey,
      turnstileToken: d.botToken,
      website: $("#booking-website").value,
    });
    d.submitting = true;
    const controls = [...app.querySelectorAll("button,input,select,textarea")];
    const previousDisabled = controls.map((c) => c.disabled);
    controls.forEach((c) => (c.disabled = true));
    $("#bn").textContent = "Saving request…";
    error.textContent = "";
    try {
      const result = await sendBooking(payload);
      d.reference = result.reference;
      if (!d.analyticsCounted) {
        trackAction("booking_request", d.loc);
        d.analyticsCounted = true;
      }
      if (window.location.pathname === "/book" || window.location.hash.startsWith("#book")) rerender();
    } catch (err) {
      error.textContent = err.message;
      d.botToken = "";
      mountChallenge();
    } finally {
      d.submitting = false;
      if (!d.reference) {
        controls.forEach((c, index) => {
          if (c.isConnected) c.disabled = previousDisabled[index];
        });
        if ($("#bn")) $("#bn").textContent = "Request appointment ↗";
      }
    }
  };
}


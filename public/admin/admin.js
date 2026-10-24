const $ = (selector) => document.querySelector(selector);
const names = { s: "Sobha Arcadia", p: "Prestige Tech Forest" };
const state = {
  config: null,
  session: null,
  me: null,
  view: "bookings",
  page: 1,
  items: [],
  selected: null,
  busy: false,
  generation: 0,
  authEpoch: 0,
};
const storageKey = "tg-staff-session";
const notice = (message) => {
  $("#notice").textContent = message;
};
function element(tag, text, className) {
  const e = document.createElement(tag);
  if (text != null) e.textContent = String(text);
  if (className) e.className = className;
  return e;
}
function dateLabel(value) {
  if (!value) return "Not set";
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? "Not set"
    : new Intl.DateTimeFormat("en-IN", {
        timeZone: "Asia/Kolkata",
        dateStyle: "medium",
        timeStyle: "short",
      }).format(d);
}
function localInput(value) {
  if (!value) return "";
  const p = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(value));
  const get = (k) => p.find((x) => x.type === k)?.value;
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}
function storeSession(session) {
  state.session = session;
  try {
    session
      ? sessionStorage.setItem(storageKey, JSON.stringify(session))
      : sessionStorage.removeItem(storageKey);
  } catch {}
}
function signedOut(message = "") {
  state.generation++;
  state.authEpoch++;
  storeSession(null);
  state.me = null;
  state.items = [];
  state.selected = null;
  $("#results").replaceChildren();
  $("#detail").replaceChildren();
  $("#identity").textContent = "";
  $("#desk").hidden = true;
  $("#logout").hidden = true;
  $("#login-panel").hidden = false;
  $("#password").value = "";
  notice(message);
}
async function auth(path, body) {
  if (!state.config?.supabaseUrl || !state.config?.supabaseAnonKey)
    throw new Error("Staff login is not configured yet.");
  const r = await fetch(state.config.supabaseUrl + "/auth/v1/" + path, {
    method: "POST",
    headers: {
      apikey: state.config.supabaseAnonKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const data = await r.json();
  if (!r.ok)
    throw new Error(
      data.msg ||
        data.error_description ||
        data.message ||
        "Sign in failed. Check credentials or contact the owner.",
    );
  return data;
}
let refreshInFlight = null;
async function refreshSession() {
  const epoch = state.authEpoch;
  const token = state.session?.refresh_token;
  if (!token) throw new Error("Please sign in again.");
  if (refreshInFlight?.epoch === epoch) return refreshInFlight.promise;
  const promise = (async () => {
    const data = await auth("token?grant_type=refresh_token", {
      refresh_token: token,
    });
    if (state.authEpoch !== epoch || state.session?.refresh_token !== token)
      throw new Error("Session changed. Please sign in again.");
    storeSession(data);
  })();
  refreshInFlight = { epoch, promise };
  try {
    return await promise;
  } finally {
    if (refreshInFlight?.promise === promise) refreshInFlight = null;
  }
}
async function request(path, options = {}, retry = true) {
  const generation = state.generation;
  const headers = {
    ...options.headers,
    Authorization: "Bearer " + state.session?.access_token,
  };
  if (options.body) headers["Content-Type"] = "application/json";
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  let response;
  try {
    response = await fetch(path, {
      ...options,
      headers,
      cache: "no-store",
      signal: controller.signal,
    });
  } catch (e) {
    if (e.name === "AbortError")
      throw new Error(
        "Connection timed out. Refresh to check whether your change was saved.",
      );
    throw new Error(
      "Connection unavailable. Your unsent changes are still on screen.",
    );
  } finally {
    clearTimeout(timeout);
  }
  if (generation !== state.generation)
    throw new Error("Session changed. Please try again.");
  if (response.status === 401 && retry) {
    const epoch = state.authEpoch;
    try {
      await refreshSession();
      if (state.authEpoch !== epoch || !state.session)
        throw new Error("Session changed.");
      return request(path, options, false);
    } catch {
      if (state.authEpoch === epoch)
        signedOut("Session expired. Sign in again.");
      throw new Error("Session expired or changed. Please try again.");
    }
  }
  if (response.status === 403) {
    signedOut("Staff access denied or removed. Contact the owner.");
    throw new Error("Staff access denied.");
  }
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    const e = new Error(data.error?.message || "Request failed. Please retry.");
    e.status = response.status;
    throw e;
  }
  return response;
}
async function json(path, options) {
  return (await request(path, options)).json();
}
function filterQuery() {
  const p = new URLSearchParams();
  for (const [id, key] of [
    ["branch", "branchId"],
    ["search", "q"],
  ]) {
    const value = $("#" + id).value.trim();
    if (value) p.set(key, value);
  }
  if (state.view === "bookings") {
    if ($("#status").value) p.set("status", $("#status").value);
    if ($("#date").value) p.set("date", $("#date").value);
  }
  return p;
}
async function openDesk() {
  state.me = await json("/api/staff/me");
  $("#login-panel").hidden = true;
  $("#desk").hidden = false;
  $("#logout").hidden = false;
  $("#identity").textContent = state.me.user.email;
  const all = state.me.memberships.some((m) => m.role === "owner");
  const branches = new Set(state.me.memberships.map((m) => m.branch_id));
  for (const option of $("#branch").options) {
    option.hidden = !!option.value && !all && !branches.has(option.value);
  }
  $("#branch").value = "";
  await loadList();
}
async function loadList() {
  const requestId = ++state.generation;
  state.selected = null;
  $("#detail").replaceChildren(
    element("p", "Select a booking to manage its request."),
  );
  $("#results").replaceChildren();
  $("#results-state").textContent = "Loading…";
  $("#prev").disabled = true;
  $("#next").disabled = true;
  const p = filterQuery();
  p.set("page", state.page);
  try {
    const data = await json("/api/staff/" + state.view + "?" + p);
    if (requestId !== state.generation) return;
    state.items = data.items;
    $("#results-state").textContent = data.items.length
      ? ""
      : "No matching records.";
    $("#page-label").textContent = "Page " + state.page;
    $("#prev").disabled = state.page === 1;
    $("#next").disabled = !data.hasMore;
    for (const item of data.items) renderRecord(item);
  } catch (e) {
    if (requestId === state.generation) {
      $("#results-state").textContent = "Records could not load.";
      notice(e.message);
    }
  }
}
function renderRecord(item) {
  if (state.view === "customers") {
    const card = element("article", null, "record");
    card.append(
      element("strong", item.customer_name || item.name || "Customer"),
      element("span", item.customer_phone || item.phone || ""),
    );
    if (item.booking_count != null)
      card.append(
        element(
          "small",
          item.booking_count + " request(s) in permitted branches",
        ),
      );
    if (item.last_request_at)
      card.append(
        element("small", "Last request: " + dateLabel(item.last_request_at)),
      );
    $("#results").append(card);
    return;
  }
  const button = element("button", null, "record");
  button.type = "button";
  button.dataset.id = item.id;
  button.setAttribute("aria-pressed", "false");
  button.append(
    element("strong", item.customer_name),
    element("span", item.reference + " · " + names[item.branch_id]),
    element(
      "small",
      item.preferred_date +
        " · " +
        item.preferred_window +
        " · " +
        item.service_id,
    ),
    element("span", item.status.replaceAll("_", " "), "badge"),
  );
  button.addEventListener("click", () => showDetail(item));
  $("#results").append(button);
}
async function showDetail(item) {
  state.selected = item;
  const selectionGeneration = state.generation;
  for (const button of $("#results").querySelectorAll("button"))
    button.setAttribute("aria-pressed", String(button.dataset.id === item.id));
  const panel = $("#detail");
  panel.replaceChildren(
    element("p", item.reference, "eyebrow"),
    element("h2", item.customer_name),
  );
  const dl = element("dl");
  for (const [label, value] of [
    ["Branch", names[item.branch_id]],
    ["Phone", item.customer_phone],
    ["Service", item.service_id],
    ["Preference", item.stylist_preference || "Salon recommendation"],
    ["Requested", item.preferred_date + " · " + item.preferred_window],
    ["Appointment", dateLabel(item.appointment_at)],
    ["Customer note", item.notes || "None"],
    ["Received", dateLabel(item.created_at)],
  ]) {
    dl.append(element("dt", label), element("dd", value));
  }
  panel.append(dl);
  const form = element("form");
  form.id = "edit-booking";
  const statusLabel = element("label", "Status");
  const select = element("select");
  select.name = "status";
  for (const status of [
    "pending",
    "contacted",
    "confirmed",
    "declined",
    "cancelled",
    "completed",
    "no_show",
  ]) {
    const option = element("option", status.replaceAll("_", " "));
    option.value = status;
    select.append(option);
  }
  select.value = item.status;
  statusLabel.append(select);
  const appointmentLabel = element(
    "label",
    "Agreed appointment time (Bengaluru)",
  );
  const appointment = element("input");
  appointment.type = "datetime-local";
  appointment.name = "appointmentAt";
  appointment.value = localInput(item.appointment_at);
  appointmentLabel.append(appointment);
  const noteLabel = element("label", "Internal note (staff only)");
  const note = element("textarea");
  note.maxLength = 1000;
  note.name = "internalNote";
  noteLabel.append(note);
  const save = element("button", "Save changes", "primary");
  save.type = "submit";
  form.append(
    statusLabel,
    appointmentLabel,
    noteLabel,
    save,
    element(
      "small",
      "Confirm only after agreeing the time with the customer. Changing the time does not send a notification.",
    ),
  );
  panel.append(form);
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    save.disabled = true;
    notice("");
    try {
      const payload = {
        version: item.version,
        status: select.value,
        appointmentAt: appointment.value
          ? new Date(appointment.value + ":00+05:30").toISOString()
          : null,
        internalNote: note.value.trim(),
      };
      if (payload.status === "confirmed" && !payload.appointmentAt)
        throw new Error("Set an agreed appointment time before confirming.");
      await json("/api/staff/bookings/" + item.id, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      notice("Changes saved.");
      await loadList();
    } catch (e) {
      notice(
        e.status === 409
          ? "Another staff member changed this booking. Refresh before editing again."
          : e.message,
      );
    } finally {
      save.disabled = false;
    }
  });
  const heading = element("h3", "Activity");
  panel.append(heading);
  const events = element("ol", null, "events");
  events.append(element("li", "Loading activity…"));
  panel.append(events);
  try {
    const data = await json("/api/staff/bookings/" + item.id + "/events");
    if (
      state.selected?.id !== item.id ||
      selectionGeneration !== state.generation
    )
      return;
    events.replaceChildren();
    for (const event of data.items) {
      const details = {
        ...(event.old_status ? { from: event.old_status } : {}),
        ...(event.new_status ? { to: event.new_status } : {}),
        ...(event.note ? { note: event.note } : {}),
        ...(event.old_appointment_at
          ? { previousAppointment: dateLabel(event.old_appointment_at) }
          : {}),
        ...(event.new_appointment_at
          ? { appointment: dateLabel(event.new_appointment_at) }
          : {}),
      };
      const message =
        typeof details === "object"
          ? Object.entries(details)
              .map(
                ([k, v]) =>
                  `${k}: ${typeof v === "object" ? JSON.stringify(v) : v}`,
              )
              .join("\n")
          : String(details);
      events.append(
        element(
          "li",
          `${dateLabel(event.created_at)} · ${event.kind || "Updated"}${message ? "\n" + message : ""}`,
        ),
      );
    }
    if (!data.items.length) events.append(element("li", "No activity yet."));
  } catch (e) {
    events.replaceChildren(element("li", "Activity unavailable."));
    notice(e.message);
  }
}
$("#login-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const epoch = ++state.authEpoch;
  const button = e.currentTarget.querySelector("button");
  button.disabled = true;
  notice("");
  try {
    const data = await auth("token?grant_type=password", {
      email: $("#email").value.trim(),
      password: $("#password").value,
    });
    if (epoch !== state.authEpoch) return;
    storeSession(data);
    $("#password").value = "";
    await openDesk();
  } catch (error) {
    if (epoch === state.authEpoch) signedOut(error.message);
  } finally {
    button.disabled = false;
  }
});
$("#logout").addEventListener("click", () => {
  const token = state.session?.access_token;
  signedOut("Signed out.");
  if (token && state.config)
    fetch(state.config.supabaseUrl + "/auth/v1/logout", {
      method: "POST",
      headers: {
        apikey: state.config.supabaseAnonKey,
        Authorization: "Bearer " + token,
      },
    }).catch(() => {});
});
$("#filters").addEventListener("submit", (e) => {
  e.preventDefault();
  state.page = 1;
  notice("");
  loadList();
});
$("#refresh").addEventListener("click", () => loadList());
$("#prev").addEventListener("click", () => {
  if (state.page > 1) {
    state.page--;
    loadList();
  }
});
$("#next").addEventListener("click", () => {
  state.page++;
  loadList();
});
for (const view of ["bookings", "customers"])
  $("#" + view + "-tab").addEventListener("click", () => {
    state.view = view;
    state.page = 1;
    $("#bookings-tab").setAttribute(
      "aria-pressed",
      String(view === "bookings"),
    );
    $("#customers-tab").setAttribute(
      "aria-pressed",
      String(view === "customers"),
    );
    for (const id of ["status-filter", "date-filter", "export"])
      $("#" + id).hidden = view !== "bookings";
    $("#results-heading").textContent =
      view === "bookings" ? "Bookings" : "Customers";
    loadList();
  });
$("#export").addEventListener("click", async () => {
  const button = $("#export");
  button.disabled = true;
  try {
    const response = await request("/api/staff/export?" + filterQuery());
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = element("a");
    a.href = url;
    a.download = "salon-bookings.csv";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    notice("CSV downloaded. Store customer data securely.");
  } catch (e) {
    notice(e.message);
  } finally {
    button.disabled = false;
  }
});
async function boot() {
  try {
    const r = await fetch("/api/config", { cache: "no-store" });
    if (!r.ok)
      throw new Error("Staff login is unavailable. Please try again later.");
    state.config = await r.json();
    let saved;
    try {
      saved = JSON.parse(sessionStorage.getItem(storageKey));
    } catch {}
    if (saved?.refresh_token) {
      storeSession(saved);
      const epoch = state.authEpoch;
      try {
        await refreshSession();
        if (state.authEpoch !== epoch) return;
        await openDesk();
      } catch {
        if (state.authEpoch === epoch) signedOut("Sign in to continue.");
      }
    }
  } catch (e) {
    notice(e.message);
  }
}
boot();

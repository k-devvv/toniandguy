import { imageAttributes } from "./media.js";
import REFERENCES from "./service-image-manifest-v2.json" with { type: "json" };
const exactReferences = new Map(
  REFERENCES.map((ref) => [ref.group + "|" + ref.name, ref]),
);
const esc = (value) =>
  String(value ?? "").replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
  );
const referencesById = new Map(REFERENCES.map((ref) => [ref.id, ref]));
export function serviceReference(service) {
  if (service.referenceId)
    return referencesById.get(service.referenceId) || null;
  return (
    exactReferences.get((service.group || "") + "|" + (service.name || "")) ||
    null
  );
}
export function referenceMarkup(service, compact = false) {
  const ref = serviceReference(service);
  if (!ref)
    return compact
      ? ""
      : '<p class="small mute">A service reference will be added after consultation.</p>';
  const style =
    "width:" +
    (ref.columns || 4) * 100 +
    "%;height:" +
    (ref.rows || 4) * 100 +
    "%;left:-" +
    (ref.cell % 4) * 100 +
    "%;top:-" +
    Math.floor(ref.cell / 4) * 100 +
    "%";
  const image =
    '<div class="service-ref-frame service-ref-sprite"><img src="' +
    esc(ref.src) +
    '" alt="' +
    esc(ref.alt) +
    '" ' + imageAttributes(ref.src, { priority: !compact }) + ' style="' +
    style +
    '"></div>';
  if (compact) return image;
  return (
    '<figure class="service-reference">' +
    image +
    '<figcaption><span class="cap">Service reference · AI illustration</span><strong>' +
    esc(service.name) +
    "</strong><p>Illustrative example of this service. Your stylist or therapist confirms the treatment, suitability and finish during consultation.</p></figcaption></figure>"
  );
}

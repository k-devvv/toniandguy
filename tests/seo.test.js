import { test } from "node:test";
import assert from "node:assert/strict";
import { routeToPath, pathToRoute, pageMetadata, structuredData } from "../public/seo.js";
test("clean routes round-trip and preserve booking queries", () => {
  for (const id of ["home", "services", "sobha-arcadia", "prestige-tech-forest", "service-cut", "colour-caramel", "stylist-precision", "occasion-wedding"])
    assert.equal(pathToRoute(routeToPath(id)), id);
  assert.equal(routeToPath("#book?service=0-2"), "/book?service=0-2");
  assert.equal(pathToRoute("/services/"), "services");
  assert.equal(pathToRoute("/unknown/path"), null);
  assert.equal(routeToPath("javascript:alert(1)"), null);
});
test("metadata has distinct canonicals and keeps private or placeholder views out of search", () => {
  assert.equal(pageMetadata("services").canonical, "https://toniandguybangalore.in/services");
  assert.match(pageMetadata("book").robots, /noindex/);
  assert.match(pageMetadata("voices").robots, /noindex/);
  assert.match(pageMetadata("stylist-precision").robots, /noindex/);
  assert.notEqual(pageMetadata("sobha-arcadia").description, pageMetadata("prestige-tech-forest").description);
});
test("salon schema uses branch-specific information without invented reviews", () => {
  const data = structuredData("sobha-arcadia", pageMetadata("sobha-arcadia"));
  const salons = data["@graph"].filter(x => x["@type"] === "HairSalon");
  assert.equal(salons.length, 1);
  assert.equal(salons[0].telephone, "+918123729873");
  assert.equal(salons[0].openingHoursSpecification[0].closes, "21:00");
  assert.equal(salons[0].aggregateRating, undefined);
});

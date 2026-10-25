import { MENU_CARD, PRICE_GROUPS } from "./service-prices.js";
import { referenceMarkup } from "./service-images.js";
const esc = (v) =>
  String(v ?? "").replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
  );
const money = (v) => "₹" + v.toLocaleString("en-IN");
export function renderMenuCard(app) {
  app.innerHTML =
    '<section class="booking-page wrap pdf-menu-page"><div class="cap">TONI&amp;GUY · Hairdressing</div><div class="menu-title-row"><div><h1>Our menu.</h1><p class="lead">Hair, beauty and grooming services.</p></div><a class="btn sec" href="' +
    esc(MENU_CARD.source) +
    '" target="_blank" rel="noopener">View original menu ↗</a></div><p class="menu-tax-note">' +
    esc(MENU_CARD.notice) +
    '</p><div class="pdf-menu-grid">' +
    MENU_CARD.sections
      .map((section, gi) => {
        const group = PRICE_GROUPS[gi];
        return (
          '<section class="pdf-menu-section" style="--price-columns:' +
          section.columns.length +
          '"><h2>' +
          esc(section.name) +
          "</h2>" +
          (section.note
            ? '<p class="small mute menu-section-note">' +
              esc(section.note) +
              "</p>"
            : "") +
          '<div class="pdf-menu-header"><span></span><span>Service</span>' +
          section.columns.map((c) => "<span>" + esc(c) + "</span>").join("") +
          "</div>" +
          section.rows
            .map((row, ri) => {
              const available = group.items.filter((i) => i.rowIndex === ri),
                first = available[0],
                firstIndex = group.items.indexOf(first);
              return (
                '<div class="pdf-menu-row"><a class="menu-row-picture" href="#book?service=' +
                gi +
                "-" +
                firstIndex +
                '" aria-label="Book ' +
                esc(row.name) +
                '">' +
                referenceMarkup({ ...first, group: group.name }, true) +
                '</a><a class="menu-row-name" href="#book?service=' +
                gi +
                "-" +
                firstIndex +
                '">' +
                esc(row.name) +
                "</a>" +
                row.prices
                  .map((p, vi) => {
                    if (p == null)
                      return '<span class="menu-unavailable" aria-label="Not listed">—</span>';
                    const index = group.items.findIndex(
                      (i) => i.rowIndex === ri && i.variantIndex === vi,
                    );
                    return (
                      '<a class="menu-row-price" href="#book?service=' +
                      gi +
                      "-" +
                      index +
                      '" aria-label="Book ' +
                      esc(row.name) +
                      " · " +
                      esc(row.variantLabels?.[vi] || section.columns[vi]) +
                      " · " +
                      money(p) +
                      '">' +
                      (row.variantLabels
                        ? esc(row.variantLabels[vi]) + "<br>"
                        : "") +
                      money(p) +
                      "</a>"
                    );
                  })
                  .join("") +
                "</div>"
              );
            })
            .join("") +
          "</section>"
        );
      })
      .join("") +
    '</div><div class="menu-source-panel"><p>' +
    esc(MENU_CARD.notice) +
    '</p><details><summary>Original menu card · all three pages</summary><p class="small mute">Includes the two printed haircut tables and the original location/contact panel.</p><iframe title="Original TONI&GUY menu card" src="' +
    esc(MENU_CARD.source) +
    '" loading="lazy"></iframe><a href="' +
    esc(MENU_CARD.source) +
    '" download>Download menu PDF</a></details></div></section>';
}

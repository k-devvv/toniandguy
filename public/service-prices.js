import MENU_CARD from "./menu-card-data.json" with { type: "json" };
export { MENU_CARD };
export const PRICE_SOURCE = MENU_CARD.source;
export const PRICE_GROUPS = MENU_CARD.sections.map((section) => ({
  name: section.name,
  note: section.note,
  columns: section.columns,
  items: section.rows.flatMap((row, rowIndex) =>
    row.prices.flatMap((price, variantIndex) =>
      price == null
        ? []
        : [
            {
              name:
                row.name +
                (section.columns.length > 1
                  ? " · " +
                    (row.variantLabels?.[variantIndex] ||
                      section.columns[variantIndex])
                  : ""),
              menuName: row.name,
              price,
              serviceId: section.category,
              referenceId: row.referenceIds[variantIndex],
              rowIndex,
              variantIndex,
              variant:
                row.variantLabels?.[variantIndex] ||
                section.columns[variantIndex],
            },
          ],
    ),
  ),
}));

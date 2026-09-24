import type { ComponentMeta } from "./types";
import { hiddenProp } from "./shared";

const meta: ComponentMeta = {
  name: "Grid Item",
  description:
    "An optional wrapper that makes one child of a CuiGrid span several columns or rows. Children that occupy a single cell do not need it.",

  props: [
    {
      name: "colSpan",
      type: "1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | full",
      default: "—",
      description: "Columns to span. full spans the whole row (1 / -1). Responsive object accepted",
    },
    {
      name: "rowSpan",
      type: "1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | full",
      default: "—",
      description: "Rows to span. full spans the whole column",
    },
    hiddenProp,
  ],

  slots: [{ name: "default", description: "The item's content" }],
};

export default meta;

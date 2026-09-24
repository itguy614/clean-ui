import type { ComponentMeta } from "./types";
import { hiddenProp } from "./shared";

const meta: ComponentMeta = {
  name: "Grid",
  description:
    "A CSS Grid container for two-dimensional layouts. Columns, rows and gaps all take a responsive object keyed by breakpoint.",

  props: [
    {
      name: "cols",
      type: "1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12",
      default: "1",
      description:
        "Column count — equal-width tracks of minmax(0, 1fr), so a wide child cannot stretch its column. Responsive object accepted",
    },
    {
      name: "rows",
      type: "1 | 2 | 3 | 4 | 5 | 6",
      default: "—",
      description: "Explicit row count. Leave it unset to let rows be created as items need them",
    },
    { name: "gap", type: "TailwindSpacing", default: "—", description: "Gap on both axes, on the Tailwind spacing scale" },
    {
      name: "rowGap",
      type: "TailwindSpacing",
      default: "—",
      description: "Row gap. Setting either rowGap or colGap replaces gap entirely rather than overriding one axis of it",
    },
    { name: "colGap", type: "TailwindSpacing", default: "—", description: "Column gap. Same caveat as rowGap" },
    {
      name: "debug",
      type: "boolean",
      default: "false",
      description: "Outline the grid and its children, and label the nesting depth",
    },
    hiddenProp,
  ],

  slots: [{ name: "default", description: "Grid items" }],
};

export default meta;

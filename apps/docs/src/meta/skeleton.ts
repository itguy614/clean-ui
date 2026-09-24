import type { ComponentMeta } from "./types";
import { hiddenProp } from "./shared";

const meta: ComponentMeta = {
  name: "Skeleton",
  description:
    "Placeholder loading indicators that hint at the shape of content before it arrives. Supports text lines, rectangles and circles with shimmer or pulse animations.",

  props: [
    { name: "variant", type: "text | rectangle | circle", default: "text", description: "Shape variant" },
    {
      name: "animation",
      type: "shimmer | pulse | none",
      default: "shimmer",
      description: "Animation style. none for a static placeholder",
    },
    { name: "lines", type: "number", default: "3", description: "Number of lines (text variant only)" },
    {
      name: "lastLineWidth",
      type: "string",
      default: "60%",
      description: "Width of the last text line, so a paragraph trails off the way real text does",
    },
    { name: "width", type: "string", default: "100%", description: "CSS width (rectangle variant)" },
    { name: "height", type: "string", default: "1rem", description: "CSS height (rectangle variant)" },
    { name: "size", type: "string", default: "3rem", description: "Diameter (circle variant). A raw CSS length, not the shared size scale" },
    {
      name: "rounded",
      type: "none | sm | md | lg | full",
      default: "sm",
      description: "Border radius (rectangle variant only — a circle is always full)",
    },
    hiddenProp,
  ],
};

export default meta;

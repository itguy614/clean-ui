import type { ComponentMeta } from "./types";
import { colorProp, hiddenProp, titleAsProp } from "./shared";

const meta: ComponentMeta = {
  name: "Empty State",
  description:
    "A centered placeholder for when there's no content to display — empty lists, search results, tables, or first-time experiences.",

  props: [
    { name: "icon", type: "string", description: "Phosphor icon name, rendered in a tinted circle" },
    { name: "title", type: "string", description: "Heading text" },
    titleAsProp("h3"),
    { name: "description", type: "string", description: "Supporting text below the title" },
    {
      name: "size",
      type: "xs | sm | md | lg | xl",
      default: "md",
      description: "Icon size, font sizes and spacing. Only sm, md and lg differ — xs and xl clamp to the nearest",
    },
    colorProp("Color role for the icon circle — its tint and the icon itself"),
    hiddenProp,
  ],

  slots: [
    { name: "icon", description: "Replaces the icon circle entirely — a custom illustration, an image, a larger graphic" },
    {
      name: "default",
      description: "Replaces the title and description together. The icon area and actions slot are unaffected",
    },
    { name: "actions", description: "Action buttons below the description — the way out of the empty state" },
  ],
};

export default meta;

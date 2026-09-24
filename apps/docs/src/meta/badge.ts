import type { ComponentMeta } from "./types";
import { clampedSizeProp, colorProp, hiddenProp, roundedProp } from "./shared";

const meta: ComponentMeta = {
  name: "Badge",
  description:
    "Small coloured label for status, counts and removable tags. Also renders as a bare dot for presence indicators.",

  props: [
    { name: "variant", type: "solid | subtle | outline", default: "subtle", description: "Visual style" },
    colorProp("Colour role from the colour system"),
    clampedSizeProp("sm and md", "sm", "Badge size"),
    { ...roundedProp, default: "full", description: "Border radius. Badges default to a pill" },
    { name: "dot", type: "boolean", default: "false", description: "Render as a bare coloured dot with no text" },
    {
      name: "removable",
      type: "boolean",
      default: "false",
      description: "Show a remove button that emits remove — the tag pattern. Ignored in dot mode",
    },
    {
      name: "animation",
      type: "pulse | bounce | ping | none",
      default: "none",
      description: "Attention animation. ping only applies to dot mode",
    },
    hiddenProp,
  ],

  slots: [{ name: "default", description: "Badge label. Not rendered in dot mode" }],

  events: [
    {
      name: "remove",
      payload: "—",
      description: "Fires when the remove button is activated. The badge does not remove itself — you own the list",
    },
  ],
};

export default meta;

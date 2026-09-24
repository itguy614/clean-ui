import type { ComponentMeta } from "./types";
import { clampedSizeProp, colorProp, hiddenProp } from "./shared";

const meta: ComponentMeta = {
  name: "Progress",
  description:
    "Completion of a known-length task, as a bar or a ring — plus an indeterminate mode for work whose length you cannot know.",

  props: [
    { name: "value", type: "number", default: "0", description: "Current value, clamped to the range 0…max" },
    { name: "max", type: "number", default: "100", description: "Value that counts as complete" },
    { name: "variant", type: "bar | circle", default: "bar", description: "Horizontal bar, or a ring" },
    colorProp("Colour role. The fill uses --cui-{role}, the track --cui-{role}-bg"),
    clampedSizeProp("sm, md and lg", "md", "Bar thickness (0.375–1rem) or ring diameter (40–96px)"),
    {
      name: "showLabel",
      type: "boolean",
      default: "false",
      description: "Show the rounded percentage — beside the bar, or inside the ring",
    },
    {
      name: "indeterminate",
      type: "boolean",
      default: "false",
      description: "Unknown progress: the bar slides, the ring spins, and aria-valuenow is dropped",
    },
    {
      name: "animation",
      type: "none | stripe | shimmer",
      default: "none",
      description: "Texture on the fill. Bar variant only, and ignored while indeterminate",
    },
    hiddenProp,
  ],

  slots: [
    {
      name: "label",
      payload: "{ value, max, percent }",
      description:
        "Replaces the percentage label — \"3 of 10 files\", a size, a countdown. Rendering it also turns the label on, so showLabel is not needed",
    },
  ],
};

export default meta;

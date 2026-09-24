import type { ComponentMeta } from "./types";
import { clampedSizeProp, colorProp, disabledProp, hiddenProp } from "./shared";

const meta: ComponentMeta = {
  name: "Rating",
  description:
    "A star scale with hover preview, optional half steps and a display-only mode. Click a star to set the value, click it again to clear.",
  interactive: true,

  props: [
    { name: "v-model", type: "number", default: "0", description: "The current rating. 0 means unrated" },
    { name: "max", type: "number", default: "5", description: "How many icons to draw" },
    {
      name: "half",
      type: "boolean",
      default: "false",
      description: "Allow .5 steps — the left half of an icon sets n − 0.5, the right half sets n",
    },
    clampedSizeProp("sm, md, lg and xl", "md", "Icon size"),
    colorProp("Color role for the filled icons. Empty ones always use the tertiary text color", "warning"),
    { name: "icon", type: "string", default: "star", description: "Icon name, drawn at fill weight when set and regular when not" },
    { name: "halfIcon", type: "string", default: "star-half", description: "Icon for the half-filled state. Only read when half is set" },
    { name: "readonly", type: "boolean", default: "false", description: "Display only — no hover preview, no clicking" },
    { name: "showValue", type: "boolean", default: "false", description: "Print the numeric value after the icons" },
    {
      name: "clearable",
      type: "boolean",
      default: "true",
      description: "Clicking the current value resets it to 0. Set false to make the rating one-way once set",
    },
    {
      name: "label",
      type: "string",
      description: "Text above the icons. It renders as a bare label element with no for, so it labels nothing — see Accessibility",
    },
    disabledProp,
    hiddenProp,
  ],

  events: [
    {
      name: "update:modelValue",
      payload: "number",
      description: "Fires with the new rating, or 0 when the current value is clicked and clearable is set (v-model)",
    },
  ],

  methods: [
    { name: "el", signature: "HTMLElement | null", description: "The root element" },
    {
      name: "focus",
      signature: "(opts?: FocusOptions) => void",
      description: "Focus the root. The root carries no tabindex, so this only takes effect if you give it one",
    },
    { name: "blur", signature: "() => void", description: "Blur the root" },
  ],
};

export default meta;

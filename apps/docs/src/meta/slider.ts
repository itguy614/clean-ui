import type { ComponentMeta } from "./types";
import { clampedSizeProp, colorProp, disabledProp, hiddenProp, nativeControlProps } from "./shared";

const meta: ComponentMeta = {
  name: "Slider",
  description:
    "A numeric range control — a styled track and thumb drawn over a native input[type=range], so dragging, arrow keys and Home/End all come from the browser.",
  interactive: true,

  props: [
    { name: "v-model", type: "number", default: "0", description: "The current value" },
    { name: "min", type: "number", default: "0", description: "Lower bound" },
    { name: "max", type: "number", default: "100", description: "Upper bound" },
    { name: "step", type: "number", default: "1", description: "Increment, for both dragging and arrow keys" },
    clampedSizeProp("sm, md and lg", "md", "Track and thumb size"),
    colorProp("Color role for the track fill and the thumb. A disabled slider ignores it and draws in the tertiary text color"),
    disabledProp,
    {
      name: "label",
      type: "string",
      description: "Text above the track. It renders as a bare label element with no for, so it labels nothing — see Accessibility",
    },
    { name: "showValue", type: "boolean", default: "false", description: "Print the current value above the track, right-aligned" },
    {
      name: "formatValue",
      type: "(value: number) => string",
      description: "Formats the printed value and the min/max labels. It does not reach assistive technology — see Accessibility",
    },
    { name: "showRange", type: "boolean", default: "false", description: "Print the min and max below the track" },
    { name: "thumbIcon", type: "string", description: "Icon name drawn inside the thumb. The #thumb slot replaces it" },
    hiddenProp,
    ...nativeControlProps,
  ],

  slots: [
    {
      name: "thumb",
      description: "Replaces the thumb's contents. The thumb itself is pointer-events: none — the native range input above it takes the input",
    },
  ],

  events: [
    {
      name: "update:modelValue",
      payload: "number",
      description: "Fires continuously while dragging and on every arrow-key step (v-model)",
    },
  ],

  methods: [
    { name: "el", signature: "HTMLInputElement | null", description: "The native range input, which is the focusable element" },
    {
      name: "focus",
      signature: "(opts?: FocusOptions) => void",
      description: "Focus the range input. Forwards FocusOptions, so { preventScroll: true } works",
    },
    { name: "blur", signature: "() => void", description: "Blur the range input" },
  ],
};

export default meta;

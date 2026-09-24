import type { ComponentMeta } from "./types";
import { clampedSizeProp, disabledProp, hiddenProp, nativeControlProps } from "./shared";

const meta: ComponentMeta = {
  name: "Color Picker",
  description:
    "A saturation/brightness gradient, hue and alpha sliders, a text field with a HEX/RGB/HSL toggle, and preset palettes — including one read live from the active theme.",
  interactive: true,

  props: [
    { name: "modelValue", type: "string", default: "#000000", description: "Colour value (v-model). Any format parseColor understands — hex, rgb(), rgba(), hsl()" },
    { name: "format", type: "hex | rgb | hsl", default: "hex", description: "Format the component emits. The toggle button changes it at runtime; this is the starting value" },
    { name: "palette", type: "string[]", description: "Custom swatch row. Takes precedence over presetPalette" },
    { name: "presetPalette", type: "theme | basic | material | tailwind", description: "Built-in swatch row. theme reads the live CSS scale, so it follows the active theme and re-reads when the theme class on <html> changes" },
    { name: "showAlpha", type: "boolean", default: "false", description: "Show the opacity slider. With alpha below 1 the value is emitted as rgba()/hsla() regardless of format" },
    { name: "showInput", type: "boolean", default: "true", description: "Show the text field. It is the only keyboard-operable control in the component — see Accessibility" },
    { name: "showFormatToggle", type: "boolean", default: "true", description: "Show the HEX/RGB/HSL button beside the text field" },
    { name: "swatchOnly", type: "boolean", default: "false", description: "Drop the gradient and sliders, leaving the swatches and text field" },
    clampedSizeProp("sm, md and lg", "md", "Panel width and control sizing"),
    disabledProp,
    hiddenProp,
    ...nativeControlProps,
  ],

  events: [
    { name: "update:modelValue", payload: "string", description: "Fires on every gradient/slider drag, swatch click and committed text entry, formatted per the active format" },
  ],

  methods: [
    { name: "focus", signature: "(options?: FocusOptions) => void", description: "Focus the text field, or the root when showInput is false" },
    { name: "blur", signature: "() => void", description: "Blur whichever element focus() would have focused" },
    { name: "el", signature: "HTMLElement | null", description: "The root element" },
  ],
};

export default meta;

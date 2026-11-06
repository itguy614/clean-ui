import type { ComponentMeta } from "./types";
import { clampedSizeProp, disabledProp, hiddenProp, nativeControlProps } from "./shared";

const meta: ComponentMeta = {
  name: "Color Picker",
  description:
    "A saturation/brightness gradient, hue and alpha sliders, a text field with a HEX/RGB/HSL toggle, and preset palettes — including one read live from the active theme.",
  interactive: true,

  props: [
    { name: "modelValue", type: "string", default: "#000000", description: "Colour value (v-model). Any format parseColor understands — hex (#rgb, #rgba, #rrggbb, #rrggbbaa), rgb(), rgba(), hsl(), hsla()" },
    { name: "format", type: "hex | rgb | hsl", default: "hex", description: "Format the component emits. The toggle button changes it at runtime; this is the starting value. Below full opacity hex is the 8-digit #rrggbbaa form, rgb and hsl their rgba()/hsla() forms" },
    { name: "palette", type: "string[]", description: "Custom swatch row. Takes precedence over presetPalette" },
    { name: "presetPalette", type: "theme | basic | material | tailwind", description: "Built-in swatch row. theme reads the live CSS scale, so it follows the active theme and re-reads when the theme class on <html> changes" },
    { name: "showAlpha", type: "boolean", default: "false", description: "Show the opacity slider. With alpha below 1 the value carries it in every format: #rrggbbaa for hex, rgba()/hsla() for rgb and hsl. An opaque colour stays #rrggbb" },
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
    { name: "focus", signature: "(options?: FocusOptions) => void", description: "Focus the text field; without one, the gradient's slider pair, or the swatches when swatchOnly" },
    { name: "blur", signature: "() => void", description: "Blur whichever element focus() would have focused" },
    { name: "el", signature: "HTMLElement | null", description: "The root element" },
  ],

  tokens: [
    { name: "--cui-color-picker-width", default: "per size", description: "Width of the whole picker" },
    { name: "--cui-color-picker-height", default: "per size", description: "Height of the saturation/brightness gradient" },
    { name: "--cui-color-picker-font-size", default: "per size", description: "Size of the text field and the format button" },
    { name: "--cui-color-picker-bg", default: "var(--cui-surface-base)", description: "Background of the picker and its text field" },
    { name: "--cui-color-picker-border", default: "1px solid var(--cui-border)", description: "Frame around the picker. A whole border shorthand (width, style and colour): a colour alone leaves it with no border. The gradient's top corners assume a 1px frame" },
    { name: "--cui-color-picker-radius", default: "var(--cui-radius-lg)", description: "Corner radius of the frame; the gradient's top corners follow it" },
    { name: "--cui-color-picker-focus-ring", default: "#000 on the handles, var(--cui-primary-focus-ring) on the swatches", description: "Colour of the focus ring on a handle or swatch" },
  ],
};

export default meta;

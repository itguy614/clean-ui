import type { ComponentMeta } from "./types";

const meta: ComponentMeta = {
  name: "Panel",
  description:
    "A layout primitive that paints a background: a color, an image or a gradient, with an optional grain that hides banding.",

  props: [
    { name: "as", type: "string", default: "div", description: "The element to render" },
    {
      name: "color",
      type: "CuiColorOrCss",
      default: "var(--cui-surface-base)",
      description: "Base color, the bottom layer: a color role or any CSS color",
    },
    { name: "image", type: "string", description: "Background image URL, painted over the color and under the gradient" },
    { name: "from", type: "CuiColorOrCss", description: "First gradient stop (a role or any CSS color). A gradient needs `from` and `to`" },
    { name: "via", type: "CuiColorOrCss", description: "Optional middle stop" },
    { name: "to", type: "CuiColorOrCss", description: "Last gradient stop" },
    { name: "angle", type: "number", default: "180", description: "Direction in degrees (0 up, 90 right, 180 down)" },
    {
      name: "smooth",
      type: "boolean",
      default: "false",
      description: "Lay a fine grain over the gradient to hide banding. Gradients only",
    },
    {
      name: "gradient",
      type: "string",
      description: "A raw CSS gradient (radial, conic, ...). Wins over from / via / to / angle",
    },
    { name: "rounded", type: "none | sm | md | lg | full", default: "none", description: "Corner radius" },
    { name: "hidden", type: "boolean", default: "false", description: "Hide the component (v-show)" },
  ],

  slots: [{ name: "default", description: "Content painted over the background" }],

  tokens: [
    { name: "--cui-panel-bg", default: "the layers below", description: "The whole background shorthand, replacing every layer" },
    { name: "--cui-panel-radius", default: "per rounded", description: "Corner radius" },
  ],
};

export default meta;

import type { ComponentMeta } from "./types";

const meta: ComponentMeta = {
  name: "Button",
  description:
    "Interactive button component with semantic colors, multiple variants, sizes, and loading state.",
  interactive: true,

  props: [
    {
      name: "color",
      type: "primary | secondary | success | error | warning | info | surface | surface-light | surface-dark",
      default: "primary",
      description: "Color role from the color system",
    },
    { name: "variant", type: "solid | outline | dash | ghost", default: "outline", description: "Visual variant" },
    { name: "size", type: "xs | sm | md | lg | xl", default: "md", description: "Button size (md matches 1rem body text)" },
    { name: "rounded", type: "sm | md | lg | full", default: "md", description: "Border radius (md uses --cui-button-radius)" },
    { name: "type", type: "button | submit | reset", default: "button", description: "HTML button type attribute" },
    { name: "href", type: "string", description: "Renders as an <a> link with this URL" },
    { name: "to", type: "string | object", description: "Renders as a <router-link> with this route" },
    {
      name: "icon",
      type: "boolean",
      default: "false",
      description: "Icon-only: square, no horizontal padding. Also opts out of the 24px minimum target size",
    },
    { name: "loading", type: "boolean", default: "false", description: "Shows spinner and disables interaction" },
    { name: "disabled", type: "boolean", default: "false", description: "Disabled state (uses aria-disabled for links)" },
    { name: "hidden", type: "boolean", default: "false", description: "Hides the button with v-show" },
  ],

  slots: [
    { name: "default", description: "Button label" },
    { name: "prefix", description: "Leading adornment — icon or badge" },
    { name: "suffix", description: "Trailing adornment — icon or badge" },
  ],

  events: [{ name: "click", payload: "MouseEvent", description: "Fires on activation, unless disabled or loading" }],

  tokens: [
    { name: "--cui-button-height", default: "per size", description: "Overall height, floored at --cui-control-min-target" },
    { name: "--cui-button-px", default: "per size", description: "Horizontal padding (0 when icon is set)" },
    { name: "--cui-button-gap", default: "per size", description: "Gap between label and prefix/suffix" },
    { name: "--cui-button-font-size", default: "per size", description: "Label font size" },
    { name: "--cui-button-radius", default: "0.375rem", description: "Corner radius used by rounded=\"md\"" },
    { name: "--cui-button-bg", default: "per variant", description: "Resting background" },
    { name: "--cui-button-color", default: "per variant", description: "Label color" },
    { name: "--cui-button-border", default: "per variant", description: "Border shorthand" },
    { name: "--cui-button-hover-bg", default: "per variant", description: "Background on hover" },
    { name: "--cui-button-hover-color", default: "per variant", description: "Label color on hover" },
    { name: "--cui-button-hover-border", default: "per variant", description: "Border color on hover" },
    { name: "--cui-button-active-bg", default: "per variant", description: "Background while pressed" },
    { name: "--cui-button-focus-ring", default: "per color", description: "Focus-visible outline color" },
    {
      name: "--cui-control-min-target",
      default: "24px",
      description: "Shared minimum target size (WCAG 2.5.8) — also applies to inputs, selects and tree-view hit areas",
    },
  ],
};

export default meta;

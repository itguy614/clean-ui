import type { ComponentMeta } from "./types";
import { colorProp, disabledProp, hiddenProp, visibleProp } from "./shared";

const meta: ComponentMeta = {
  name: "Tooltip",
  description:
    "A small label that appears beside its trigger on hover or focus. Positioned by Floating UI, with auto-flip near the viewport edge.",
  interactive: true,

  props: [
    { name: "text", type: "string", description: "Tooltip text. The #content slot replaces it" },
    {
      name: "placement",
      type: "top | bottom | left | right | auto",
      default: "top",
      description: "Preferred side. Flips when there is not room",
    },
    {
      name: "trigger",
      type: "hover | focus | click | hover-focus",
      default: "hover-focus",
      description: "What shows the tooltip. The default covers pointer and keyboard both",
    },
    { name: "showDelay", type: "number", default: "200", description: "Delay before showing, in ms" },
    {
      name: "hideDelay",
      type: "number",
      default: "100",
      description: "Delay before hiding, in ms — the grace period for moving the pointer onto the tooltip",
    },
    { name: "noArrow", type: "boolean", default: "false", description: "Hide the pointing arrow" },
    {
      ...colorProp("Color role for the panel. Unset renders the neutral dark tooltip", "—"),
    },
    visibleProp(),
    { ...disabledProp, description: "Prevents the tooltip showing" },
    hiddenProp,
  ],

  slots: [
    { name: "default", description: "The trigger element" },
    { name: "content", description: "Rich tooltip content, in place of text" },
  ],

  events: [
    { name: "update:visible", payload: "boolean", description: "Visibility changed — what v-model:visible binds to" },
  ],

  tokens: [
    { name: "--cui-tooltip-bg", default: "surface-900 (light) / surface-700 (dark), or the colour role's", description: "Background, and the arrow's. The tooltip teleports to <body>, so set these on :root, or restyle .cui-tooltip — a container's tokens don't reach it. Setting it overrides coloured tooltips too" },
    { name: "--cui-tooltip-color", default: "surface-100, or the colour role's -text", description: "Text colour" },
    { name: "--cui-tooltip-px", default: "0.625rem × density", description: "Horizontal padding" },
    { name: "--cui-tooltip-py", default: "0.375rem × density", description: "Vertical padding" },
    { name: "--cui-tooltip-radius", default: "0.375rem", description: "Corner radius" },
    { name: "--cui-tooltip-font-size", default: "0.8125rem", description: "Text size" },
  ],
};

export default meta;

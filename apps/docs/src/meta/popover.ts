import type { ComponentMeta } from "./types";
import { disabledProp, hiddenProp, roundedProp } from "./shared";

const meta: ComponentMeta = {
  name: "Popover",
  description:
    "A floating panel anchored to a trigger, for content you can interact with — a form, a list, a confirmation. Positioned by Floating UI, with an optional header, footer and arrow.",
  interactive: true,

  props: [
    {
      name: "title",
      type: "string",
      description: "Adds a header bar with this title and, unless closable is false, a close button",
    },
    {
      name: "placement",
      type: "top | bottom | left | right | auto",
      default: "bottom",
      description: "Preferred side. Flips and shifts to stay in the viewport",
    },
    {
      name: "trigger",
      type: "click | hover | focus | hover-focus",
      default: "click",
      description: "What opens the panel",
    },
    { name: "showDelay", type: "number", default: "0", description: "Delay before opening, in ms" },
    {
      name: "hideDelay",
      type: "number",
      default: "100",
      description: "Delay before closing, in ms — the grace period for moving the pointer onto the panel",
    },
    { name: "offset", type: "number", default: "10", description: "Distance from the trigger, in px" },
    { name: "noArrow", type: "boolean", default: "false", description: "Hide the arrow" },
    { name: "width", type: "string", description: "Fixed panel width, e.g. \"320px\". Otherwise 12–24rem by content" },
    { ...roundedProp, default: "lg" },
    { name: "v-model:visible", type: "boolean", description: "Drive the panel yourself instead of by trigger" },
    { ...disabledProp, description: "Prevents the panel opening" },
    {
      name: "closable",
      type: "boolean",
      default: "true",
      description: "Show the close button in the header. No header, no button",
    },
    hiddenProp,
  ],

  slots: [
    { name: "default", description: "The trigger element" },
    { name: "content", description: "Panel body" },
    { name: "header", description: "Replaces the title, keeping the close button beside it" },
    { name: "footer", description: "Panel footer, usually actions" },
  ],

  events: [
    { name: "update:visible", payload: "boolean", description: "Open state changed — what v-model:visible binds to" },
  ],
};

export default meta;

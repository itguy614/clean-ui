import type { ComponentMeta } from "./types";
import { colorProp, disabledProp, hiddenProp } from "./shared";

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
    { name: "v-model:visible", type: "boolean", description: "Drive the tooltip yourself instead of by trigger" },
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
};

export default meta;

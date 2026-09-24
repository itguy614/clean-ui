import type { ComponentMeta } from "./types";
import { colorProp, hiddenProp, liveProp, roleIconProps, roleIconSlot, roundedProp } from "./shared";

const meta: ComponentMeta = {
  name: "Alert",
  description: "An inline message with a role colour, an optional title, actions and attention animations.",
  interactive: true,

  props: [
    colorProp("Color role, which also picks the default icon", "info"),
    { name: "variant", type: "solid | subtle | outline", default: "subtle", description: "Visual style" },
    roundedProp,
    { name: "title", type: "string", description: "Bold title text" },
    ...roleIconProps,
    { name: "dismissible", type: "boolean", default: "false", description: "Show dismiss button" },
    { name: "autoDismiss", type: "number", description: "Auto-dismiss after N milliseconds" },
    {
      name: "entrance",
      type: "fade | slide-down | slide-left | none",
      default: "fade",
      description: "Entrance animation on mount",
    },
    { name: "animation", type: "pulse | glow | shake | none", default: "none", description: "Persistent attention animation" },
    liveProp,
    hiddenProp,
  ],

  slots: [
    { name: "default", description: "Description / body text" },
    roleIconSlot,
    { name: "actions", description: "Action buttons in the footer" },
  ],

  events: [{ name: "dismiss", payload: "—", description: "Fires when the alert is dismissed" }],
};

export default meta;

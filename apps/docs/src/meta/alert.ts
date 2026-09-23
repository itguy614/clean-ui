import type { ComponentMeta } from "./types";
import { hiddenProp, roundedProp } from "./shared";

const meta: ComponentMeta = {
  name: "Alert",
  description: "An inline message with a role colour, an optional title, actions and attention animations.",
  interactive: true,

  props: [
    {
      name: "color",
      type: "primary | secondary | success | error | warning | info | surface | surface-light | surface-dark",
      default: "info",
      description: "Color role, which also picks the default icon",
    },
    { name: "variant", type: "solid | subtle | outline", default: "subtle", description: "Visual style" },
    roundedProp,
    { name: "title", type: "string", description: "Bold title text" },
    {
      name: "icon",
      type: "string",
      description:
        "Replace the role icon. A registered icon name renders that icon; anything else — an emoji, a character — renders as text",
    },
    { name: "noIcon", type: "boolean", default: "false", description: "Hide the role icon entirely" },
    { name: "dismissible", type: "boolean", default: "false", description: "Show dismiss button" },
    { name: "autoDismiss", type: "number", description: "Auto-dismiss after N milliseconds" },
    {
      name: "entrance",
      type: "fade | slide-down | slide-left | none",
      default: "fade",
      description: "Entrance animation on mount",
    },
    { name: "animation", type: "pulse | glow | shake | none", default: "none", description: "Persistent attention animation" },
    {
      name: "live",
      type: "off | polite | assertive",
      default: "from color",
      description:
        "Screen-reader live region. error → assertive (role=alert), else polite (role=status). off to silence",
    },
    hiddenProp,
  ],

  slots: [
    { name: "default", description: "Description / body text" },
    { name: "icon", description: "Replaces the role icon entirely — a spinner, an avatar, anything" },
    { name: "actions", description: "Action buttons in the footer" },
  ],

  events: [{ name: "dismiss", payload: "—", description: "Fires when the alert is dismissed" }],
};

export default meta;

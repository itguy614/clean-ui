import type { ComponentMeta } from "./types";
import { colorProp, hiddenProp, liveProp, roleIconProps, roleIconSlot } from "./shared";

const meta: ComponentMeta = {
  name: "Banner",
  description:
    "A page-level notice, pinned to the top or bottom edge — or set inline to sit inside a card or panel.",
  interactive: true,

  props: [
    colorProp("Color role, which also picks the default icon", "primary"),
    { name: "variant", type: "solid | subtle", default: "subtle", description: "Visual variant" },
    {
      name: "inline",
      type: "boolean",
      default: "false",
      description:
        "Render in the flow rather than pinned to a page edge: no edge rule, a closed box with a radius, and position no longer applies",
    },
    { name: "position", type: "top | bottom", default: "top", description: "Which edge to pin to. Ignored when inline" },
    { name: "dismissible", type: "boolean", default: "true", description: "Show dismiss button" },
    ...roleIconProps,
    { name: "storageKey", type: "string", description: "Persist dismissal to localStorage under this key" },
    liveProp,
    hiddenProp,
  ],

  slots: [
    { name: "default", description: "Banner message content" },
    roleIconSlot,
    { name: "actions", description: "Action buttons, e.g. Learn More / Accept" },
  ],

  events: [{ name: "dismiss", payload: "—", description: "Fires when the banner is dismissed" }],

  tokens: [
    { name: "--cui-banner-bg", default: "per color and variant", description: "Background" },
    { name: "--cui-banner-color", default: "per color and variant", description: "Text and icon color" },
    { name: "--cui-banner-border", default: "1px solid the role's border", description: "Edge rule, or the whole box when inline" },
    { name: "--cui-banner-radius", default: "var(--cui-card-radius)", description: "Corner radius — inline only" },
    { name: "--cui-banner-padding", default: "0.625rem 1rem", description: "Padding (density-scaled)" },
    { name: "--cui-banner-gap", default: "0.75rem", description: "Gap between icon, content and actions" },
    { name: "--cui-banner-font-size", default: "0.875rem", description: "Message font size" },
    { name: "--cui-banner-font-weight", default: "500", description: "Message font weight" },
    { name: "--cui-banner-text-align", default: "center", description: "Message alignment" },
  ],
};

export default meta;

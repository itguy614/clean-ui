import type { ComponentMeta } from "./types";
import { colorProp, hiddenProp, liveProp, roleIconProps, roleIconSlot } from "./shared";

/**
 * Toast is a compound in an unusual way: `CuiToastProvider` takes the placement props,
 * while individual toasts are created through `useToast()` rather than rendered, so their
 * "props" are really the options object. Both get their own sub-heading under Props.
 */
const meta: ComponentMeta = {
  name: "Toast",
  description:
    "Transient notifications raised programmatically through useToast(), stacked by a provider that wraps the app.",
  interactive: true,

  parts: [
    {
      name: "CuiToastProvider",
      props: [
        {
          name: "position",
          type: "top-right | top-left | top-center | bottom-right | bottom-left | bottom-center",
          default: "bottom-center",
          description: "Screen position for toasts",
        },
        { name: "stackMode", type: "expanded | collapsed", default: "expanded", description: "How multiple toasts display" },
        {
          name: "maxToasts",
          type: "number",
          default: "5",
          description: "Maximum visible toasts before the oldest is dismissed",
        },
      ],
    },
    {
      name: "Toast options — useToast()",
      props: [
        { name: "title", type: "string", description: "Title text" },
        { name: "description", type: "string", description: "Description text" },
        colorProp("Color role, which also picks the default icon"),
        { name: "dismissible", type: "boolean", default: "true", description: "Show dismiss button" },
        { name: "autoDismiss", type: "number", default: "5000", description: "Auto-dismiss after N ms (0 to disable)" },
        { name: "showProgress", type: "boolean", default: "true", description: "Show countdown progress bar" },
        { name: "animation", type: "pulse | glow | shake | none", default: "none", description: "Persistent attention animation" },
        ...roleIconProps,
        liveProp,
        hiddenProp,
      ],
      slots: [
        {
          ...roleIconSlot,
          description:
            "Replaces the role icon — only for a rendered <CuiToast>; a programmatic toast uses the icon option",
        },
      ],
    },
  ],

  events: [{ name: "dismiss", payload: "—", description: "Fires when the toast is dismissed" }],
};

export default meta;

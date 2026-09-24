import type { ComponentMeta } from "./types";
import { hiddenProp } from "./shared";

const meta: ComponentMeta = {
  name: "Stack",
  description:
    "A CuiFlex with the common case pre-filled: one axis, no wrapping, an even gap between children. Reach for CuiFlex when you need alignment, distribution or wrapping.",

  props: [
    {
      name: "orientation",
      type: "vertical | horizontal",
      default: "vertical",
      description: "Stack axis. Vertical is the default because it is what page sections want",
    },
    {
      name: "spacing",
      type: "TailwindSpacing",
      default: "4",
      description: "Gap between children, on the Tailwind spacing scale. Responsive object accepted",
    },
    { name: "debug", type: "boolean", default: "false", description: "Outline the stack and its children (passed through to CuiFlex)" },
    hiddenProp,
  ],

  slots: [{ name: "default", description: "Stacked children" }],
};

export default meta;

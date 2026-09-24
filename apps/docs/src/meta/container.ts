import type { ComponentMeta } from "./types";
import { hiddenProp, spacingProp } from "./shared";

const meta: ComponentMeta = {
  name: "Container",
  description:
    "Centres a page's content at a capped width with horizontal padding. The width and the padding both take responsive objects, so one container covers every breakpoint.",

  props: [
    {
      name: "maxWidth",
      type: "sm | md | lg | xl | 2xl | full",
      default: "2xl",
      description:
        "Width cap — sm 640px, md 768px, lg 1024px, xl 1280px, 2xl 1536px, full 100%. Accepts a responsive object, e.g. { sm: 'full', lg: 'xl' }",
    },
    spacingProp("px", "Horizontal padding", "4"),
    spacingProp("py", "Vertical padding. Unset by default, so a container adds no rhythm of its own"),
    {
      name: "centered",
      type: "boolean",
      default: "true",
      description: "Centre the box with auto side margins. Set false to let it sit against the left edge",
    },
    hiddenProp,
  ],

  slots: [{ name: "default", description: "Page content" }],
};

export default meta;

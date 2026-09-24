import type { ComponentMeta } from "./types";
import { hiddenProp } from "./shared";

const meta: ComponentMeta = {
  name: "Spacer",
  description:
    "An empty flex child that either pushes its siblings apart or holds a fixed gap. Use it inside a CuiFlex or CuiStack when the space belongs between two specific items rather than between all of them.",

  props: [
    {
      name: "size",
      type: "TailwindSpacing",
      default: "—",
      description:
        "Fixed size, on the Tailwind spacing scale. Leave it unset and the spacer grows instead, absorbing whatever room is left. Responsive object accepted",
    },
    {
      name: "orientation",
      type: "horizontal | vertical",
      default: "horizontal",
      description: "Which dimension size applies to — horizontal sets width, vertical sets height",
    },
    hiddenProp,
  ],
};

export default meta;

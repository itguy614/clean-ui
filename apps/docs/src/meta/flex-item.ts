import type { ComponentMeta } from "./types";
import { hiddenProp } from "./shared";

const meta: ComponentMeta = {
  name: "Flex Item",
  description:
    "An optional wrapper that sets flex-grow, flex-shrink or the flex shorthand on one child of a CuiFlex. Children of a flex container need it only when they have to grow or hold their size.",

  props: [
    {
      name: "flex",
      type: "1 | auto | initial | none",
      default: "—",
      description: "The flex shorthand. When set it wins outright — grow and shrink are ignored",
    },
    { name: "grow", type: "0 | 1", default: "—", description: "flex-grow. Ignored if flex is set" },
    { name: "shrink", type: "0 | 1", default: "—", description: "flex-shrink. Ignored if flex is set" },
    hiddenProp,
  ],

  slots: [{ name: "default", description: "The item's content" }],
};

export default meta;

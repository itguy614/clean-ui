import type { ComponentMeta } from "./types";
import { colorProp, hiddenProp } from "./shared";

const meta: ComponentMeta = {
  name: "Spinner",
  description:
    "Standalone loading indicator with three visual variants. Use for async operations, page loads, or content placeholders.",

  props: [
    { name: "size", type: "xs | sm | md | lg | xl", default: "md", description: "Size" },
    colorProp("Color role"),
    { name: "variant", type: "ring | dots | bars", default: "ring", description: "Visual variant" },
    {
      name: "label",
      type: "string",
      default: "Loading",
      description: "Accessible label. Always announced, whether or not showLabel renders it visibly",
    },
    { name: "showLabel", type: "boolean", default: "false", description: "Render the label as visible text below the spinner" },
    hiddenProp,
  ],
};

export default meta;

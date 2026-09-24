import type { ComponentMeta } from "./types";
import { colorProp, hiddenProp } from "./shared";

const meta: ComponentMeta = {
  name: "Copy Button",
  description:
    "A button that copies text to the clipboard with visual feedback. Use standalone, inside inputs, or next to code blocks. The useCopyToClipboard composable behind it is exported for custom UIs.",
  interactive: true,

  props: [
    { name: "value", type: "string", default: "required", description: "Text to copy" },
    {
      name: "size",
      type: "xs | sm | md | lg | xl",
      default: "sm",
      description: "Size. Only xs, sm and md differ — larger values clamp to md",
    },
    colorProp("Color role for the resting state. The copied state is always success", "primary"),
    { name: "variant", type: "ghost | outline", default: "ghost", description: "Button variant" },
    {
      name: "tooltip",
      type: "string",
      default: "Copy",
      description:
        "Tooltip before copying. Also names the button for screen readers when showLabel is false",
    },
    { name: "copiedTooltip", type: "string", default: "Copied!", description: "Tooltip after copying, and the text announced in the live region" },
    { name: "resetDelay", type: "number", default: "2000", description: "Time in ms before the copied state resets" },
    {
      name: "showLabel",
      type: "boolean",
      default: "false",
      description: "Show a text label beside the icon. The label then names the button instead of tooltip",
    },
    hiddenProp,
  ],
};

export default meta;

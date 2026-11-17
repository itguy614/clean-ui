import type { ComponentMeta } from "./types";
import { hiddenProp } from "./shared";

const meta: ComponentMeta = {
  name: "Status Dot",
  description: "A small colored dot for a status — online, warning, offline — beside text that says the same thing.",

  props: [
    {
      name: "tone",
      type: "success | info | warning | error | neutral",
      default: "neutral",
      description: "Status, mapped to a color role (neutral uses surface-dark)",
    },
    {
      name: "label",
      type: "string",
      description: "Accessible name, for a dot that stands alone. Without one the dot is aria-hidden",
    },
    hiddenProp,
  ],

  tokens: [{ name: "--cui-status-dot-bg", default: "var(--cui-<tone role>)", description: "Dot color" }],
};

export default meta;

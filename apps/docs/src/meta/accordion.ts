import type { ComponentMeta } from "./types";
import { disabledProp, hiddenProp } from "./shared";

const meta: ComponentMeta = {
  name: "Accordion",
  description:
    "Collapsible sections, one or several open at a time. Each item is a real button-and-region pair, with arrow-key navigation between the headers.",
  interactive: true,

  parts: [
    {
      name: "CuiAccordion",
      props: [
        {
          name: "v-model",
          type: "string[]",
          default: "[]",
          description: "The values of the open items. Still works uncontrolled — bind it only if you need to read or set which are open",
        },
        {
          name: "multiple",
          type: "boolean",
          default: "false",
          description: "Allow several items open at once. Off, opening one closes the others",
        },
        {
          name: "noAnimation",
          type: "boolean",
          default: "false",
          description: "Toggle instantly instead of animating the panel height — worth it for tall or nested content",
        },
        hiddenProp,
      ],
      slots: [{ name: "default", description: "CuiAccordionItem elements" }],
      events: [
        {
          name: "update:modelValue",
          payload: "string[]",
          description: "The values of the open items, after the change",
        },
      ],
    },
    {
      name: "CuiAccordionItem",
      props: [
        {
          name: "value",
          type: "string",
          default: "— (required)",
          description: "Identifies the item in v-model. Also forms the trigger's and panel's DOM ids, so it must be unique across the page",
        },
        { name: "label", type: "string", description: "Header text. Use the #header slot instead for anything richer" },
        {
          name: "defaultOpen",
          type: "boolean",
          default: "false",
          description: "Open on mount, without animating. Applied once, on mount — it does not track later changes",
        },
        { ...disabledProp, description: "Cannot be toggled, and is skipped by arrow-key navigation" },
        hiddenProp,
      ],
      slots: [
        { name: "default", description: "Panel content" },
        { name: "header", description: "Replaces label — an icon, a badge, a two-line header" },
      ],
    },
  ],
};

export default meta;

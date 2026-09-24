import type { ComponentMeta } from "./types";
import { hiddenProp } from "./shared";

const meta: ComponentMeta = {
  name: "Button Group",
  description:
    "Joins multiple buttons into a single visual unit with merged borders and shared radius. Works with dropdowns for split-button patterns.",
  interactive: true,

  props: [
    {
      name: "orientation",
      type: "horizontal | vertical",
      default: "horizontal",
      description: "Layout direction. Vertical merges the top and bottom edges instead of the left and right",
    },
    {
      name: "label",
      type: "string",
      description:
        "Accessible group name. Use when there is no visible element to point aria-labelledby at — a toolbar of icon buttons is the common case",
    },
    {
      name: "aria-labelledby",
      type: "string",
      description:
        "id(s) of the element naming this group. A label's for attribute cannot point at a group, so this is the only way to reuse visible text as the name. Takes precedence over label",
    },
    { name: "aria-describedby", type: "string", description: "id(s) of describing text" },
    { name: "id", type: "string", description: "id of the group container" },
    hiddenProp,
  ],

  slots: [
    {
      name: "default",
      description:
        "The buttons. CuiButton, CuiDropdown and CuiRadio's buttons variant are all recognised as members — anything else keeps its own corners",
    },
  ],
};

export default meta;

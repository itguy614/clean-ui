import type { ComponentMeta } from "./types";
import { hiddenProp } from "./shared";

const meta: ComponentMeta = {
  name: "Stepper",
  description:
    "Progress indicator for a multi-step flow — numbered circles joined by connectors, horizontal or vertical, with optional descriptions, icons and error states.",
  interactive: true,

  props: [
    {
      name: "steps",
      type: "StepDef[]",
      description: "The steps, in order: { label, description?, icon?, error? }",
    },
    { name: "modelValue", type: "number", default: "0", description: "Active step, 0-based (v-model)" },
    { name: "orientation", type: "horizontal | vertical", default: "horizontal", description: "Layout direction" },
    {
      name: "size",
      type: "xs | sm | md | lg | xl",
      default: "md",
      description: "Circle, label and connector scale. Only sm, md and lg are styled — anything else clamps",
    },
    {
      name: "clickable",
      type: "boolean",
      default: "true",
      description: "Let a pointer click on a step move to it. See the accessibility note — clicks are mouse-only",
    },
    {
      name: "linear",
      type: "boolean",
      default: "true",
      description: "Only completed steps are selectable — no skipping ahead. Set false to allow any step",
    },
    hiddenProp,
  ],

  events: [{ name: "update:modelValue", payload: "number", description: "A step was clicked (v-model)" }],
};

export default meta;

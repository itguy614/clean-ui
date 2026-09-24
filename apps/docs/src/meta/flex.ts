import type { ComponentMeta } from "./types";
import { hiddenProp } from "./shared";

const meta: ComponentMeta = {
  name: "Flex",
  description:
    "A flexbox container for one-dimensional layouts. Every prop takes either a plain value or a responsive object keyed by breakpoint.",

  props: [
    {
      name: "direction",
      type: "row | row-reverse | col | col-reverse",
      default: "row",
      description: "Main axis. This is the one layout component that says direction rather than orientation — the values are CSS's",
    },
    {
      name: "wrap",
      type: "wrap | wrap-reverse | nowrap",
      default: "wrap",
      description: "Wrap behaviour. Note the default wraps — pass nowrap for a strip that must stay on one line",
    },
    {
      name: "align",
      type: "start | center | end | stretch | baseline",
      default: "—",
      description: "Cross-axis alignment (align-items)",
    },
    {
      name: "justify",
      type: "start | center | end | between | around | evenly",
      default: "—",
      description: "Main-axis distribution (justify-content)",
    },
    {
      name: "gap",
      type: "TailwindSpacing",
      default: "—",
      description: "Gap on both axes, on the Tailwind spacing scale",
    },
    {
      name: "rowGap",
      type: "TailwindSpacing",
      default: "—",
      description: "Row gap. Setting either rowGap or colGap replaces gap entirely rather than overriding one axis of it",
    },
    { name: "colGap", type: "TailwindSpacing", default: "—", description: "Column gap. Same caveat as rowGap" },
    {
      name: "debug",
      type: "boolean",
      default: "false",
      description: "Outline the container and its children, and label the nesting depth",
    },
    hiddenProp,
  ],

  slots: [{ name: "default", description: "Flex items" }],
};

export default meta;

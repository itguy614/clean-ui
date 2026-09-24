import type { ComponentMeta } from "./types";
import { colorProp, hiddenProp } from "./shared";

const meta: ComponentMeta = {
  name: "Pagination",
  description:
    "Page navigation with numbered buttons, a per-page selector and a result count. Accepts Laravel's paginator meta object directly.",
  interactive: true,

  props: [
    {
      name: "meta",
      type: "LaravelPaginatorMeta",
      description:
        "Laravel paginator object — current_page, last_page, per_page, total, from, to. Individual props override it",
    },
    { name: "currentPage", type: "number", default: "1", description: "Current page (override, or standalone use)" },
    { name: "totalPages", type: "number", default: "1", description: "Total pages (override, or standalone use)" },
    { name: "perPage", type: "number", default: "15", description: "Items per page (override, or standalone use)" },
    { name: "total", type: "number", default: "0", description: "Total item count, used by the summary text" },
    {
      name: "perPageOptions",
      type: "number[]",
      default: "[10, 15, 25, 50, 100]",
      description: "Choices in the per-page selector",
    },
    { name: "hidePerPage", type: "boolean", default: "false", description: "Hide the per-page selector" },
    {
      name: "hideInfo",
      type: "boolean",
      default: "false",
      description: 'Hide the "Showing X to Y of Z results" summary',
    },
    colorProp("Color of the current-page button (tinted background, colored text)"),
    {
      name: "size",
      type: "xs | sm | md | lg | xl",
      default: "md",
      description: "Control size. Only sm and md are styled — anything else clamps into that range",
    },
    {
      name: "maxButtons",
      type: "number",
      default: "5",
      description: "How many page buttons to show before collapsing the middle into an ellipsis",
    },
    hiddenProp,
  ],

  events: [
    {
      name: "update:currentPage",
      payload: "number",
      description: "A page button, or prev/next, was activated (v-model:currentPage)",
    },
    {
      name: "update:perPage",
      payload: "number",
      description: "The per-page selector changed. update:currentPage fires alongside it with 1",
    },
  ],
};

export default meta;

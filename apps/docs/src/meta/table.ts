import type { ComponentMeta } from "./types";
import { hiddenProp } from "./shared";

const sectionSlot = { name: "default", description: "CuiTableRow elements" };

const meta: ComponentMeta = {
  name: "Table",
  description:
    "Styled table primitives — a real <table> underneath, assembled from head, body, foot, row and cell sub-components.",
  interactive: true,

  tokens: [
    {
      name: "--cui-table-head-bg",
      default: "surface-50 (light) / surface-800 (dark)",
      description:
        "Header row background. A token rather than a scale step so it still resolves under a sticky header and inside CuiDataGrid",
    },
  ],

  parts: [
    {
      name: "CuiTable",
      props: [
        {
          name: "size",
          type: "xs | sm | md | lg | xl",
          default: "md",
          description: "Cell padding and font scale. Only sm, md and lg are styled",
        },
        { name: "striped", type: "boolean", default: "false", description: "Alternate the row backgrounds" },
        { name: "hoverable", type: "boolean", default: "false", description: "Tint the row under the pointer" },
        { name: "bordered", type: "boolean", default: "false", description: "Borders between all cells, not just rows" },
        {
          name: "stickyHeader",
          type: "boolean",
          default: "false",
          description: "Pin the header cells while the body scrolls. Needs maxHeight if the table also scrolls sideways — it warns in dev if you forget",
        },
        {
          name: "fixedLayout",
          type: "boolean",
          default: "false",
          description: "table-layout: fixed — column widths come from the first row (or width) instead of the content",
        },
        {
          name: "maxHeight",
          type: "string",
          default: "—",
          description: "Any CSS length. Past it the table scrolls vertically inside its own container",
        },
        {
          name: "minWidth",
          type: "string",
          default: "—",
          description: "Floor on the table's width, so narrow columns stay readable and the container scrolls sideways instead",
        },
        {
          name: "ariaRowcount",
          type: "number",
          default: "—",
          description: "Total row count for a windowed table, as aria-rowcount. Omit unless you render a subset — native semantics are already correct",
        },
        hiddenProp,
      ],
      slots: [{ name: "default", description: "CuiTableHead, CuiTableBody and CuiTableFoot" }],
    },
    { name: "CuiTableHead", props: [hiddenProp], slots: [sectionSlot] },
    { name: "CuiTableBody", props: [hiddenProp], slots: [sectionSlot] },
    { name: "CuiTableFoot", props: [hiddenProp], slots: [sectionSlot] },
    {
      name: "CuiTableRow",
      props: [
        { name: "selected", type: "boolean", default: "false", description: "Tint the row to mark it selected" },
        hiddenProp,
      ],
      slots: [{ name: "default", description: "CuiTableCell elements" }],
    },
    {
      name: "CuiTableCell",
      props: [
        {
          name: "header",
          type: "boolean",
          default: "—",
          description: "Force a <th> or a <td>. Unset, the cell takes it from its section — <th> inside CuiTableHead, <td> elsewhere",
        },
        { name: "align", type: "left | center | right", default: "left", description: "Text alignment. Right-align numbers" },
        { name: "width", type: "string", default: "—", description: "CSS width for the column" },
        { name: "colspan", type: "number", default: "—", description: "Native colspan" },
        { name: "rowspan", type: "number", default: "—", description: "Native rowspan" },
        { name: "nowrap", type: "boolean", default: "false", description: "Keep the cell on one line" },
        hiddenProp,
      ],
      slots: [{ name: "default", description: "Cell content" }],
    },
  ],
};

export default meta;

import type { ComponentMeta } from "./types";
import { hiddenProp } from "./shared";

const meta: ComponentMeta = {
  name: "Tree View",
  description:
    "Nested, expandable data — a file explorer, an org chart, a navigation menu. A single tab stop with roving focus, per the ARIA tree pattern.",
  interactive: true,

  props: [
    { name: "nodes", type: "TreeNode[]", default: "— (required)", description: "The tree data. Each node needs id and label; children, icon and disabled are optional" },
    {
      name: "v-model",
      type: "string | number | (string | number)[] | null",
      default: "null",
      description: "Selected node id, or ids when multiple is set. Clicking a selected node in single mode clears the selection",
    },
    { name: "multiple", type: "boolean", default: "false", description: "Selecting a node toggles it, and the model becomes an array" },
    {
      name: "v-model:expanded",
      type: "(string | number)[]",
      default: "—",
      description: "Expanded node ids. Pass it and expansion is controlled — the tree renders exactly these and emits every change; omit it and it manages its own",
    },
    {
      name: "defaultExpanded",
      type: "(string | number)[]",
      default: "—",
      description: "Ids expanded on mount. Read once, and ignored when v-model:expanded is passed",
    },
    {
      name: "expandAll",
      type: "boolean",
      default: "false",
      description: "Start with every parent expanded. Read once, and ignored when v-model:expanded is passed",
    },
    { name: "showLines", type: "boolean", default: "true", description: "Draw the connecting lines between a parent and its children" },
    {
      name: "selectable",
      type: "boolean",
      default: "true",
      description: "Clicking a row selects it. Set false for an expand-only tree: a parent row toggles instead, and aria-selected is dropped",
    },
    { name: "animated", type: "boolean", default: "true", description: "Animate the height of a branch as it opens and closes" },
    { name: "size", type: "sm | md | lg", default: "md", description: "Row height, font size and indent per level. Not the shared CuiSize scale" },
    hiddenProp,
  ],

  slots: [
    {
      name: "node",
      payload: "{ node, selected, expanded, depth }",
      description: "Replaces a node's label — a badge, a count, a second line. The chevron, icon and row stay as they are",
    },
  ],

  events: [
    { name: "update:modelValue", payload: "string | number | (string | number)[] | null", description: "Selection changed" },
    { name: "update:expanded", payload: "(string | number)[]", description: "Expansion changed — including bulk changes from expandAll() and collapseAll()" },
    { name: "node-click", payload: "TreeNode", description: "A selectable, non-disabled node was activated, by click or by Enter/Space" },
    {
      name: "node-expand",
      payload: "TreeNode, boolean",
      description: "One node was expanded or collapsed, however it was caused. Bulk changes report once through update:expanded instead",
    },
  ],
};

export default meta;

import type { ComponentMeta } from "./types";
import { hiddenProp } from "./shared";

const meta: ComponentMeta = {
  name: "Data Grid",
  description:
    "A table with sorting, search, per-column filters, pagination, row selection, column management, card view and saved views — client-side over an array, or server-side over a paginated response.",
  interactive: true,

  props: [
    { name: "columns", type: "DataGridColumn[]", default: "— (required)", description: "Column definitions: key, label, and the per-column sortable / filterable / align / width / sticky flags" },
    {
      name: "data",
      type: "T[] | PaginatedData<T>",
      default: "— (required)",
      description: "An array for client-side mode, or a paginated response for server-side. The grid is generic over T, so cell slots and row emits are typed",
    },
    {
      name: "serverSide",
      type: "boolean",
      default: "false",
      description: "Do none of the work locally: every sort, filter, search and page change emits navigate for you to answer with new data",
    },
    { name: "rowKey", type: "string", default: "id", description: "Which field identifies a row — what selection and :key are keyed on" },
    { name: "bulkActions", type: "DataGridBulkAction[]", default: "—", description: "Actions offered for the selected rows. Passing any of them turns on the selection column" },
    { name: "showSelectAll", type: "boolean", default: "true", description: "Show the select-all checkbox in the header" },
    { name: "stickyHeader", type: "boolean", default: "true", description: "Pin the header row while the body scrolls" },
    { name: "maxHeight", type: "string", default: "—", description: "Height at which the table starts scrolling. Required by virtualize — it is the viewport to window against" },
    { name: "striped", type: "boolean", default: "false", description: "Alternate the row backgrounds" },
    { name: "hoverable", type: "boolean", default: "true", description: "Tint the row under the pointer" },
    { name: "bordered", type: "boolean", default: "false", description: "Borders between all cells" },
    { name: "size", type: "sm | md | lg", default: "md", description: "Table density. Not the shared CuiSize scale" },
    { name: "loading", type: "boolean", default: "false", description: "Replace the rows with skeletons" },
    {
      name: "virtualize",
      type: "boolean",
      default: "false",
      description: "Render only the visible rows plus overscan. Needs maxHeight; worth it from roughly 500 client-side rows",
    },
    { name: "virtualRowHeight", type: "number", default: "auto", description: "Fixed row height in px for the virtualizer. Omit and the first rendered row is measured" },
    { name: "perPageOptions", type: "number[]", default: "[15, 25, 50, 100]", description: "Options in the per-page selector. The first is the initial page size" },
    { name: "hideToolbar", type: "boolean", default: "false", description: "Hide the whole toolbar row" },
    { name: "hidePagination", type: "boolean", default: "false", description: "Hide the pagination bar" },
    { name: "hideSearch", type: "boolean", default: "false", description: "Hide the search field" },
    { name: "hideColumnManager", type: "boolean", default: "false", description: "Hide the show/hide-columns menu" },
    { name: "hideFilterPanel", type: "boolean", default: "false", description: "Hide the filter-panel toggle" },
    { name: "filterPanelSide", type: "left | right", default: "right", description: "Which side the filter panel slides in from" },
    { name: "gridId", type: "string", default: "—", description: "Identifier under which saved views are persisted. Setting it turns the view manager on" },
    { name: "viewAdapter", type: "DataGridViewAdapter", default: "localStorage", description: "Where saved views are read and written — swap it to persist them server-side" },
    { name: "initialView", type: "DataGridViewConfig", default: "—", description: "Sort, filters, search and visible columns to start from" },
    { name: "hydrateUrl", type: "boolean", default: "false", description: "Read the initial state out of the URL query string, so a grid's state is linkable" },
    hiddenProp,
  ],

  slots: [
    { name: "toolbar-start", description: "Content at the leading end of the toolbar, before the search field" },
    { name: "toolbar-end", description: "Content at the trailing end of the toolbar, after the column and filter controls" },
    { name: "empty", description: "Replaces the built-in empty state shown when nothing matches" },
    { name: "card", payload: "{ row }", description: "One card in card view. Providing it is what makes the card/table toggle appear" },
    {
      name: "cell-{columnKey}",
      payload: "{ value, row }",
      description: "Renders one column's cells — a badge, a link, a formatted number. One slot per column key, typed over the row type",
    },
  ],

  events: [
    {
      name: "navigate",
      payload: "DataGridQueryParams",
      description: "Server-side mode only: sort, filters, search, page or page size changed. Answer it with fresh data",
    },
    { name: "row-click", payload: "{ row }", description: "A row was clicked" },
    { name: "row-action", payload: "{ action, row }", description: "A row's action was chosen from its context menu" },
    { name: "bulk-action", payload: "{ action, rows }", description: "A bulk action was run over the selected rows" },
    { name: "selection-change", payload: "string[]", description: "The set of selected row ids changed" },
  ],
};

export default meta;

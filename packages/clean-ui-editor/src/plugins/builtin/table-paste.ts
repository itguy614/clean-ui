import { definePlugin } from "../define-plugin";

/**
 * Paste-only: converts an HTML `<table>` to GFM table markdown. No command,
 * toolbar entry or keymap — tables ship as a complete, editable feature in
 * a later phase (no insert action, no cell navigation yet), but *pasting*
 * an already-rendered table is a plain conversion this phase's paste
 * pipeline can already do correctly. `td`/`th`/`tr` all share the "Table"
 * construct id — a consumer excluding tables removes the whole unit at
 * once rather than leaving stray pipe characters behind.
 */
export const tablePastePlugin = definePlugin({
  id: "cui-table-paste",
  commands: {},
  constructs: ["Table"],
  paste: [
    {
      selector: "th, td",
      produces: "Table",
      degradeTo: "plainText",
      toMarkdown: (_el, c) => `| ${c.trim().replace(/\|/g, "\\|")} `,
    },
    {
      selector: "tr",
      produces: "Table",
      degradeTo: "plainText",
      toMarkdown: (el, c) => {
        const row = `${c}|\n`;
        const table = el.closest("table");
        // Header row is either inside a <thead>, or — if the table has no
        // <thead> at all — the table's own FIRST row overall. Checking
        // "first tr within el's own parent" instead would wrongly match a
        // <tbody> with only one row too, since that row is trivially the
        // first (and only) `tr` its own container contains.
        const isHeaderRow = table && (table.querySelector("thead") ? Boolean(el.closest("thead")) : table.querySelector("tr") === el);
        if (!isHeaderRow) return row;
        const cellCount = el.querySelectorAll("th, td").length;
        const separator = `${"| --- ".repeat(cellCount)}|\n`;
        return row + separator;
      },
    },
    {
      selector: "table",
      produces: "Table",
      degradeTo: "plainText",
      toMarkdown: (_el, c) => c,
    },
  ],
});

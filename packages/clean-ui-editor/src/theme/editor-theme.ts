import { EditorView } from "@codemirror/view";

/**
 * CodeMirror's own base theme hardcodes the caret black (`.cm-cursor,
 * .cm-dropCursor { borderLeft: "1.2px solid black" }`) and only swaps in a
 * lighter, still-fixed `#ddd` via a `&dark`-scoped selector — a syntax
 * private to `EditorView.baseTheme()` (it resolves `&dark`/`&light` against
 * an internal class pair) that a consumer's own `EditorView.theme()` call
 * cannot target directly; using it here throws `RangeError: Unsupported
 * selector`. Every extension built by `EditorView.theme()` instead gets its
 * OWN unique marker class applied to the same `.cm-editor` root, so a plain
 * `&`-prefixed (or bare) selector here compiles to the same class-count —
 * and therefore the same CSS specificity — as the base theme's scoped
 * selectors it needs to beat; later stylesheet insertion (this extension is
 * layered on top of the view's fixed defaults) settles the tie. One value
 * covers both modes because the `--cui-*` var itself already flips under an
 * ancestor `.dark` class — see docs/plans/markdown-editor-phase-1 phase-02
 * task 2.2.2.
 */
function chromeThemeSpec() {
  return {
    ".cm-cursor, .cm-dropCursor": { borderLeftColor: "var(--cui-primary)" },
    ".cm-selectionBackground": { backgroundColor: "var(--cui-primary-bg)" },
    "&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground": {
      backgroundColor: "var(--cui-primary-bg)",
    },
    "&.cm-focused": { outline: "none" },
    ...slashMenuSpec(),
  };
}

/**
 * Slash-menu palette (`@codemirror/autocomplete`'s own tooltip) — matched to
 * `CuiDropdownMenu`/`CuiDropdownItem`'s look so it reads as a clean-ui control
 * rather than CodeMirror's generic, monospace, hardcoded-blue default.
 *
 * Part of the per-instance theme, so it reaches this view's tooltips and no other
 * CodeMirror on the page (#227) — unlike a global stylesheet rule, which restyled
 * every one. The tooltip also carries `cui-markdown-editor-slash-menu` (see
 * `plugins/slash-menu.ts`), a stable hook for consumers.
 */
function slashMenuSpec() {
  const tip = ".cm-tooltip.cm-tooltip-autocomplete";
  return {
    [tip]: {
      border: "1px solid var(--cui-border)",
      borderRadius: "var(--cui-radius-md, 0.375rem)",
      background: "var(--cui-surface-base)",
      boxShadow: "var(--cui-shadow-md, 0 4px 16px rgb(0 0 0 / 0.1))", // fallback: a clean-ui before 1.4
      overflow: "hidden",
    },
    [`${tip} > ul`]: { fontFamily: "var(--cui-font-sans)", padding: "0.25rem" },
    [`${tip} > ul > li`]: {
      padding: "0.5rem 0.625rem",
      borderRadius: "0.25rem",
      fontSize: "0.8125rem",
      color: "var(--cui-text-body)",
    },
    // The active option: CuiDropdownItem's hover/focus treatment, not the default's solid blue.
    [`${tip} > ul > li[aria-selected]`]: { background: "var(--cui-surface-bg)", color: "var(--cui-text-body)" },
    // Every command shares one generic "keyword" type, so the default would repeat the same key icon on every row.
    [`${tip} .cm-completionIcon`]: { display: "none" },
    [`${tip} .cm-completionMatchedText`]: { textDecoration: "none", fontWeight: "600", color: "var(--cui-primary)" },
  };
}

/**
 * `dark` must reflect clean-ui's actual runtime colour-scheme signal (see
 * `useColorScheme` in `@itguy614/clean-ui`), not a static guess — it's what
 * flips CodeMirror's internal `.cm-light`/`.cm-dark` class, which every
 * `&light`/`&dark`-scoped selector above (and any future plugin relying on
 * the same convention) keys off.
 */
export function editorThemeExtension(dark: boolean) {
  return EditorView.theme(chromeThemeSpec(), { dark });
}

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

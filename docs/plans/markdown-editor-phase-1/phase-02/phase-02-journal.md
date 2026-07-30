# Phase 02 Journal: Reveal Layer and Theming

Progress, decisions and notes logged as tasks are addressed. Entries are appended by whoever works
a task — the tasks file tracks status, this file records why things happened.

## Log

### 2026-07-29 - Tasks 2.1.1/2.1.2/2.1.3: Reveal layer (decoration, granularity, composition guard)
**Agent:** frontend work (self, not delegated)  **Status:** Completed

**Work Done:**
- Added `src/reveal/constructs.ts` — `SUPPORTED_CONSTRUCT_NODES` (Emphasis, StrongEmphasis,
  InlineCode, Strikethrough, Link, ATXHeading1-6) and `isMarkerNodeName()` (`endsWith("Mark")`).
  Verified marker node names empirically by parsing a sample document directly with
  `@lezer/markdown` rather than guessing: `HeaderMark`, `EmphasisMark` (shared by Emphasis and
  StrongEmphasis), `StrikethroughMark`, `CodeMark`, `LinkMark`. `URL` is deliberately not a marker
  and stays visible even when its surrounding `Link` construct is collapsed.
- Added `src/reveal/granularity.ts` — a `StateField<RevealGranularity>` plus
  `inputTypeGranularityExtension()`, a `domEventObservers` pointerdown listener that switches to
  `"line"` on `pointerType === "touch"` and back to `"construct"` on anything else (mouse or pen —
  a stylus is precise enough for construct-level targeting).
- Added `src/reveal/reveal-plugin.ts` — the `ViewPlugin` walking `syntaxTree` over
  `view.visibleRanges` (bounding the work to what's rendered, not the whole document) and applying
  `Decoration.mark({class: "cui-md-marker-hidden"})` to marker children of a construct the
  selection isn't inside (or, at line granularity, isn't on the same line as). Recomputes on
  `docChanged`, `viewportChanged`, `selectionSet`, and explicitly on a granularity-only change
  (checked via `tr.effects.some(e => e.is(setGranularityEffect))`) — a granularity switch alone
  sets none of `ViewUpdate`'s own flags, exactly the bug the plan's prototype spike caught. Guarded
  with `if (update.view.compositionStarted) return` so no decoration recompute happens mid-IME-
  composition.
- Added `.cui-md-marker-hidden { font-size: 0; line-height: 0 }` to `src/styles/editor.css` — zero-
  size styling, not `Decoration.replace()`, so marker characters stay real DOM text (FR9).

**Decisions Made:**
- Combined all three tasks (2.1.1–2.1.3) into one implementation pass — they share the same
  `ViewPlugin` and are too tightly coupled to build or verify independently (the composition guard
  and granularity-change handling both live in the same `update()` method as the core reveal logic).
- Used `view.compositionStarted` (true from the *start* of composition through cleanup) rather than
  `view.composing` (only true while actively composing) per the task's literal "between composition
  start and end" wording — the broader guard.

**Verification:**
- jsdom unit tests (`src/reveal/__tests__/reveal-plugin.test.ts`, 8 tests): hide-on-away/reveal-on-
  entry, marker text never removed from the DOM, no hiding in source mode, granularity-only change
  recomputes, construct vs. line granularity scope, a REAL `pointerdown` event (not a direct
  `setGranularityEffect` dispatch) switching granularity both directions, a 10,000-line document
  perf smoke test (well under 500ms for two selection dispatches — decoration work is viewport-
  bounded, not document-bounded), and composition start/end suspending recompute.
- **Real-browser verification** (temporary `.dev-harness/`, Playwright + Chromium, deleted after
  use — same pattern as Phase 01): mounted `CuiMarkdownEditor` with a document covering all six
  supported constructs plus a heading. Confirmed via Chrome DevTools Protocol
  `Accessibility.getFullAXTree` (Playwright's own `page.accessibility` API was removed in the
  installed Playwright version, and `locator.ariaSnapshot()` collapses an editable `textbox` role to
  a single leaf node with no descendant text — neither can answer the FR9 question directly) that
  **every marker character** (`**`, `*`, `` ` ``, `~~`, `#`, `[`, `]`, `(`, `)`) is present as a
  `StaticText` accessibility node regardless of caret position, alongside every construct's plain-
  text content. Also confirmed every hidden marker element renders at exactly 0px width, caret entry
  into `**bold**` un-hides its markers, and a real `pointerType: "touch"` `pointerdown` switches to
  line granularity (revealing `*italic*`'s markers even with the caret elsewhere on the same line).
  Zero console/page errors throughout.

### 2026-07-29 - Tasks 2.2.1/2.2.2: Theming (editor chrome, syntax highlighting, dark mode)
**Agent:** frontend work (self, not delegated)  **Status:** Completed

**Work Done:**
- Added `src/theme/syntax-highlight.ts` — a `HighlightStyle` mapping `@lezer/highlight` tags to
  `--cui-*` tokens. No new tag-to-node mapping was needed: `cuiMarkdownLanguage` (Phase 01) builds
  directly on `@lezer/markdown`'s base `parser` + `GFM`, and both already carry a `styleTags`
  mapping baked into their node sets at module load (confirmed by reading the compiled package
  source directly) — e.g. `HeaderMark`/`EmphasisMark`/`CodeMark`/`LinkMark` all tag as
  `tags.processingInstruction`, `StrongEmphasis` as `tags.strong`, GFM's `Strikethrough` as
  `tags.strikethrough`. This file only supplies colours per tag.
- Added `src/theme/editor-theme.ts` — `editorThemeExtension(dark: boolean)`, an `EditorView.theme()`
  overriding `.cm-cursor`/`.cm-dropCursor` and `.cm-selectionBackground` (plain + focused variant)
  with `var(--cui-primary)` / `var(--cui-primary-bg)`.
- Added `drawSelection()` (from `@codemirror/view`) to `createView()`'s extensions — without it,
  CodeMirror relies on the native browser caret/`::selection`, which has no `.cm-cursor`/
  `.cm-selectionBackground` DOM layer to theme at all. The feature spec's own wording ("the caret
  and selection layers stay light") names CodeMirror's drawn layers specifically, confirming this
  extension was always intended to be part of the base setup.
- Wired a `themeCompartment` into `CuiMarkdownEditor.vue`, initialised from `useColorScheme(rootRef)`
  (from `@itguy614/clean-ui`) and reconfigured on every `isDark` change via `view.dispatch({effects:
  themeCompartment.reconfigure(...)})`.
- Density: `.cm-content`'s padding now reads `calc(0.5rem * var(--cui-density-scale, 1))` /
  `calc(0.75rem * var(--cui-density-scale, 1))` — plain CSS, no JS wiring needed, since
  `--cui-density-scale` already cascades from clean-ui's `useDensity()`-applied ancestor class.

**Decisions Made:**
- **`&light`/`&dark` selector syntax cannot be used in a consumer's own `EditorView.theme()` call.**
  First attempt used them (matching what the base theme's *own* internal construction uses) and hit
  `RangeError: Unsupported selector: &light` at runtime — caught by the existing jsdom test suite,
  not assumed away. Reading `@codemirror/view`'s compiled source: `buildTheme(main, spec, scopes)`
  only resolves `&light`/`&dark` when a `scopes` map is passed, and only `EditorView.baseTheme()`
  passes one (`{"&light": "."+baseLightID, "&dark": "."+baseDarkID}`) — a consumer's `EditorView
  .theme()` call has no way to reach those internal, randomly-named classes. Fix: a plain, unscoped
  override (`.cm-cursor, .cm-dropCursor`, `.cm-selectionBackground`) — every `EditorView.theme()`
  extension gets its own unique marker class prepended to selectors the same way the base theme's
  scoped selectors do, so a plain selector here compiles to the same class-count (and therefore the
  same CSS specificity) as what it needs to beat; later stylesheet insertion (this extension layers
  on top of the view's built-in defaults) settles the tie. One CSS var value covers both light and
  dark because the var itself already flips under an ancestor `.dark` class — the reactive `dark`
  flag on `editorThemeExtension` still matters for the `EditorView.darkTheme` facet other CodeMirror
  internals (and future plugins) may read, not for these two colours specifically.
- Reused existing clean-ui semantic tokens throughout (`--cui-primary`, `--cui-text-emphasis`,
  `--cui-text-tertiary`, `--cui-text-link`, `--cui-text-code`, `--cui-text-secondary`) rather than
  introducing new ones — all are already covered by `scripts/check-contrast.mjs`'s audit, so no
  audit-script change was needed to claim contrast coverage.

**Verification:**
- jsdom unit tests (`src/theme/__tests__/theme.test.ts`, 4 tests): `editorThemeExtension` builds for
  both `dark` values without throwing, every `HighlightStyle` colour is a `var(--cui-*)` reference
  (no literal), `drawSelection()`'s `.cm-cursorLayer`/`.cm-selectionLayer` DOM layers exist post-
  mount, and a document covering heading/strong/emphasis/code/link produces highlighted `<span
  class="...">` output for each construct's node type.
- **Real-browser verification** (temporary `.dev-harness/`, Playwright + Chromium, deleted after
  use): two editors, one under a `.dark`-scoped ancestor `<div>`, one plain. Confirmed (1) the two
  editors' `.cm-cursor` border colour and (focused, forced-selection) `.cm-selectionBackground`
  differ, and neither equals CodeMirror's hardcoded black cursor default; (2) toggling `.dark` off
  the *already-mounted* dark-scope editor's ancestor updates its cursor colour live, with the same
  `EditorView` object reference and the same `.cm-cursor` DOM node before and after (no remount),
  and an unflushed in-flight document edit made immediately before the toggle survives it; (3) the
  sibling (light-scope) editor's cursor colour is unaffected by that toggle. A separate check
  confirmed heading/strong/inline-code text renders in distinct colours from body text once the
  harness's default persisted theme ("Mono" — `useTheme.ts`'s own documented default, deliberately
  near-zero chroma) was swapped for the colourful default, resolving to the exact expected token
  values (`--color-primary-500`, `--color-primary-700` for code, etc.).
- Grepped `src/` for hex/rgb/hsl/oklch literals and inspected the built `dist/clean-ui-editor.css`
  directly — no colour literal anywhere outside a code comment.

### 2026-07-29 - Tasks 2.3.1/2.3.2: Verification debt from the spike
**Status:** Deferred

Both tasks require hardware or software this environment cannot provide — a physical iOS/Android
device (2.3.1) and a real screen reader (2.3.2). This was anticipated before Phase 02 started (the
plan's own "Verification Debt Carried From the Spike" section already frames this limitation) and is
recorded here rather than claimed complete. What automated proxies *could* verify — real
`pointerType: "touch"` events switching granularity correctly, and a CDP accessibility-tree
extraction confirming the underlying markdown (including markers) is exposed as `StaticText`
beneath the editor's `textbox` role — is documented against 2.1.1/2.1.2 above and does not stand in
for the device- and assistive-technology-specific behaviour these two tasks ask for. See each
task's own "Deferral reason" in `phase-02-tasks.md` for what remains outstanding.

<!-- Template:
### YYYY-MM-DD - Task N.G.T: Title
**Agent:** {agent}  **Status:** {Started|Completed|Blocked}
**Work Done:**
**Decisions Made:**
**Notes:**
-->

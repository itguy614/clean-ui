# Phase 06 Journal: Render Subpath

Progress, decisions and notes logged as tasks are addressed. Entries are appended by whoever works
a task — the tasks file tracks status, this file records why things happened.

## Log

### 2026-07-30 - All tasks: adapter contract, viewer, supplied adapter, security suite
**Agent:** frontend work (self, not delegated)  **Status:** Completed

**Work Done:** All four tasks — see `phase-06-tasks.md`'s per-task **Note** blocks for full detail.
Summary of what shipped:
- `src/render/contract.ts` — `TrustedHtml` (branded type), `markAsTrustedHtml`, `MarkdownRenderAdapter`.
  Exported from the core barrel (contract only); the actual renderer stays out of it entirely.
- `src/render/serialize.ts` — a markdown-to-HTML serializer built on the *same* `gfmParser` the editor
  itself parses against (newly exported from `language/markdown-language.ts`), not a new dependency.
- `src/render/supplied-adapter.ts` — `createMarkdownRenderAdapter()`, escaping raw HTML by default,
  refusing (throwing) `allowRawHtml` without a `sanitize` function.
- `src/render/CuiMarkdownViewer.vue` — applies `.cui-typography`, catches a throwing adapter with one
  warning + escaped fallback.
- `src/url-policy.ts` — relocated from `plugins/builtin/dialogs/` to package-wide, shared by the link/
  image dialogs and the new adapter; gained `tel:` (FR42, previously missing from the dialogs' own list).
- `scripts/check-render-subpath-isolation.mjs` — a permanent, build-chained check against the real
  `dist/` output for the barrel/`/render` isolation guarantee.

**Decisions Made:**
- **Built the HTML serializer on `@lezer/markdown` directly rather than pulling in a markdown-it/marked
  dependency.** The editor already depends on `@lezer/markdown` + GFM for its own parsing (Phase 01's
  NFR1a decision) — reusing that exact parser for rendering means zero new dependencies, a smaller
  `/render` bundle, and — more importantly — guarantees the editor and the viewer can never disagree
  about what a document means, since they parse it identically. Exported the parser (renamed
  `gfmParser`, no CodeMirror-specific node props attached) from `markdown-language.ts` rather than
  duplicating the `baseParser.configure([GFM])` call in a second place.
- **Every node-name and tree-shape assumption was verified empirically, not taken from documentation.**
  `@lezer/markdown`'s own README explicitly states it provides no HTML-rendering guidance, and this
  environment's permission settings block reading `node_modules` directly (confirmed by trying both
  `Bash` and `Read` against several paths) — ground truth came from grepping this codebase's own
  already-proven node-name usages, external doc fetches for corroboration, and — decisively — a
  disposable diagnostic test dumping `tree.toString()` for ~25 real markdown snippets against the
  actual configured parser, deleted once its findings were encoded into the serializer. This caught
  three real assumptions that were wrong before any test suite ran against them: a task-list item's
  tree shape (`ListItem` wraps `Task`, so `Task`'s own case must not add a second `<li>`), `InlineCode`
  having no dedicated text child (content is a plain gap between two `CodeMark` nodes), and an indented
  code block's leading 4-space indent living in the *parent's* gap text rather than inside the node.
- **Whitespace immediately adjacent to a syntax marker (`#`, `>`, `-`/`1.`, `[ ]`, and an indented code
  block's leading indent) is trimmed generically, not per-construct.** A first pass produced a stray
  leading space in every heading/blockquote/list-item (`<h1> Heading</h1>`) because the required
  separator space belongs to the syntax, not the content, and the generic gap-filling render approach
  has no way to know that on its own. Fixed with one small, explicit rule (`TRIM_ADJACENT_MARKERS`/
  `TRIM_INDENT_BEFORE`) applied uniformly at the tree-walk level, rather than special-casing each
  affected construct's own render function.
- **`isAllowedUrl` moved out of `plugins/builtin/dialogs/` to a package-wide `src/url-policy.ts`.**
  FR42 requires the *same* scheme allowlist in both the dialogs and the render adapter; discovered
  while wiring the adapter that the dialogs' own list was missing `tel:` despite FR42 naming it —
  fixed the gap for both consumers by construction (one shared list) rather than duplicating a
  slightly-different copy for the new adapter.
- **The barrel/`/render` isolation guarantee (FR36/FR38) is checked mechanically against the real
  built `dist/` output, chained into the package's own `build` script** — mirroring clean-ui's own
  `scripts/check-fixture-guarantees.mjs` pattern rather than trusting the guarantee holds just because
  the source files are laid out correctly. Kept package-local (not folded into the shared,
  fixture-app-based script) since this specific guarantee compares two of *this* package's own
  subpath entries against each other, not a consumer app's aggregate bundle.

**Verification:**
- 61 new tests in `@itguy614/clean-ui-editor` (up from 219 to 241): 17 for the serializer covering
  every CommonMark/GFM construct this phase touches, 4 for the supplied adapter (escape-by-default,
  refuse-without-sanitize, sanitize-when-supplied, TrustedHtml contract), 5 for the viewer (typography
  class, throwing-adapter fallback with exactly one warning, clean re-render on value and adapter
  changes, accepting a third-party-produced `TrustedHtml`), 17 for security (every FR41/FR42 vector
  named individually), 2 SSR/node-environment tests proving the adapter needs no DOM, plus a
  `contract.test-d.ts` type fixture (checked via the existing `tsconfig.typecheck.json` pattern) and 1
  new `tel:` case added to the relocated `url-policy.test.ts`.
- Real-browser verification (temporary, deleted `.dev-harness/` each time, Playwright): typography CSS
  genuinely applies (measured `h1` font-size larger than body text); every construct in a
  comprehensive sample document renders correctly (headings, lists, nested lists, task-list
  checkboxes, fenced code, a table, a blockquote, a link, an image); a refused `javascript:` link
  renders as plain text with no `<a>` at all; and — the decisive check — a raw `<script>` block is
  confirmed to produce **zero** actual `<script>` DOM elements (`document.querySelectorAll("script")`
  count), verifying the escaping against the real rendered DOM rather than the HTML string alone.
- Full workspace regression: `pnpm -r build` (including the new `check-render-subpath-isolation.mjs`
  step), `pnpm -r --if-present test` (443 clean-ui tests + 241 clean-ui-editor tests, all green),
  `pnpm verify:fixture` (packed-tarball install, fixture guarantees, bundle budget — delta unchanged
  at 54.8 kB against the 65 kB budget, confirming `/render` isn't pulled into a consumer's bundle
  unless explicitly imported) all pass after this phase's changes.

<!-- Template:
### YYYY-MM-DD - Task N.G.T: Title
**Agent:** {agent}  **Status:** {Started|Completed|Blocked}
**Work Done:**
**Decisions Made:**
**Notes:**
-->

<!-- Template:
### YYYY-MM-DD - Task N.G.T: Title
**Agent:** {agent}  **Status:** {Started|Completed|Blocked}
**Work Done:**
**Decisions Made:**
**Notes:**
-->

# Phase 01 Journal: Package Scaffold and Editor Foundation

Progress, decisions and notes logged as tasks are addressed. Entries are appended by whoever works
a task — the tasks file tracks status, this file records why things happened.

## Log

### 2026-07-29 - Task 1.1.1–1.1.3: Package scaffold, subpaths, single-instance detection
**Agent:** claude (direct implementation)  **Status:** Completed

**Work Done:**
- `packages/clean-ui-editor`: `@itguy614/clean-ui` as a `^1.2.0` peer + `workspace:*` devDependency;
  CodeMirror/Lezer packages as regular `dependencies` with caret ranges (never peers, never
  pinned), matching the task's own instruction. Build config (`vite.config.ts`) mirrors clean-ui's
  externalize-by-rule pattern exactly, plus its own `__CUI_EDITOR_VERSION__` build-time define.
- Three build entries: `index.ts` (barrel), `codemirror.ts` (re-exports the CodeMirror surface a
  raw-tier plugin needs — grows in Phase 03 as the plugin system needs more), `render.ts` (an
  intentionally near-empty placeholder — `export {}` — since the real renderer is Phase 06's task;
  this only establishes the entry so its build mechanics and the "barrel pulls in neither the
  renderer nor the sanitiser" guarantee can be verified now).
- `src/duplicate-guard.ts`: `registerEditorInstance()` stamps a versioned global — called from
  inside the component's view-construction path (`onMounted`), not at module load, per the task's
  own wording ("at first construction") — plus `translateCodeMirrorError()`, which re-explains
  CodeMirror's own "Unrecognized extension value" error (raised when two different
  `@codemirror/state` copies get combined) with the actual, actionable cause.
- Verified all three subpaths mechanically: packed a real tarball (`pnpm pack`), installed it into
  a throwaway `/tmp` consumer with plain `npm install` (bypassing the peer-range check with
  `--legacy-peer-deps` only for this one-off /tmp check, since clean-ui's version hadn't been
  bumped yet at that point — see below), and confirmed `.`, `/codemirror`, `/render` all resolve
  with working `.d.ts` files.

**Decisions Made:**
- **A real, workspace-breaking problem found and fixed:** the moment this package existed with a
  `^1.2.0` peer on `@itguy614/clean-ui`, Phase 02's consumer-fixture verification
  (`pnpm verify:fixture`, a *required* CI step) started failing — `scripts/list-publishable-
  packages.mjs` auto-discovers every `packages/*` without `"private": true`, so it now packs and
  installs clean-ui-editor's tarball *alongside* clean-ui's into the same fixture, and npm's
  dependency resolution correctly rejected it: clean-ui's own `package.json` still said `1.1.0`,
  since 1.2.0 has never actually been released. Fixed by bumping the root `VERSION` file and
  `packages/clean-ui/package.json` to `1.2.0` now — not a release (no tag, no publish, no
  `CHANGELOG.md` entry), just moving the *workspace's* lockstep version number forward to what the
  entire `clean-ui-1.2-seams` plan was already building toward, matching NFR2's explicit statement
  that 1.2.0 is the floor this package requires. Left `CHANGELOG.md` alone deliberately — its
  latest entry describes the last actual release (1.1.0); the 1.2.0 entry is release-time work, not
  something to half-write mid-development of a package that isn't finished yet.

**Tests:** `check:imports` passes (`node ../clean-ui/scripts/check-dist-imports.mjs .`) confirming
every bare import in `dist` is declared — including `@codemirror/lang-markdown`, kept as a real
dependency specifically for the tree-shakeable list-continuation commands (see Task 1.2.1 below).
Re-ran `pnpm verify:fixture` after the version bump — passes clean, bundle budget unaffected
(clean-ui-editor's tarball being *installed but unused* in the fixture doesn't change what actually
gets bundled).

---

### 2026-07-29 - Task 1.2.1: Mount CodeMirror in a Vue component
**Agent:** claude (direct implementation)  **Status:** Completed

**Work Done:**
- `src/language/markdown-language.ts`: the markdown `Language`, built directly from
  `@lezer/markdown`'s `parser.configure(GFM)` — reimplementing the exact construction
  `@codemirror/lang-markdown` uses internally for its own `commonmarkLanguage` (read directly from
  its compiled source to get this right), but starting from the GFM-configured parser instead of
  going through `@codemirror/lang-markdown`'s `markdown()`/`markdownLanguage`, whose static
  dependency on `@codemirror/lang-html` this architecture decision exists specifically to avoid
  (NFR1a). `insertNewlineContinueMarkup`, `deleteMarkupBackward`, `markdownKeymap` are imported
  from `@codemirror/lang-markdown` directly (confirmed via its `.d.ts` these have no HTML
  dependency of their own) for list continuation (FR16), matching the plan's own claim that these
  tree-shake free of the HTML grammar.
- `CuiMarkdownEditor.vue`: mounts an `EditorView` with the markdown language, `history()`, the
  merged keymap, a `placeholder()` extension, and `EditorView.cspNonce.of(nonce)` when a nonce is
  supplied (via prop or a `csp-nonce` meta tag fallback) — applied at construction, since
  CodeMirror injects its styles at runtime and the nonce can't be added after the fact.

**Decisions Made:**
- **A real, cross-version bug found and fixed, independent of any editor code:** adding
  `@vue/server-renderer` (needed for the SSR test, Task 1.2.4) resolved to `3.5.40` while the
  workspace's already-locked `vue` was `3.5.32` — mismatched, since `pnpm add` resolves
  independently of whatever's already in the lockfile. `useTemplateRef` under `renderToString()`
  threw `Cannot define property <name>, object is not extensible` on that mismatched pair,
  reproduced in a two-line script with no editor code involved at all. A plain `ref()` template
  ref worked fine on the identical pair. Since `useTemplateRef` is clean-ui's own documented
  convention (`CuiButton.vue` and others use it), this was a **latent risk in clean-ui's own SSR
  story** that had simply never been triggered — its one SSR test used a plain `ref()`, not
  `useTemplateRef`. Fixed with `pnpm update vue --recursive --latest` (now `3.5.40` everywhere as a
  devDependency; the consumer-facing peerDependency range stays the broad `^3.5.0`). Recorded in
  CLAUDE.md's Critical Gotchas and as a standing memory, since it's exactly the kind of thing that
  resurfaces the next time either package gets bumped independently.
- **A repeat of Phase 01 (clean-ui)'s `__CUI_VERSION__` bug, caught immediately this time because
  of that exact lesson:** a throwaway dev harness importing `CuiMarkdownEditor` from source hit
  `__CUI_EDITOR_VERSION__ is not defined` for the identical reason — the harness's own Vite config
  had no `define` for it. Fixed by using `workspaceVersionDefines()` (extended in `config/
  workspace-aliases.ts` to cover clean-ui-editor alongside clean-ui) instead of hand-rolling one.
  This is exactly the payoff the earlier fix was meant to provide.
- **CSP nonce:** verified the mechanism directly (not just documented) — mounted with a `cspNonce`
  prop and separately with a `<meta name="csp-nonce">` fallback, and asserted every `<style>`
  CodeMirror injected carries that nonce.

**Tests:** Unit tests assert GFM parsing (a document containing every construct, asserting the
syntax tree contains `Strikethrough`, `TaskMarker`, `Table`, `URL`, `ATXHeading1` nodes), mount/
unmount, and the CSP nonce mechanism (both the prop and the meta-tag fallback). Beyond unit tests:
built a temporary, uncommitted dev harness (a real Vite dev server + an actual `.vue` SFC, not an
inline string template, which itself doesn't compile under Vite's default runtime-only Vue build)
and drove it with a real headless Chromium — confirmed the editor renders with correct clean-ui
button styling and correct ARIA attributes (`role="textbox"`, `aria-multiline="true"`,
`contenteditable="true"`), typing works, and there are zero console/page errors. Deleted the
harness afterward; nothing from it is committed.

---

### 2026-07-29 - Task 1.2.2: Value contract
**Agent:** claude (direct implementation)  **Status:** Completed

**Work Done:** Echo suppression tracks `lastKnownValue` — the last value this component actually
told the host about (or was told to apply) — and treats an incoming `modelValue` equal to it as a
no-op.

**Decisions Made — the bug this task exists to prevent, caught by its own test:** the first
implementation updated `lastKnownValue` *eagerly*, inside the document-changed handler, on every
keystroke. That's wrong under a throttle: type "c" then "d" faster than the throttle window, and
the host echoes back the value it was told after "c" (i.e. "abc", now stale) — comparing that
stale echo against the *eagerly-updated* `lastKnownValue` (already "abcd") finds a mismatch,
misreads the stale echo as a genuine new external value, and dispatches a transaction that rolls
the document back to "abc," **dropping the "d" the user already typed**. This is precisely the
failure mode the task description names ("the failure mode most Vue CodeMirror wrappers have
shipped at least once"), and the fix is to update `lastKnownValue` only inside the throttled
callback's actual invocation — i.e. exactly when the host is actually told, not when the document
changes — so a stale echo is recognized as stale regardless of how much further typing has
happened since.

**Tests:** A dedicated test simulates exactly that race (dispatch "c", dispatch "d" faster than a
50ms throttle, then echo back "abc") and asserts the document stays "abcd." Caught the bug on first
run; passes after the fix. Also covers: unedited content (including an HTML block and YAML
frontmatter) round-trips byte for byte; an incoming value equal to the current document dispatches
nothing at all (spied on `view.dispatch`); a genuinely different external value does replace the
document.

---

### 2026-07-29 - Task 1.2.3: Mode switching
**Agent:** claude (direct implementation)  **Status:** Completed

**Work Done:** One `Compartment` reconfigured on mode change, rather than two editor instances.
Phase 01 has no visual difference between `wysiwyg` and `source` yet (the reveal layer, Phase 02's
job, plugs its decorations into this same compartment for `wysiwyg` — `source` stays the base
editor with nothing added, satisfying FR4 already). The mode-switch transaction carries only
`effects` (the compartment reconfiguration + an `EditorView.announce` for assistive technology),
never `changes` — CodeMirror's `history()` tracks document changes specifically, so an effects-only
transaction is invisible to undo/redo by construction, which is what "switching preserves undo
history" actually depends on.

**Decisions Made:** The mode toggle (FR5) is a plain two-button `CuiButtonGroup`/`CuiButton` pair
rendered directly in the component — dogfooding clean-ui's own components, consistent with the
whole premise of this package — rather than part of a general toolbar system, since the toolbar
proper (driven by plugin-declared entries) doesn't exist until Phase 03/04. `showModeToggle` prop
suppresses it per FR5.

**Tests:** Dispatches a synthetic edit, switches mode, asserts document/selection are unchanged,
then calls `undo()` from `@codemirror/commands` and confirms it still undoes the pre-switch edit as
a single step (proving the mode switch itself never entered undo history). Separately asserts
`view.dispatch` was called with a non-empty `effects` array on a mode change (the announcement).

---

### 2026-07-29 - Task 1.2.4: SSR shell
**Agent:** claude (direct implementation)  **Status:** Completed

**Work Done:** No separate "shell" element — the same `<div ref="cmHost">` CodeMirror mounts into
is what renders (empty) during SSR and pre-hydration, with `min-height` reserved via CSS so it
occupies the same space before and after CodeMirror populates it. `data-testid` on that div
switches from `cui-markdown-editor-shell` to `cui-markdown-editor` once `isMounted` flips true
(inside `onMounted`, so never during SSR) — both server and pre-hydration client render use the
same `isMounted === false`, so there's no hydration mismatch to warn about.

**Tests:** `src/__tests__/ssr/` (the node-environment vitest project, same pattern established in
`clean-ui`'s Phase 02): `renderToString()` on the component asserts the shell's `data-testid` and
that the real editor's `data-testid` is *not* present — i.e. no DOM access, no CodeMirror
construction, happened server-side.

---

### 2026-07-29 - /simplify pass
**Agent:** claude (direct review, no subagents)  **Status:** Completed

Reviewed the full staged diff directly. Two findings, both fixed:
- Two stray generated `config/jsdom-polyfills.d.ts` / `.d.ts.map` files had leaked into the repo
  root — debris from an earlier failed build attempt (before `test-setup.ts` was excluded from the
  main tsconfig) where `vue-tsc` tried and failed to compute a declaration output path for a file
  outside `rootDir`, landing partial output at the repo root via relative path traversal. Deleted;
  confirmed a clean rebuild doesn't regenerate them.
- `packages/clean-ui-editor/scripts/postbuild.mjs` was an exact copy of `packages/clean-ui/scripts/
  postbuild.mjs` (only the CSS filename differed) — flagged as a known duplication when writing it
  earlier this phase. Extracted both into `scripts/report-bundle-size.mjs` (repo root, resolves
  `dist` from `process.cwd()` — each package's own `build`/`size` script already runs it from that
  package's directory), deleted both per-package copies.

Re-ran the full verification suite after both fixes — unaffected.

---

### 2026-07-29 - Phase 01 complete
**Status:** All 7 tasks complete. Full workspace verification: `pnpm -r build`, `pnpm -r
--if-present check:imports`, `pnpm -r --if-present test` (clean-ui: 443 passed; clean-ui-editor: 23
passed, both jsdom+ssr), `pnpm --filter @itguy614/clean-ui-docs exec vue-tsc --noEmit`,
`pnpm check:contrast`, and `pnpm verify:fixture` all green. Real-browser verification done via a
temporary, uncommitted dev harness (deleted after use) — not deferred to Phase 07's docs site.

**Note for Phase 02 (Reveal Layer and Theming):** the mode compartment (`modeCompartment` in
`CuiMarkdownEditor.vue`) and `buildModeExtensions(mode)` are the exact seam this phase plugs its
hide/reveal decorations into for `wysiwyg`.

**Note for Phase 03 (Plugin System):** `src/codemirror.ts`'s re-export list is deliberately minimal
right now (just enough for `markdown-language.ts` and the component itself) — expected to grow
once plugins need more of the CodeMirror surface (`Decoration`, `WidgetType`, `ViewPlugin` are
already there in anticipation).

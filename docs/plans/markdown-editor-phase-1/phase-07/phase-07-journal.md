# Phase 07 Journal: Documentation Site

Progress, decisions and notes logged as tasks are addressed. Entries are appended by whoever works
a task — the tasks file tracks status, this file records why things happened.

## Log

### 2026-07-30 - All tasks: apps/editor-docs scaffold, reference, guides
**Agent:** frontend work (self, not delegated)  **Status:** Completed

**Work Done:** All five tasks — see `phase-07-tasks.md`'s per-task **Note** blocks for full detail.
Summary of what shipped:
- `apps/editor-docs` — a second docs app mirroring `apps/docs`'s conventions exactly (App.vue shell,
  Example/PropTable/EventTable, theme/dark-mode/density controls, mobile slideover nav), registered in
  `config/docs-sites.mjs` at `/editor/` for the composed Pages artifact.
- `Overview.vue`, `InstallationPage.vue`, `EditorPage.vue` (full prop/event/slot/method/command
  reference + six live examples), `AccessibilityPage.vue`, `PluginAuthoringPage.vue`,
  `IntegrationTestingPage.vue`.

**Decisions Made:**
- **Reused the platform work's shared alias module (`config/workspace-aliases.ts`) rather than
  writing a local alias list.** It already anticipated `@itguy614/clean-ui-editor` specifically (its
  own comment names the package, guarded by `existsSync` so it was always safe to call before this
  package existed) — this task was "plug into existing infrastructure," not "build new
  infrastructure." Same for `config/docs-sites.mjs`/`scripts/build-docs-sites.mjs`: adding one array
  entry (`{ dir: "apps/editor-docs", base: "/editor/" }`) was the entire integration; the composed
  build, deep-link dispatch, and root `404.html` all already worked generically.
- **A real documentation bug found and fixed by testing the example live, not by trusting the prose.**
  The plugin-authoring guide's "raw tier escapes the precedence model" claim was checked against a
  real editor instance rather than assumed correct because the spec's own FR21 language implied it —
  the original example (overriding bold's `Mod-b` via `Prec.highest`) silently did nothing when tried.
  Traced to `CuiMarkdownEditor.vue`'s `registryExtensions()`: the registry's own keymap is *already*
  `Prec.highest`, registered before a plugin's raw extensions, so two same-tier `Prec.highest`
  extensions resolve by their position in the array and the registry's own always wins. The example
  and prose were rewritten around what a raw extension's `Prec.highest` genuinely *can* override — one
  of CodeMirror's own base keybindings (undo, indentation, default editing), which carry no `Prec`
  wrapper at all. This is precisely the "a plugin author hitting this without documentation will
  assume a bug" scenario the task's own description warns about — worth getting exactly right rather
  than shipping the plausible-sounding original.
- **Reused `bold.ts`'s real, unmodified source as a worked example**, rather than writing a
  parallel/simplified stand-in — task 7.2.1's own AC ("examples are the library's own built-in
  plugins, not parallel inventions") is easiest to satisfy by literally quoting the file, and doing so
  means the docs can never drift out of sync with what the plugin actually does.
- **Bundle-cost figures in the Integration guide cite the currently-measured numbers** (from
  `scripts/check-bundle-budget.mjs`'s own last real run — ~55 kB gzip against the 65 kB budget) rather
  than the original prototype-spike numbers quoted in the feature spec, since those are what a reader
  building today would actually observe.

**Verification:**
- Real-browser verification (temporary, deleted `.dev-harness`-equivalent Vite dev server on port
  5184 each time, Playwright) across every one of the six routes: zero console/page errors on any
  page; theme switcher (Forest applied `cui-theme-forest`), dark mode (`.dark` class toggled), and
  density (header label updated) all confirmed by reading the actual resulting DOM state, not just
  clicking and assuming; the Editor reference page's six live examples all confirmed distinctly
  (mode-switch text updates, both form fields show identical resolver errors, maxLength counter
  reflects real content, custom-toolbar and construct-excluded editors show the exact expected button
  counts — 15/15/15/15/3/14 across six instances); the Plugin Authoring guide's three examples all
  confirmed working (timestamp inserts a real ISO string, the TODO highlight class appears on real
  text, and — after finding and fixing the precedence bug above — the corrected undo-override example
  fires); the mobile hamburger opens a slideover containing the same nav and closes on navigation
  (an initial locator ambiguity, matching an *unrelated* in-page link sharing a text substring,
  was itself resolved by inspecting DOM visibility directly rather than assumed to indicate a real
  bug); the narrow-viewport toolbar-overflow demo measured actual `scrollWidth`/`clientWidth` at both
  its default and minimum slider positions, confirming scroll rather than clip at every width tried.
- The composed multi-site build (`node scripts/build-docs-sites.mjs`) verified directly: both sites
  build, compose into one artifact with the main site at the root and this one at `/editor/`, and the
  generated root `404.html` correctly dispatches a deep link into either segment.
- Full workspace regression: `pnpm -r build` (all four packages/apps, including the new
  render-subpath-isolation check from Phase 06), `pnpm -r --if-present test` (443 clean-ui tests + 241
  clean-ui-editor tests, all green — this phase added no new library code, only the docs app), and
  `pnpm verify:fixture` (packed-tarball install, fixture guarantees, bundle budget unchanged at 54.8 kB
  against the 65 kB budget) all pass. This closes out `docs/plans/markdown-editor-phase-1` — 42/44
  tasks complete, all 44 addressed (the remaining 2, formally deferred in Phase 02, need a physical
  touch device and a real screen reader this environment cannot provide).

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

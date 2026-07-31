# Phase 03 Journal: Plugin System

Progress, decisions and notes logged as tasks are addressed. Entries are appended by whoever works
a task — the tasks file tracks status, this file records why things happened.

## Log

### 2026-07-29 - All tasks: the plugin system (record, context, registry, wiring)
**Agent:** frontend work (self, not delegated)  **Status:** Completed

**Work Done:**
- New `src/plugins/` module:
  - `types.ts` — `PLUGIN_API_VERSION`, `CuiEditorPluginSpec`/`CuiEditorPlugin`, `CommandContext`,
    `PluginCommand`/`PluginCommandSpec`, `ToolbarEntry`, `KeymapEntry`, `PasteRule`, `DecorationRule`.
    Every declarative field is plain data; `extensions` (the raw CodeMirror escape hatch) is the one
    intentionally CodeMirror-typed field.
  - `define-plugin.ts` — `definePlugin(spec)` stamps `apiVersion: PLUGIN_API_VERSION`.
  - `command-context.ts` — `createCommandContext(getView)`. `doc`/`selection` are live getters over
    `getView()`, not a snapshot; `insertAtCursor`/`wrapSelection`/`replaceRange`/`replaceRanges` each
    dispatch exactly one transaction; `collect(open)` wraps a caller-supplied `open(settle)` callback
    in a `Promise<T | null>`.
  - `registry.ts` — `buildRegistry(plugins)`: resolves precedence (later plugin/command/keybinding
    wins, duplicate ids/conflicts warn naming both sides), rejects an incompatible `apiVersion`
    outright, collects toolbar/constructs/paste/decorations, and groups each plugin's raw
    `extensions` as its own nested subtree rather than flattening them.
  - `invoke-command.ts` — `invokeCommand`/`queryIsActive`, the single guarded entry point every
    invocation path calls through; a throwing command/query reports via an `onError` callback and
    degrades (returns `false`) rather than propagating.
  - `default-plugins.ts` — `DEFAULT_PLUGINS: CuiEditorPlugin[] = []`, populated by Phase 04.
- Wired into `CuiMarkdownEditor.vue`: a `plugins` prop (defaults to `DEFAULT_PLUGINS`), a
  `pluginsCompartment`, `pluginError`/`pluginConfigError` emits, and `runCommand`/`isCommandActive`/
  `getSelection` added to the imperative API alongside the existing `el`/`focus`/`blur`/`getView`.
  The `plugins` watcher builds and validates the replacement registry *before* touching anything —
  on failure it only emits `pluginConfigError` and returns, leaving `currentRegistry` and the live
  compartment content byte-for-byte as they were.

**Decisions Made:**
- **Construct-policy enforcement (wiring `decorations`/`constructs` into the reveal layer so an
  excluded plugin's markers go unstyled) is explicitly Phase 04's job** (`phase-04-tasks.md` task
  4.3.2), not this phase's. Confirmed by reading ahead before designing: Phase 04's own overview
  states "every formatting action written as an ordinary plugin against the Phase 03 API," and its
  task 4.3.2 owns paste conversion + construct-policy enforcement together. Phase 03 only needed to
  prove plugins *can declare* `constructs`/`decorations` and have the registry collect them
  correctly — not rewire Phase 02's `SUPPORTED_CONSTRUCT_NODES` yet, which would have broken
  Phase 02's already-shipped, already-tested default hiding behaviour the moment `DEFAULT_PLUGINS`
  (empty until Phase 04) became the source of truth.
- **`CommandContext.doc`/`.selection` are live getters, not a snapshot.** This is what makes FR18a's
  "positions still valid if the user typed during the dialog" true for free: a command's `.then()`
  continuation after an awaited `collect()` reads whatever the view's *current* state is at that
  moment, with no explicit `ChangeDesc`-based position-mapping machinery needed. Verified directly
  (`command-context.test.ts`): dispatch a document edit *inside* the `collect()` opener callback,
  before it resolves, and confirm `context.doc` reflects it afterward.
- **CodeMirror's own keymap semantics are first-registered-handler-wins — the opposite of this
  registry's later-plugin-wins precedence.** `buildRegistry` resolves every keybinding conflict into
  one entry per key *before* any `keymap.of()` call exists (a `Map` keyed by key string, later
  plugin overwrites earlier), so the two precedence models never fight each other. Concatenating raw
  keymap arrays and handing them to CodeMirror directly — the "obvious" first approach — would have
  silently produced the wrong winner.
- **`replaceRanges(edits)` was added beyond the three helpers FR18 names**, so a command that must
  touch more than one range (e.g. a future multi-line list toggle) can still satisfy FR15's "one
  undo step however many edits it makes internally": a single `state.update()` call with multiple
  non-overlapping changes composes into one `ChangeSet` — one transaction — natively.
- **Per-plugin raw-extension isolation is a nested-array grouping, not a sandboxed Compartment per
  plugin.** `extensions.push(plugin.extensions)` (nested), not `push(...plugin.extensions)`
  (flattened) — keeps a broken plugin's contribution at least attributable to its own subtree.
  Combined with CodeMirror's own built-in per-`ViewPlugin` update error containment (already true
  today, not something this phase added), this was judged sufficient; a fully sandboxed
  Compartment-per-plugin system was considered and rejected as over-engineering a case with no real
  raw-extension-using plugin yet — the first arrives in Phase 04.
- **No toolbar or slash-menu UI exists yet** (Phase 04's job) — every AC referencing "toolbar button
  pressed state" or "produces the same edit as its toolbar button" was verified one layer down, via
  `isCommandActive`/`runCommand` directly and via a real keymap `KeyboardEvent` dispatch, since both
  the future toolbar and slash menu will call through the exact same `invokeCommand`/`queryIsActive`
  this phase built.

**Verification:**
- `vue-tsc --emitDeclarationOnly` — zero errors, confirming no un-exported type leaks into a public
  declaration (the concrete symptom task 3.1.1's "usable from another package" AC is guarding
  against).
- 32 new jsdom tests across `define-plugin.test.ts`, `registry.test.ts`, `command-context.test.ts`,
  `plugin-integration.test.ts` (66 total in the package, up from 34 at the start of this phase) —
  covering: every declarative field taking effect, API-version rejection naming the mismatch,
  command/keybinding override with warnings naming both contributors, duplicate plugin id
  replacement, the default preset's own conflict-freedom, every context helper across empty/partial/
  multi-line selections, `replaceRanges` as one undo step, `collect()` resolve/cancel/live-position
  behaviour, a throwing command/query degrading safely and reporting via `pluginError`, a real
  keymap `KeyboardEvent` producing the same edit as `runCommand`, reactive `plugins` reconfiguration
  preserving document/history/cursor, and an invalid configuration being rejected without disturbing
  the previous one.
- No Playwright/browser-level verification was needed this phase (unlike Phase 02) — every behaviour
  here is pure state/JS logic with no layout, CSS cascade, or accessibility-tree dependency, which is
  exactly the "jsdom where possible, browser where layout is involved" split task 3.2.4 asks for.
- Full workspace regression: `pnpm -r build`, `pnpm -r --if-present test`, `pnpm verify:fixture` all
  green after this phase's changes.

<!-- Template:
### YYYY-MM-DD - Task N.G.T: Title
**Agent:** {agent}  **Status:** {Started|Completed|Blocked}
**Work Done:**
**Decisions Made:**
**Notes:**
-->

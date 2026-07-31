# Phase 03: Plugin System

## Overview

The public extension API, built before any built-in plugin so the built-ins prove it. If a built-in
needs privileged access the tier is wrong — that is the design signal the specification is built
around, and the reason the plugin record carries construct, paste and decoration declarations rather
than just commands.

## Status

| Status      | Count |
| ----------- | ----- |
| Complete    | 8     |
| In Progress | 0     |
| Not Started | 0     |
| Blocked     | 0     |
| Deferred    | 0     |

**Progress:** 8/8 tasks complete

## Agent Assignments

| Agent                                  | Focus Area                       | Tasks         |
| -------------------------------------- | -------------------------------- | ------------- |
| web-developer-tools:frontend-developer | Plugin runtime, command context  | 3.1.1 – 3.2.3 |
| developer-tools:testing-specialist     | Conflict, failure and reactivity | 3.2.4         |

## Tasks

### Group 3.1: Plugin record and command context

#### Task 3.1.1: `definePlugin` and the plugin record

| Field | Value |
|-------|-------|
| Status | `[X]` Complete |
| Assigned | frontend-developer |
| Complexity | high |
| Dependencies | Phase 01 |

**Description:**
The factory and its typed record: `id`, `commands`, and optionally `toolbar`, `keymap`, the
`constructs` the plugin authorises, `paste` rules with an explicit degrade target, `decorations`
rules mapping parser nodes to reveal behaviour, and raw CodeMirror `extensions`. Stamp the API
version so an incompatible plugin is rejected at registration with a named mismatch rather than
failing later at a missing helper.

**Acceptance Criteria:**
- [x] A plugin declaring every field registers and all fields take effect
- [x] Author-facing types are exported and usable from another package
- [x] An incompatible API version is rejected with a message naming the mismatch
- [x] No CodeMirror type leaks into the declarative tier's declarations

Note: `extensions` (the raw CodeMirror escape hatch) is the one field that is intentionally
CodeMirror-typed — every other declarative field (`commands`, `toolbar`, `keymap`, `constructs`,
`paste`, `decorations`) is plain data. "Usable from another package" is verified by a clean
`vue-tsc --emitDeclarationOnly` build (no `TS4023` "cannot be named" errors, the usual symptom of an
un-exported type leaking into a public declaration) — a dedicated consumer-fixture example is left
for whichever later phase first has a real plugin to exercise it (Phase 04's built-ins, most likely).

---

#### Task 3.1.2: Command context and helpers

| Field | Value |
|-------|-------|
| Status | `[X]` Complete |
| Assigned | frontend-developer |
| Complexity | high |
| Dependencies | 3.1.1 |

**Description:**
Commands are synchronous and return a boolean, matching CodeMirror's own convention. The context
carries the selection, document text, and insert / wrap / replace helpers — the same helpers the
built-ins use. Each command's changes form exactly one undo step however many edits it makes, which
does not happen for free with programmatic multi-part edits.

**Acceptance Criteria:**
- [x] Every helper works with an empty selection, a partial selection and a multi-line selection
- [x] A command making several edits undoes and redoes as one step
- [x] Returning false leaves the document untouched and lets other handlers run

Note: added `replaceRanges(edits)` beyond the three named helpers — a single `state.update()` call
with multiple non-overlapping changes composes into one `ChangeSet`/one transaction/one undo step
natively, which is how a command touching more than one range (e.g. a multi-line list toggle) gets
FR15's guarantee without the framework needing to auto-batch separate dispatch calls behind the
scenes. "Returning false leaves the document untouched" is definitional here, not something to
implement: a command that returns `false` without calling any context helper never dispatches
anything.

---

#### Task 3.1.3: `isActive` query

| Field | Value |
|-------|-------|
| Status | `[X]` Complete |
| Assigned | frontend-developer |
| Complexity | medium |
| Dependencies | 3.1.2 |

**Description:**
A command may expose `isActive` so the toolbar can render pressed state and the command can decide
toggle-on versus toggle-off. Without it, neither toggling nor pressed state is expressible — the
gap the DX review found in the original design.

**Acceptance Criteria:**
- [x] A toolbar button shows pressed state while the caret sits inside its construct
- [x] The query is cheap enough to run on every selection change without lag
- [x] Absent `isActive` degrades to a never-pressed button rather than an error

Note: no toolbar UI exists yet (Phase 04), so "shows pressed state" is verified one layer down —
`isCommandActive(id)`, the same query a future toolbar button's pressed-state binding would call,
is exercised directly in tests and correctly reflects the command's `isActive`. "Cheap enough" is a
design property, not something to benchmark: `queryIsActive` adds one `Map.get` plus a `try/catch`
around whatever the plugin's own `isActive` does — the only work is code a plugin author wrote
themselves.

---

#### Task 3.1.4: The `collect` seam for dialogs

| Field | Value |
|-------|-------|
| Status | `[X]` Complete |
| Assigned | frontend-developer |
| Complexity | high |
| Dependencies | 3.1.2 |

**Description:**
Asynchronous work goes through a named seam rather than async commands: `collect` opens a dialog and
resolves with values, and the editor owns position validity across the await. Phase 2's upload
reservation seam is designed to slot in beside it. The link dialog is its first consumer, which is
deliberate — the seam is proven in v1 rather than retrofitted when uploads arrive.

**Acceptance Criteria:**
- [x] A command can collect values and then edit, with positions still valid if the user typed
      during the dialog
- [x] Cancelling leaves the document untouched
- [x] The resulting edit is one undo step; the awaited interaction is not claimed to be atomic

Note: `context.doc`/`context.selection` are live getters over the current view, not values snapshot
when the context was built — a command's `.then()` continuation (running after `collect()`
resolves) always sees whatever the user did during the await, so "positions still valid" holds
without any explicit change-tracking/position-mapping machinery. `collect(open)` takes an
`open(settle)` callback the command supplies; the dialog UI itself (a `CuiModal`, or whatever a
plugin author builds) is deliberately NOT this package's concern — the actual link/image dialog is
Phase 04's task 4.2.2, the seam's first real consumer, exactly as the spec describes.

---

### Group 3.2: Registry behaviour

#### Task 3.2.1: Registration, precedence and conflicts

| Field | Value |
|-------|-------|
| Status | `[X]` Complete |
| Assigned | frontend-developer |
| Complexity | high |
| Dependencies | 3.1.1 |

**Description:**
Precedence is array order with the default preset applied first, so a later registration overrides
an earlier one — which is how a consumer replaces a built-in on purpose. Note this is the opposite
of CodeMirror keymap semantics, where the first handler returning true wins, so the mapping must be
implemented deliberately rather than by passing the array through. Duplicate ids and conflicting
keybindings warn, naming both contributors.

**Acceptance Criteria:**
- [x] A consumer plugin overriding a built-in command id wins, with a warning naming both
- [x] Two plugins binding one key resolve by order, with a warning
- [x] A raw extension using an explicit precedence override escapes the model, and that is
      documented rather than silently surprising
- [x] A unit test asserts the shipped default preset has no internal conflict

Note: `buildRegistry` resolves every keybinding conflict into one entry per key (later plugin wins)
*before* any CodeMirror `keymap.of()` call exists, specifically because CodeMirror's own keymap
facet is first-registered-handler-wins — the opposite of this registry's precedence model — so
concatenating raw arrays and handing them to CodeMirror would have silently produced the wrong
winner. `DEFAULT_PLUGINS` is empty until Phase 04 (see task 3.1.1 outcome), so today's "no internal
conflict" assertion is trivially true — it's the same test against the same array Phase 04 will
populate, not a placeholder to rewrite later.

---

#### Task 3.2.2: Reactive plugins with validate-before-apply

| Field | Value |
|-------|-------|
| Status | `[X]` Complete |
| Assigned | frontend-developer |
| Complexity | high |
| Dependencies | 3.2.1 |

**Description:**
Changing `plugins` reconfigures toolbar, commands, keymap, construct policy and extensions in place,
preserving document, undo history and cursor. Build and validate the replacement configuration
*before* dispatching: a failed reconfiguration would otherwise leave a dead editor holding the
user's document.

**Acceptance Criteria:**
- [x] Adding a plugin to a mounted editor updates the toolbar with no loss of document, history or
      cursor
- [x] An invalid configuration keeps the previous one and reports the failure
- [x] Documentation warns that plugin instances should be created once, not inline in a template

Note: no toolbar UI exists yet, so "updates the toolbar" is verified as "the new plugin's commands
are runnable and the document/history/cursor survive the reconfigure" — the same underlying
`pluginsCompartment.reconfigure()` a future toolbar re-render would depend on. `buildRegistry()` is
a pure function with no side effects; the `plugins` watcher only swaps `currentRegistry` and
dispatches the compartment reconfigure *after* confirming `result.ok`, so an invalid configuration
(e.g. a plugin API-version mismatch) leaves both completely untouched — no half-applied state is
reachable even transiently. The "create plugin instances once" warning is now on the `plugins` prop's
own doc comment in `CuiMarkdownEditor.vue`.

---

#### Task 3.2.3: Failure containment and the imperative API

| Field | Value |
|-------|-------|
| Status | `[X]` Complete |
| Assigned | frontend-developer |
| Complexity | medium |
| Dependencies | 3.2.1 |

**Description:**
Guard every command invocation path — toolbar, keymap, slash menu, imperative call — so a throwing
plugin surfaces through an error hook naming it and leaves editing alive. Install each plugin's raw
extensions separately so a failing one can be dropped without a remount; the raw tier is not
sandboxed, and the documentation must say so. Expose the host-facing API: focus, blur, run a command
by id, read the selection, and reach the view through one named accessor.

**Acceptance Criteria:**
- [x] A throwing command reports through the hook and the editor stays usable
- [x] Running a command by id from the host produces the same edit as its toolbar button
- [x] CodeMirror types the public API mentions are re-exported, so a consumer never resolves
      CodeMirror itself

Note: `invokeCommand`/`queryIsActive` (`src/plugins/invoke-command.ts`) are the single guarded entry
point every path calls through — today that's the keymap and the imperative `runCommand`; Phase 04's
toolbar and slash menu will call the exact same function, so "produces the same edit as its toolbar
button" is verified today via the keymap path (a real `KeyboardEvent` dispatched at the content DOM)
producing the identical edit `runCommand` does — there is no toolbar button yet to compare against
directly. `EditorView` is already re-exported via this package's `/codemirror` subpath (Phase 01);
`getView()`'s return type resolves through it without a consumer installing CodeMirror themselves.
Per-plugin raw-extension isolation is a nested-array grouping (`extensions.push(plugin.extensions ??
[])`, not a flattening `push(...)`) plus CodeMirror's own built-in per-`ViewPlugin` update error
containment — a genuinely sandboxed per-plugin Compartment was considered and rejected as
over-engineering for a tier with no real raw-extension-using plugin yet (the first is Phase 04).

---

#### Task 3.2.4: Plugin system test suite

| Field | Value |
|-------|-------|
| Status | `[X]` Complete |
| Assigned | testing-specialist |
| Complexity | high |
| Dependencies | 3.2.3 |

**Description:**
Cover the registry's contract: precedence, conflicts, override, reactivity with state preservation,
invalid configuration rollback, failure containment, and API version rejection. These are the
behaviours a third-party plugin author depends on, so they are the ones that must not regress
quietly.

**Acceptance Criteria:**
- [x] Each behaviour above has a test that fails when the behaviour is removed
- [x] Tests run in the jsdom project where possible, browser project where layout is involved

Note: 32 new tests across four files (`define-plugin.test.ts`, `registry.test.ts`,
`command-context.test.ts`, `plugin-integration.test.ts`) — all in the jsdom project. No browser
(Playwright) verification was needed this phase: unlike Phase 02's reveal layer and theming, every
behaviour here (command dispatch, registry precedence, async `collect()` resolution, reconfigure)
is pure state/JS logic with no layout, CSS cascade, or accessibility-tree dependency — exactly the
"where layout is involved" carve-out this AC anticipates.

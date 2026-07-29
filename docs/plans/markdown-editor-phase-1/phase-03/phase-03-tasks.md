# Phase 03: Plugin System

## Overview

The public extension API, built before any built-in plugin so the built-ins prove it. If a built-in
needs privileged access the tier is wrong — that is the design signal the specification is built
around, and the reason the plugin record carries construct, paste and decoration declarations rather
than just commands.

## Status

| Status      | Count |
| ----------- | ----- |
| Complete    | 0     |
| In Progress | 0     |
| Not Started | 8     |
| Blocked     | 0     |
| Deferred    | 0     |

**Progress:** 0/8 tasks complete

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
| Status | `[ ]` Not Started |
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
- [ ] A plugin declaring every field registers and all fields take effect
- [ ] Author-facing types are exported and usable from another package
- [ ] An incompatible API version is rejected with a message naming the mismatch
- [ ] No CodeMirror type leaks into the declarative tier's declarations

---

#### Task 3.1.2: Command context and helpers

| Field | Value |
|-------|-------|
| Status | `[ ]` Not Started |
| Assigned | frontend-developer |
| Complexity | high |
| Dependencies | 3.1.1 |

**Description:**
Commands are synchronous and return a boolean, matching CodeMirror's own convention. The context
carries the selection, document text, and insert / wrap / replace helpers — the same helpers the
built-ins use. Each command's changes form exactly one undo step however many edits it makes, which
does not happen for free with programmatic multi-part edits.

**Acceptance Criteria:**
- [ ] Every helper works with an empty selection, a partial selection and a multi-line selection
- [ ] A command making several edits undoes and redoes as one step
- [ ] Returning false leaves the document untouched and lets other handlers run

---

#### Task 3.1.3: `isActive` query

| Field | Value |
|-------|-------|
| Status | `[ ]` Not Started |
| Assigned | frontend-developer |
| Complexity | medium |
| Dependencies | 3.1.2 |

**Description:**
A command may expose `isActive` so the toolbar can render pressed state and the command can decide
toggle-on versus toggle-off. Without it, neither toggling nor pressed state is expressible — the
gap the DX review found in the original design.

**Acceptance Criteria:**
- [ ] A toolbar button shows pressed state while the caret sits inside its construct
- [ ] The query is cheap enough to run on every selection change without lag
- [ ] Absent `isActive` degrades to a never-pressed button rather than an error

---

#### Task 3.1.4: The `collect` seam for dialogs

| Field | Value |
|-------|-------|
| Status | `[ ]` Not Started |
| Assigned | frontend-developer |
| Complexity | high |
| Dependencies | 3.1.2 |

**Description:**
Asynchronous work goes through a named seam rather than async commands: `collect` opens a dialog and
resolves with values, and the editor owns position validity across the await. Phase 2's upload
reservation seam is designed to slot in beside it. The link dialog is its first consumer, which is
deliberate — the seam is proven in v1 rather than retrofitted when uploads arrive.

**Acceptance Criteria:**
- [ ] A command can collect values and then edit, with positions still valid if the user typed
      during the dialog
- [ ] Cancelling leaves the document untouched
- [ ] The resulting edit is one undo step; the awaited interaction is not claimed to be atomic

---

### Group 3.2: Registry behaviour

#### Task 3.2.1: Registration, precedence and conflicts

| Field | Value |
|-------|-------|
| Status | `[ ]` Not Started |
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
- [ ] A consumer plugin overriding a built-in command id wins, with a warning naming both
- [ ] Two plugins binding one key resolve by order, with a warning
- [ ] A raw extension using an explicit precedence override escapes the model, and that is
      documented rather than silently surprising
- [ ] A unit test asserts the shipped default preset has no internal conflict

---

#### Task 3.2.2: Reactive plugins with validate-before-apply

| Field | Value |
|-------|-------|
| Status | `[ ]` Not Started |
| Assigned | frontend-developer |
| Complexity | high |
| Dependencies | 3.2.1 |

**Description:**
Changing `plugins` reconfigures toolbar, commands, keymap, construct policy and extensions in place,
preserving document, undo history and cursor. Build and validate the replacement configuration
*before* dispatching: a failed reconfiguration would otherwise leave a dead editor holding the
user's document.

**Acceptance Criteria:**
- [ ] Adding a plugin to a mounted editor updates the toolbar with no loss of document, history or
      cursor
- [ ] An invalid configuration keeps the previous one and reports the failure
- [ ] Documentation warns that plugin instances should be created once, not inline in a template

---

#### Task 3.2.3: Failure containment and the imperative API

| Field | Value |
|-------|-------|
| Status | `[ ]` Not Started |
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
- [ ] A throwing command reports through the hook and the editor stays usable
- [ ] Running a command by id from the host produces the same edit as its toolbar button
- [ ] CodeMirror types the public API mentions are re-exported, so a consumer never resolves
      CodeMirror itself

---

#### Task 3.2.4: Plugin system test suite

| Field | Value |
|-------|-------|
| Status | `[ ]` Not Started |
| Assigned | testing-specialist |
| Complexity | high |
| Dependencies | 3.2.3 |

**Description:**
Cover the registry's contract: precedence, conflicts, override, reactivity with state preservation,
invalid configuration rollback, failure containment, and API version rejection. These are the
behaviours a third-party plugin author depends on, so they are the ones that must not regress
quietly.

**Acceptance Criteria:**
- [ ] Each behaviour above has a test that fails when the behaviour is removed
- [ ] Tests run in the jsdom project where possible, browser project where layout is involved

# Phase 01: Package Scaffold and Editor Foundation

## Overview

Create the package with its exports, entries and dependency policy correct from the first commit,
and get a CodeMirror editor mounting inside a Vue component with the value contract and mode switch
working. The packaging details here are the ones that are expensive to retrofit: subpath entries,
the CodeMirror re-export, the CSP nonce, and the SSR shell.

## Status

| Status      | Count |
| ----------- | ----- |
| Complete    | 0     |
| In Progress | 0     |
| Not Started | 7     |
| Blocked     | 0     |
| Deferred    | 0     |

**Progress:** 0/7 tasks complete

## Agent Assignments

| Agent                                    | Focus Area                        | Tasks         |
| ---------------------------------------- | --------------------------------- | ------------- |
| web-developer-tools:full-stack-developer | Package setup, build, exports     | 1.1.1 – 1.1.3 |
| web-developer-tools:frontend-developer   | Component, value contract, modes  | 1.2.1 – 1.2.4 |

## Tasks

### Group 1.1: Package and build

#### Task 1.1.1: Scaffold the package

| Field | Value |
|-------|-------|
| Status | `[ ]` Not Started |
| Assigned | full-stack-developer |
| Complexity | medium |
| Dependencies | None |

**Description:**
`packages/clean-ui-editor` with clean-ui as a caret peer dependency **and** a `workspace:*` dev
dependency — a peer entry alone does not make pnpm link it or order the builds, and without the dev
entry type resolution falls back to a possibly-stale `dist`. CodeMirror packages are runtime
dependencies with caret ranges, not peers and not pinned. Externalize by rule, matching the policy
landing in clean-ui's build.

**Acceptance Criteria:**
- [ ] Builds in the workspace with clean-ui resolved from source, and type-checks clean
- [ ] `sideEffects` declared; no global `app.component()` install (it would put CodeMirror in every
      consumer's main bundle)
- [ ] The no-undeclared-imports assertion passes against the built output

---

#### Task 1.1.2: Subpath entries and the CodeMirror re-export

| Field | Value |
|-------|-------|
| Status | `[ ]` Not Started |
| Assigned | full-stack-developer |
| Complexity | medium |
| Dependencies | 1.1.1 |

**Description:**
Three entries: the barrel, `/render`, and `/codemirror`. Each needs its own build entry — a module
unreachable from the barrel is never emitted, which is exactly the lesson recorded in clean-ui's
build config for its lazy icon module. `/codemirror` re-exports the CodeMirror surface a raw-tier
plugin needs plus its types, so plugin authors never install CodeMirror themselves and a single
instance is the default. Declare types per subpath, with a fallback for consumers whose module
resolution predates exports maps.

**Acceptance Criteria:**
- [ ] All three entries resolve from a packed tarball, with working types for each
- [ ] Importing the barrel pulls in neither the renderer nor the sanitiser
- [ ] A plugin importing from `/codemirror` shares the editor's instance

---

#### Task 1.1.3: Single-instance detection

| Field | Value |
|-------|-------|
| Status | `[ ]` Not Started |
| Assigned | full-stack-developer |
| Complexity | medium |
| Dependencies | 1.1.2 |

**Description:**
Two copies of CodeMirror's state package break `instanceof` checks and surface as an unrecognised
extension error that reads like a bug in the consumer's own code. Stamp identity on a versioned
global at first construction, warn when a second differs, and translate that specific error into a
message naming the fix — dedupe configuration or a matching range.

**Acceptance Criteria:**
- [ ] A simulated duplicate produces one actionable warning
- [ ] The upstream error message is caught and re-explained rather than propagating raw
- [ ] Single-instance usage is silent

---

### Group 1.2: Editor component

#### Task 1.2.1: Mount CodeMirror in a Vue component

| Field | Value |
|-------|-------|
| Status | `[ ]` Not Started |
| Assigned | frontend-developer |
| Complexity | high |
| Dependencies | 1.1.1 |

**Description:**
`CuiMarkdownEditor` mounting an editor view with the markdown language built from
`@lezer/markdown` with GFM (not `@codemirror/lang-markdown` — see the overview's decisions), plus
history and the default keymap. Include the `cspNonce` prop applied at construction: CodeMirror
injects styles at runtime, the nonce cannot be added afterwards, and both intended consumers run
content-security policies.

**Acceptance Criteria:**
- [ ] Editor mounts, accepts input, and is destroyed cleanly on unmount
- [ ] The GFM constructs parse (verified against a document containing each)
- [ ] With a strict style policy and a supplied nonce the editor renders styled; without one the
      failure is documented rather than mysterious
- [ ] No CodeMirror type appears in the barrel's declaration output

---

#### Task 1.2.2: Value contract

| Field | Value |
|-------|-------|
| Status | `[ ]` Not Started |
| Assigned | frontend-developer |
| Complexity | high |
| Dependencies | 1.2.1 |

**Description:**
`v-model` over a markdown string, with a throttle option and — the part that matters — echo
suppression: an incoming value equal to the current document must be a no-op. A host that
round-trips the throttled value back will otherwise reset the cursor mid-typing, which is the
failure mode most Vue CodeMirror wrappers have shipped at least once.

**Acceptance Criteria:**
- [ ] Content the user did not edit is never rewritten, including unknown syntax, HTML blocks and
      frontmatter — verified byte for byte
- [ ] Typing continuously while the host echoes a throttled value never moves the cursor or drops
      characters
- [ ] External value changes that genuinely differ do replace the document

---

#### Task 1.2.3: Mode switching

| Field | Value |
|-------|-------|
| Status | `[ ]` Not Started |
| Assigned | frontend-developer |
| Complexity | medium |
| Dependencies | 1.2.1 |

**Description:**
`v-model:mode` over `wysiwyg` and `source`, implemented as one compartment reconfiguration rather
than two editors. Includes the toolbar's built-in toggle and the prop to suppress it.

**Acceptance Criteria:**
- [ ] Switching both ways preserves document, cursor, selection and undo history — verified by
      undoing across a switch
- [ ] Source mode shows raw markdown with nothing hidden
- [ ] The mode change is announced to assistive technology

---

#### Task 1.2.4: SSR shell

| Field | Value |
|-------|-------|
| Status | `[ ]` Not Started |
| Assigned | frontend-developer |
| Complexity | medium |
| Dependencies | 1.2.1 |

**Description:**
Render a stable, correctly-sized shell on the server with no DOM access, hydrating into the editor
without layout shift. The shell's dimensions must come from this package's own stylesheet, because
CodeMirror's styles are injected at runtime and are therefore absent during server rendering.

**Acceptance Criteria:**
- [ ] Server rendering performs no DOM access, asserted in the node test project
- [ ] Hydration produces no warnings and no visible shift
- [ ] The shell reserves the same height the mounted editor occupies

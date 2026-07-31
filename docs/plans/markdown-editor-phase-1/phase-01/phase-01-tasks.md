# Phase 01: Package Scaffold and Editor Foundation

## Overview

Create the package with its exports, entries and dependency policy correct from the first commit,
and get a CodeMirror editor mounting inside a Vue component with the value contract and mode switch
working. The packaging details here are the ones that are expensive to retrofit: subpath entries,
the CodeMirror re-export, the CSP nonce, and the SSR shell.

## Status

| Status      | Count |
| ----------- | ----- |
| Complete    | 7     |
| In Progress | 0     |
| Not Started | 0     |
| Blocked     | 0     |
| Deferred    | 0     |

**Progress:** 7/7 tasks complete

## Agent Assignments

| Agent                                    | Focus Area                        | Tasks         |
| ----------------------------------------- | ---------------------------------- | ------------- |
| web-developer-tools:full-stack-developer | Package setup, build, exports     | 1.1.1 – 1.1.3 |
| web-developer-tools:frontend-developer   | Component, value contract, modes  | 1.2.1 – 1.2.4 |

## Tasks

### Group 1.1: Package and build

#### Task 1.1.1: Scaffold the package

| Field | Value |
|-------|-------|
| Status | `[X]` Complete |
| Assigned | full-stack-developer |
| Complexity | medium |
| Dependencies | None |

**Acceptance Criteria:**
- [x] Builds in the workspace with clean-ui resolved from source, and type-checks clean
- [x] `sideEffects` declared; no global `app.component()` install (it would put CodeMirror in every
      consumer's main bundle)
- [x] The no-undeclared-imports assertion passes against the built output

---

#### Task 1.1.2: Subpath entries and the CodeMirror re-export

| Field | Value |
|-------|-------|
| Status | `[X]` Complete |
| Assigned | full-stack-developer |
| Complexity | medium |
| Dependencies | 1.1.1 |

**Acceptance Criteria:**
- [x] All three entries resolve from a packed tarball, with working types for each
- [x] Importing the barrel pulls in neither the renderer nor the sanitiser
- [x] A plugin importing from `/codemirror` shares the editor's instance

---

#### Task 1.1.3: Single-instance detection

| Field | Value |
|-------|-------|
| Status | `[X]` Complete |
| Assigned | full-stack-developer |
| Complexity | medium |
| Dependencies | 1.1.2 |

**Acceptance Criteria:**
- [x] A simulated duplicate produces one actionable warning
- [x] The upstream error message is caught and re-explained rather than propagating raw
- [x] Single-instance usage is silent

---

### Group 1.2: Editor component

#### Task 1.2.1: Mount CodeMirror in a Vue component

| Field | Value |
|-------|-------|
| Status | `[X]` Complete |
| Assigned | frontend-developer |
| Complexity | high |
| Dependencies | 1.1.1 |

**Acceptance Criteria:**
- [x] Editor mounts, accepts input, and is destroyed cleanly on unmount
- [x] The GFM constructs parse (verified against a document containing each)
- [x] With a strict style policy and a supplied nonce the editor renders styled; without one the
      failure is documented rather than mysterious
- [x] No CodeMirror type appears in the barrel's declaration output

---

#### Task 1.2.2: Value contract

| Field | Value |
|-------|-------|
| Status | `[X]` Complete |
| Assigned | frontend-developer |
| Complexity | high |
| Dependencies | 1.2.1 |

**Acceptance Criteria:**
- [x] Content the user did not edit is never rewritten, including unknown syntax, HTML blocks and
      frontmatter — verified byte for byte
- [x] Typing continuously while the host echoes a throttled value never moves the cursor or drops
      characters
- [x] External value changes that genuinely differ do replace the document

---

#### Task 1.2.3: Mode switching

| Field | Value |
|-------|-------|
| Status | `[X]` Complete |
| Assigned | frontend-developer |
| Complexity | medium |
| Dependencies | 1.2.1 |

**Acceptance Criteria:**
- [x] Switching both ways preserves document, cursor, selection and undo history — verified by
      undoing across a switch
- [x] Source mode shows raw markdown with nothing hidden
- [x] The mode change is announced to assistive technology

---

#### Task 1.2.4: SSR shell

| Field | Value |
|-------|-------|
| Status | `[X]` Complete |
| Assigned | frontend-developer |
| Complexity | medium |
| Dependencies | 1.2.1 |

**Acceptance Criteria:**
- [x] Server rendering performs no DOM access, asserted in the node test project
- [x] Hydration produces no warnings and no visible shift
- [x] The shell reserves the same height the mounted editor occupies

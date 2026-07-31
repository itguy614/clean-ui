# Phase 02: Build, Dependencies and Verification

## Overview

Make the build tolerate a package with a real dependency graph, and make the guarantees this
library advertises verifiable in a consumer build rather than asserted. Every requirement here
exists because something in this class already broke once: #42 shipped an icon barrel that
defeated tree-shaking, #62 shipped Tailwind utilities that overrode consumers' CSS. Neither was
caught here, because the docs app aliases the library to source.

## Status

| Status      | Count |
| ----------- | ----- |
| Complete    | 9     |
| In Progress | 0     |
| Not Started | 0     |
| Blocked     | 0     |
| Deferred    | 0     |

**Progress:** 9/9 tasks complete

## Agent Assignments

| Agent                                  | Focus Area                              | Tasks         |
| --------------------------------------- | ---------------------------------------- | ------------- |
| web-developer-tools:full-stack-developer | Build config, CI workflows, fixture app | 2.1.1 – 2.3.3 |
| developer-tools:testing-specialist     | Test environment projects               | 2.3.1, 2.3.2  |

## Tasks

### Group 2.1: Dependency policy

#### Task 2.1.1: Externalize by rule

| Field | Value |
|-------|-------|
| Status | `[X]` Complete |
| Assigned | full-stack-developer |
| Complexity | medium |
| Dependencies | None |

**Acceptance Criteria:**
- [x] Adding a dependency requires no change to the build config
- [x] Subpath imports of an external package are also externalized
- [x] The built output is byte-comparable to the current one for the existing dependency set

---

#### Task 2.1.2: Assert no undeclared imports in `dist`

| Field | Value |
|-------|-------|
| Status | `[X]` Complete |
| Assigned | full-stack-developer |
| Complexity | medium |
| Dependencies | 2.1.1 |

**Acceptance Criteria:**
- [x] Fails with a clear message when a dependency is imported but undeclared
- [x] Runs in CI for every publishable package
- [x] Passes on the current `dist`

---

#### Task 2.1.3: Audit `sideEffects`

| Field | Value |
|-------|-------|
| Status | `[X]` Complete |
| Assigned | full-stack-developer |
| Complexity | low |
| Dependencies | None |

**Acceptance Criteria:**
- [x] Declaration verified against every emitted module
- [x] The rule is documented alongside the platform requirements

---

### Group 2.2: Consumer fixture verification

#### Task 2.2.1: Fixture app and packing harness

| Field | Value |
|-------|-------|
| Status | `[X]` Complete |
| Assigned | full-stack-developer |
| Complexity | high |
| Dependencies | 2.1.1 |

**Acceptance Criteria:**
- [x] Job packs, installs with npm, and builds without workspace linkage
- [x] Failure messages identify which package and which assertion failed
- [x] Runs on pull requests, not only on release

---

#### Task 2.2.2: Guarantee assertions

| Field | Value |
|-------|-------|
| Status | `[X]` Complete |
| Assigned | full-stack-developer |
| Complexity | medium |
| Dependencies | 2.2.1 |

**Acceptance Criteria:**
- [x] Each assertion fails when its regression is deliberately reintroduced
- [x] Assertions are named so a failure reads as a broken promise, not a mystery
- [x] Extensible: adding a package adds its assertions without restructuring the job

---

#### Task 2.2.3: Committed size budgets

| Field | Value |
|-------|-------|
| Status | `[X]` Complete |
| Assigned | full-stack-developer |
| Complexity | medium |
| Dependencies | 2.2.1 |

**Acceptance Criteria:**
- [x] Budget file records a number per package entry with the date measured
- [x] A deliberate regression fails CI with both numbers in the message
- [x] The delta methodology is documented so future measurements are comparable

---

### Group 2.3: Test environments

#### Task 2.3.1: Node project for server-rendering assertions

| Field | Value |
|-------|-------|
| Status | `[X]` Complete |
| Assigned | testing-specialist |
| Complexity | medium |
| Dependencies | None |

**Acceptance Criteria:**
- [x] A component touching the DOM during setup fails this project
- [x] Existing jsdom tests are unaffected
- [x] Both projects run in the standard test command

---

#### Task 2.3.2: Browser runner for layout and input behaviour

| Field | Value |
|-------|-------|
| Status | `[X]` Complete |
| Assigned | testing-specialist |
| Complexity | high |
| Dependencies | None |

**Acceptance Criteria:**
- [x] Runner executes against a built app in CI
- [x] At least one existing layout-dependent behaviour is covered as a proving case
- [x] Documented how to run it locally and how to triage a failure

---

#### Task 2.3.3: Shared alias module and jsdom polyfills

| Field | Value |
|-------|-------|
| Status | `[X]` Complete |
| Assigned | full-stack-developer |
| Complexity | low |
| Dependencies | None |

**Acceptance Criteria:**
- [x] One module owns resolution policy; docs apps and test setups import it
- [x] A DOM-measuring component mounts in the jsdom project
- [x] `CONTRIBUTING.md`'s stale claim that docs consume the built library is corrected

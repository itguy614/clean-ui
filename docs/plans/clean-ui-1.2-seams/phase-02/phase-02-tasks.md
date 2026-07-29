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
| Complete    | 0     |
| In Progress | 0     |
| Not Started | 9     |
| Blocked     | 0     |
| Deferred    | 0     |

**Progress:** 0/9 tasks complete

## Agent Assignments

| Agent                                  | Focus Area                              | Tasks         |
| -------------------------------------- | --------------------------------------- | ------------- |
| web-developer-tools:full-stack-developer | Build config, CI workflows, fixture app | 2.1.1 – 2.3.3 |
| developer-tools:testing-specialist     | Test environment projects               | 2.3.1, 2.3.2  |

## Tasks

### Group 2.1: Dependency policy

#### Task 2.1.1: Externalize by rule

| Field | Value |
|-------|-------|
| Status | `[ ]` Not Started |
| Assigned | full-stack-developer |
| Complexity | medium |
| Dependencies | None |

**Description:**
`packages/clean-ui/vite.config.ts` externalizes a hand-written list of four specifiers. Replace it
with a predicate derived from `dependencies` and `peerDependencies`, matched by prefix so subpath
imports are covered. A list works for two dependencies and silently inlines the third.

**Acceptance Criteria:**
- [ ] Adding a dependency requires no change to the build config
- [ ] Subpath imports of an external package are also externalized
- [ ] The built output is byte-comparable to the current one for the existing dependency set

---

#### Task 2.1.2: Assert no undeclared imports in `dist`

| Field | Value |
|-------|-------|
| Status | `[ ]` Not Started |
| Assigned | full-stack-developer |
| Complexity | medium |
| Dependencies | 2.1.1 |

**Description:**
A check over the built output asserting every bare import specifier is either relative or declared
in that package's `package.json`. This closes the whole class rather than the cases someone
remembered to list.

**Acceptance Criteria:**
- [ ] Fails with a clear message when a dependency is imported but undeclared
- [ ] Runs in CI for every publishable package
- [ ] Passes on the current `dist`

---

#### Task 2.1.3: Audit `sideEffects`

| Field | Value |
|-------|-------|
| Status | `[ ]` Not Started |
| Assigned | full-stack-developer |
| Complexity | low |
| Dependencies | None |

**Description:**
`sideEffects` currently lists CSS plus the lazy icon module. Confirm the declaration is accurate
for every emitted module and document the rule for satellites: any module whose import must not be
dropped needs listing, which is how the opt-in lazy icon entry works today.

**Acceptance Criteria:**
- [ ] Declaration verified against every emitted module
- [ ] The rule is documented alongside the platform requirements

---

### Group 2.2: Consumer fixture verification

#### Task 2.2.1: Fixture app and packing harness

| Field | Value |
|-------|-------|
| Status | `[ ]` Not Started |
| Assigned | full-stack-developer |
| Complexity | high |
| Dependencies | 2.1.1 |

**Description:**
A CI job that packs every publishable package with `pnpm pack`, installs the tarballs into a
throwaway Vite and Vue app using **npm** rather than the pnpm workspace — which is how the real
consumers install — and builds it. This is the only place the exports map, peer resolution and
published file list are exercised at all.

**Acceptance Criteria:**
- [ ] Job packs, installs with npm, and builds without workspace linkage
- [ ] Failure messages identify which package and which assertion failed
- [ ] Runs on pull requests, not only on release

---

#### Task 2.2.2: Guarantee assertions

| Field | Value |
|-------|-------|
| Status | `[ ]` Not Started |
| Assigned | full-stack-developer |
| Complexity | medium |
| Dependencies | 2.2.1 |

**Description:**
Express the package guarantees as assertions over the fixture's build output: no icon barrel
present (the #42 regression), no CSS utilities layer (the #62 regression), exactly one copy of
each single-instance dependency, and — once the editor exists — no renderer in the core entry
while the render subpath adds one.

**Acceptance Criteria:**
- [ ] Each assertion fails when its regression is deliberately reintroduced
- [ ] Assertions are named so a failure reads as a broken promise, not a mystery
- [ ] Extensible: adding a package adds its assertions without restructuring the job

---

#### Task 2.2.3: Committed size budgets

| Field | Value |
|-------|-------|
| Status | `[ ]` Not Started |
| Assigned | full-stack-developer |
| Complexity | medium |
| Dependencies | 2.2.1 |

**Description:**
Budgets in a committed file, measured as the gzip delta a consumer bundle grows by, with CI
failing on regression. `scripts/postbuild.mjs` measures this package's own `dist`, which is not
the metric any requirement actually cares about.

**Acceptance Criteria:**
- [ ] Budget file records a number per package entry with the date measured
- [ ] A deliberate regression fails CI with both numbers in the message
- [ ] The delta methodology is documented so future measurements are comparable

---

### Group 2.3: Test environments

#### Task 2.3.1: Node project for server-rendering assertions

| Field | Value |
|-------|-------|
| Status | `[ ]` Not Started |
| Assigned | testing-specialist |
| Complexity | medium |
| Dependencies | None |

**Description:**
"Renders without DOM access and hydrates cleanly" cannot be asserted from a jsdom environment,
where a DOM always exists. Add a second vitest project with the node environment that renders
components through the server renderer.

**Acceptance Criteria:**
- [ ] A component touching the DOM during setup fails this project
- [ ] Existing jsdom tests are unaffected
- [ ] Both projects run in the standard test command

---

#### Task 2.3.2: Browser runner for layout and input behaviour

| Field | Value |
|-------|-------|
| Status | `[ ]` Not Started |
| Assigned | testing-specialist |
| Complexity | high |
| Dependencies | None |

**Description:**
A real-browser runner for behaviour that depends on layout, selection or input method. Several
existing verifications in this repository have been done by hand-driving Chrome; this makes that
capability standing rather than ad hoc. Non-blocking in CI initially is acceptable; absent is not,
because these are the behaviours that regress silently.

**Acceptance Criteria:**
- [ ] Runner executes against a built app in CI
- [ ] At least one existing layout-dependent behaviour is covered as a proving case
- [ ] Documented how to run it locally and how to triage a failure

---

#### Task 2.3.3: Shared alias module and jsdom polyfills

| Field | Value |
|-------|-------|
| Status | `[ ]` Not Started |
| Assigned | full-stack-developer |
| Complexity | low |
| Dependencies | None |

**Description:**
Two things that will bite the moment a second docs app exists. Extract the alias list mapping
package names to workspace source into one shared module used by every docs app and test setup, so
two apps cannot disagree and load two copies of clean-ui. Separately, add the `Range` measurement
polyfills a DOM-dependent editor needs to mount under jsdom at all — without them the failure
looks like "this cannot be tested" rather than a missing stub.

**Acceptance Criteria:**
- [ ] One module owns resolution policy; docs apps and test setups import it
- [ ] A DOM-measuring component mounts in the jsdom project
- [ ] `CONTRIBUTING.md`'s stale claim that docs consume the built library is corrected

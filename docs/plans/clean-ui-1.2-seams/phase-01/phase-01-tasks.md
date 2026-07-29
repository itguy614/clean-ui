# Phase 01: API Seams

## Overview

Three additions to clean-ui's public API that a satellite package cannot work around, plus the
runtime guard that makes a duplicated clean-ui fail loudly instead of silently. All additive, so
1.2.0 is a minor.

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

| Agent                                  | Focus Area                          | Tasks         |
| -------------------------------------- | ----------------------------------- | ------------- |
| web-developer-tools:frontend-developer | Composables, types, message catalog | 1.1.1 – 1.3.2 |
| developer-tools:testing-specialist     | Unit tests for each seam            | 1.1.3, 1.2.3  |

## Tasks

### Group 1.1: Message namespace augmentation

#### Task 1.1.1: Open `CuiMessages` for augmentation

| Field | Value |
|-------|-------|
| Status | `[ ]` Not Started |
| Assigned | frontend-developer |
| Complexity | low |
| Dependencies | None |

**Description:**
`CuiMessages` in `packages/clean-ui/src/messages.ts` is a closed interface, and it is re-exported
from the barrel, so TypeScript module augmentation cannot merge into it from another package.
Introduce an empty `CuiMessageNamespaces` interface that `CuiMessages` extends, so a satellite
package can declare its own namespace and keep full type checking. `mergeMessages` already
passes unknown keys through at runtime, so this is a type-level change only.

**Acceptance Criteria:**
- [ ] A separate package can augment `CuiMessageNamespaces` and have its namespace type-check
      inside `CuiConfigProvider`'s messages prop
- [ ] Existing message keys keep their exact types; nothing becomes loosely typed
- [ ] `defaultMessages` and `mergeMessages` behaviour is unchanged

---

#### Task 1.1.2: Document the augmentation pattern

| Field | Value |
|-------|-------|
| Status | `[ ]` Not Started |
| Assigned | frontend-developer |
| Complexity | low |
| Dependencies | 1.1.1 |

**Description:**
Add the satellite-package recipe to the Localization docs page: the `declare module` block, where
to put it, and how the namespace then appears in the catalog. This is the page consumers already
use for message overrides.

**Acceptance Criteria:**
- [ ] Localization page shows a complete, copyable augmentation example
- [ ] The existing namespace list mentions that satellite packages may add their own

---

#### Task 1.1.3: Type-level test for the seam

| Field | Value |
|-------|-------|
| Status | `[ ]` Not Started |
| Assigned | testing-specialist |
| Complexity | medium |
| Dependencies | 1.1.1 |

**Description:**
A compile-time test asserting the augmentation works and that a wrong-shaped namespace is
rejected. Runtime tests cannot catch a regression here, since the failure mode is purely
type-level.

**Acceptance Criteria:**
- [ ] A fixture augmenting the interface type-checks under `vue-tsc`
- [ ] A deliberately wrong namespace shape fails the type check
- [ ] The check runs as part of the existing type-check step

---

### Group 1.2: Colour-scheme signal

#### Task 1.2.1: `useColorScheme` composable

| Field | Value |
|-------|-------|
| Status | `[ ]` Not Started |
| Assigned | frontend-developer |
| Complexity | medium |
| Dependencies | None |

**Description:**
clean-ui exposes no dark-mode state: `useTheme` handles presets only, and dark mode is a `.dark`
class on an arbitrary ancestor that can toggle at runtime and can be scoped to a subtree. Add a
composable returning a reactive `isDark` resolved from the nearest ancestor of the calling
component, observing class changes. Consumers such as CodeMirror need this because their own dark
flag is fixed when configuration is built, not read from the cascade.

**Acceptance Criteria:**
- [ ] Reports the scheme for the calling component's own ancestor chain, not the document
- [ ] Reacts to a class toggled on any ancestor, including a scoped subtree
- [ ] SSR-safe: no DOM access during server rendering, correct after hydration
- [ ] Observers are disconnected on unmount

---

#### Task 1.2.2: Adopt it in the library where dark mode is inferred

| Field | Value |
|-------|-------|
| Status | `[ ]` Not Started |
| Assigned | frontend-developer |
| Complexity | low |
| Dependencies | 1.2.1 |

**Description:**
Audit components that need to know the scheme in JavaScript rather than CSS, and route them
through the new composable so there is one implementation. Components that resolve dark mode
purely in CSS are left alone — this is not a refactor of the token system.

**Acceptance Criteria:**
- [ ] No component hand-rolls a `.dark` class observer
- [ ] No visual change in either mode, verified in the docs site

---

#### Task 1.2.3: Tests for scoped and toggled dark mode

| Field | Value |
|-------|-------|
| Status | `[ ]` Not Started |
| Assigned | testing-specialist |
| Complexity | medium |
| Dependencies | 1.2.1 |

**Description:**
Cover the cases that make a global boolean wrong: a scoped subtree, a toggle after mount, and
nested scopes disagreeing.

**Acceptance Criteria:**
- [ ] Two components in differently-scoped subtrees report different values
- [ ] Toggling a class after mount updates subscribers
- [ ] Unmounting removes the observer

---

### Group 1.3: Version export and duplicate detection

#### Task 1.3.1: Export `version`

| Field | Value |
|-------|-------|
| Status | `[ ]` Not Started |
| Assigned | frontend-developer |
| Complexity | low |
| Dependencies | None |

**Description:**
The package exports no version, so a satellite cannot detect a mismatch against its peer range.
Export a `version` constant, sourced from `package.json` at build time so it cannot drift.

**Acceptance Criteria:**
- [ ] `version` is exported from the barrel and matches `package.json` exactly
- [ ] The value is inlined at build time, not read from the filesystem at runtime
- [ ] A test fails if the two disagree

---

#### Task 1.3.2: Warn on a duplicated clean-ui instance

| Field | Value |
|-------|-------|
| Status | `[ ]` Not Started |
| Assigned | frontend-developer |
| Complexity | medium |
| Dependencies | 1.3.1 |

**Description:**
Every seam a satellite uses is a module-scope singleton — injection keys, the icon registry,
density state. Two copies in a consumer tree make form binding, messages and icons fail
*silently*: no error, just a missing label and a placeholder glyph. Stamp identity on a versioned
global on first use and emit a one-time developer warning when a second, different instance
appears, naming the versions and the likely cause.

**Acceptance Criteria:**
- [ ] A simulated second instance produces one warning naming both versions
- [ ] The warning suggests the concrete fix (dedupe or a matching peer range)
- [ ] Single-instance usage is silent, and the check costs nothing measurable

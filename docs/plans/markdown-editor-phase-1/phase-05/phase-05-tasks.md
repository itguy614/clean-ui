# Phase 05: Form Integration, Limits and Messages

## Overview

Make the editor a form control that behaves like every other clean-ui control, and localise it
through the library's catalog. The length limit is the one place copying `CuiTextarea` would be
wrong, because truncating markdown corrupts it.

## Status

| Status      | Count |
| ----------- | ----- |
| Complete    | 0     |
| In Progress | 0     |
| Not Started | 5     |
| Blocked     | 0     |
| Deferred    | 0     |

**Progress:** 0/5 tasks complete

## Agent Assignments

| Agent                                  | Focus Area                   | Tasks         |
| -------------------------------------- | ---------------------------- | ------------- |
| web-developer-tools:frontend-developer | Form control, limits, i18n   | 5.1.1 – 5.2.2 |
| developer-tools:testing-specialist     | Form parity coverage         | 5.1.3         |

## Tasks

### Group 5.1: Form control

#### Task 5.1.1: Compose `FormControlProps`

| Field | Value |
|-------|-------|
| Status | `[ ]` Not Started |
| Assigned | frontend-developer |
| Complexity | medium |
| Dependencies | Phase 01 |

**Description:**
Label, description, error, error message, required, readonly and disabled, following the library's
error convention — the wrapper's own border recoloured with the message below — plus `aria-invalid`.
Note the boundary discovered during review: `required` is presentational throughout clean-ui, since
`CuiForm` validates only through a resolver and has no field registration. Do not build a private
validation path here to fake it.

**Acceptance Criteria:**
- [ ] Label, description and error render identically to a sibling `CuiTextarea`
- [ ] `required` renders the indicator and sets `aria-required`
- [ ] `readonly` allows selection but not editing; `disabled` removes it from the tab order
- [ ] A resolver error for the field renders on the editor

---

#### Task 5.1.2: Placeholder and empty state

| Field | Value |
|-------|-------|
| Status | `[ ]` Not Started |
| Assigned | frontend-developer |
| Complexity | low |
| Dependencies | 5.1.1 |

**Description:**
A `placeholder` prop for the empty state, matching `CuiInput` and `CuiTextarea`. Small, and its
absence would be noticed immediately by anyone dropping the editor into an existing form.

**Acceptance Criteria:**
- [ ] Placeholder shows only when the document is empty
- [ ] It is not selectable and never becomes part of the value
- [ ] Styled with the same token as sibling controls

---

#### Task 5.1.3: Form parity tests

| Field | Value |
|-------|-------|
| Status | `[ ]` Not Started |
| Assigned | testing-specialist |
| Complexity | medium |
| Dependencies | 5.1.1 |

**Description:**
Assert parity with a sibling control rather than asserting the editor's own markup: same label
association, same error presentation, same resolver behaviour. Parity is the actual requirement, and
it survives refactors that a markup snapshot would not.

**Acceptance Criteria:**
- [ ] A form containing both an editor and a textarea presents both identically
- [ ] These assertions run in the jsdom project, and are the documented jsdom-safe set for consumers

---

### Group 5.2: Limits and localisation

#### Task 5.2.1: `maxLength` that refuses rather than truncates

| Field | Value |
|-------|-------|
| Status | `[ ]` Not Started |
| Assigned | frontend-developer |
| Complexity | medium |
| Dependencies | 5.1.1 |

**Description:**
Count markdown source characters, since that is what a storage column holds, and show a counter as
`CuiTextarea` does. Reject the edit that would exceed the limit instead of truncating: cutting at a
character boundary can split a link or open a code fence and corrupt everything after it. An
oversized paste is refused with the overage stated.

**Acceptance Criteria:**
- [ ] Typing stops at the limit; the counter shows the error state
- [ ] An oversized paste is refused with a message naming the overage, and inserts nothing
- [ ] No document is ever left with a split construct or an opened fence
- [ ] Documentation states the limit is client-side only and storage must be validated server-side

---

#### Task 5.2.2: Message namespace

| Field | Value |
|-------|-------|
| Status | `[ ]` Not Started |
| Assigned | frontend-developer |
| Complexity | medium |
| Dependencies | clean-ui 1.2.0 |

**Description:**
Every user-visible string — toolbar labels, dialog fields, refusal messages, the mode toggle, slash
menu entries, counter text — resolves through clean-ui's catalog under this package's namespace,
declared via the augmentation seam so it is typed rather than loose.

**Acceptance Criteria:**
- [ ] No user-visible string is hardcoded in a component
- [ ] A consumer overrides any string through a custom catalog, with type checking
- [ ] The namespace appears in the Localization documentation

# Phase 07: Documentation Site

## Overview

`apps/editor-docs`, the editor's own documentation site and its first real consumer. Dogfooding is the
point: if the plugin guide's examples are not the library's own source, the plugin API is not being
tested by its own documentation.

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

| Agent                                    | Focus Area                | Tasks         |
| ---------------------------------------- | ------------------------- | ------------- |
| web-developer-tools:frontend-developer   | Docs app and examples     | 7.1.1 – 7.2.2 |
| developer-tools:documentation-expert     | Plugin authoring guide    | 7.2.1         |

## Tasks

### Group 7.1: Site and examples

#### Task 7.1.1: Scaffold the docs app

| Field | Value |
|-------|-------|
| Status | `[ ]` Not Started |
| Assigned | frontend-developer |
| Complexity | medium |
| Dependencies | Phase 01 |

**Description:**
A second docs app resolving clean-ui and the editor through the **shared alias module** from the
platform work — if this app resolves clean-ui differently from the existing docs site, two copies load
and every duplicate-instance symptom appears in our own documentation. Built with its own base path so
the composed Pages artifact can host both.

**Acceptance Criteria:**
- [ ] Uses the shared alias module; no local alias list
- [ ] Builds with a base path and deep links work from the composed artifact
- [ ] Theme switcher, dark mode and density controls work as on the main site

---

#### Task 7.1.2: Component reference and live examples

| Field | Value |
|-------|-------|
| Status | `[ ]` Not Started |
| Assigned | frontend-developer |
| Complexity | medium |
| Dependencies | 7.1.1, Phase 05 |

**Description:**
Every prop, event, slot and command id documented, with live examples: default editor, mode switching,
a form-integrated editor beside a `CuiTextarea` for parity, a length-limited editor, a custom toolbar
subset, and an editor with a construct excluded so the policy is demonstrable rather than described.

**Acceptance Criteria:**
- [ ] Reference tables cover the full public API with no omissions
- [ ] Each example is interactive and shows its source
- [ ] The form example visibly demonstrates parity with a sibling control

---

#### Task 7.1.3: Accessibility and mobile demonstration

| Field | Value |
|-------|-------|
| Status | `[ ]` Not Started |
| Assigned | frontend-developer |
| Complexity | low |
| Dependencies | 7.1.2 |

**Description:**
A page stating the accessibility characteristics honestly, including the one that surprises people: in
WYSIWYG mode a screen reader reads the markdown markers, because hiding is visual only and nothing is
concealed from assistive technology. Plus a width-adjustable demo showing toolbar overflow and the
touch reveal granularity.

**Acceptance Criteria:**
- [ ] The screen-reader behaviour is documented as a deliberate characteristic, not omitted
- [ ] Keyboard shortcuts are listed in full
- [ ] The narrow-viewport demo shows the toolbar scrolling rather than clipping

---

### Group 7.2: Guides

#### Task 7.2.1: Plugin authoring guide

| Field | Value |
|-------|-------|
| Status | `[ ]` Not Started |
| Assigned | documentation-expert |
| Complexity | medium |
| Dependencies | Phase 03, Phase 04 |

**Description:**
The declarative tier first, with the timestamp plugin as the worked example, then the raw tier with its
stability caveat stated plainly: the declarative tier is protected across majors, while raw extensions
track the CodeMirror major they were built against and may break in a minor. Show that CodeMirror comes
from this package's subpath, and why. Include the conflict and precedence rules, since a plugin author
hitting them without documentation will assume a bug.

**Acceptance Criteria:**
- [ ] A reader can write a working plugin from the guide alone
- [ ] Both tiers documented with the stability difference explicit
- [ ] The examples are the library's own built-in plugins, not parallel inventions
- [ ] Precedence, conflict warnings and the API version check are explained

---

#### Task 7.2.2: Integration and testing guide

| Field | Value |
|-------|-------|
| Status | `[ ]` Not Started |
| Assigned | frontend-developer |
| Complexity | medium |
| Dependencies | 7.1.2, Phase 06 |

**Description:**
What an integrator needs that is not a prop: installing with the right peer versions, the CSP nonce for
a policy-enforcing app, server rendering, choosing a render adapter or supplying their own, the
documented test contract with its jsdom-safe and browser-only split, and the bundle cost with the
figure that justifies not shipping a renderer in core.

**Acceptance Criteria:**
- [ ] Covers install, CSP, SSR, rendering choice, testing and bundle cost
- [ ] The test contract lists the stable hooks and which assertions hold in jsdom
- [ ] A Laravel-style and a Tauri-style note each cover their specific concern

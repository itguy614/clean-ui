# Phase 02: Reveal Layer and Theming

## Overview

The product. Markers hide until the caret enters, granularity follows input type, composition is
never disturbed, and everything is styled from clean-ui tokens including CodeMirror's own chrome.
The prototype proved this approach works; these tasks turn it into code with tests, and pay off the
verification debt the spike left.

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

| Agent                                  | Focus Area                    | Tasks         |
| -------------------------------------- | ----------------------------- | ------------- |
| web-developer-tools:frontend-developer | Decorations, theming          | 2.1.1 – 2.2.2 |
| developer-tools:testing-specialist     | Browser-level verification    | 2.3.1, 2.3.2  |

## Tasks

### Group 2.1: Decoration layer

#### Task 2.1.1: Marker hiding and reveal on caret entry

| Field | Value |
|-------|-------|
| Status | `[ ]` Not Started |
| Assigned | frontend-developer |
| Complexity | high |
| Dependencies | Phase 01 |

**Description:**
Walk the syntax tree over visible ranges, style each supported construct, and hide its marker
children unless the selection is inside. Hiding must use a mark decoration with zero-size styling,
**not** `Decoration.replace()`, which removes characters from the DOM and therefore from the
accessibility tree. Recompute on document, selection and viewport changes — and on a granularity
change, which sets none of those flags and was the bug the prototype caught.

**Acceptance Criteria:**
- [ ] For emphasis, strong, inline code, heading, link and strikethrough: markers hidden with the
      caret away, revealed on entry, text unchanged throughout
- [ ] The full markdown including markers is present in the accessibility tree
- [ ] Switching granularity alone re-renders decorations
- [ ] Decoration work stays within the viewport on a 10,000-line document

---

#### Task 2.1.2: Granularity and input-type detection

| Field | Value |
|-------|-------|
| Status | `[ ]` Not Started |
| Assigned | frontend-developer |
| Complexity | medium |
| Dependencies | 2.1.1 |

**Description:**
Construct granularity for pointer input, whole-line for touch, following the most recent input type
so hybrid devices behave sensibly. Line granularity exists because landing a caret between two
asterisks with a fingertip is not a reasonable requirement.

**Acceptance Criteria:**
- [ ] Line granularity reveals every marker on the caret's line; construct granularity reveals only
      the containing construct
- [ ] A touch-type pointer event switches granularity; a mouse event switches it back
- [ ] Granularity is inspectable for tests without exposing internals as public API

---

#### Task 2.1.3: Composition guard

| Field | Value |
|-------|-------|
| Status | `[ ]` Not Started |
| Assigned | frontend-developer |
| Complexity | medium |
| Dependencies | 2.1.1 |

**Description:**
Suspend decoration recalculation while an IME composition is active. Changing the DOM under a
composition can displace the candidate window or abort composition, which would make the editor
unusable for a whole class of users. Resume and recompute once composition ends.

**Acceptance Criteria:**
- [ ] No decoration update occurs between composition start and end
- [ ] Composed text lands intact and decorations are correct immediately after
- [ ] Covered by a browser-level test driving the real composition path

---

### Group 2.2: Theming

#### Task 2.2.1: Editor chrome and syntax colours from tokens

| Field | Value |
|-------|-------|
| Status | `[ ]` Not Started |
| Assigned | frontend-developer |
| Complexity | medium |
| Dependencies | Phase 01 |

**Description:**
Build the editor theme and the syntax highlight style from `--cui-*` tokens. CodeMirror's language
package ships its own palette, which is easy to wire up unchanged and violates the
no-hardcoded-colours rule invisibly until a theme switch or contrast audit exposes it. Respect the
density scale for padding.

**Acceptance Criteria:**
- [ ] No colour literal in the package's source or emitted CSS
- [ ] Highlight tokens pass the contrast audit in light and dark across all themes
- [ ] Density classes change spacing but never type size

---

#### Task 2.2.2: Dark mode through the colour-scheme signal

| Field | Value |
|-------|-------|
| Status | `[ ]` Not Started |
| Assigned | frontend-developer |
| Complexity | medium |
| Dependencies | 2.2.1, clean-ui 1.2.0 |

**Description:**
Tokens alone are not sufficient: CodeMirror picks its base-theme dark rules from a flag fixed when
configuration is built, while clean-ui's dark mode is a runtime class on an arbitrary ancestor.
Drive that flag from clean-ui's colour-scheme signal through a compartment, or the caret and
selection layers stay light with no obvious cause.

**Acceptance Criteria:**
- [ ] Toggling the class at runtime updates caret, selection layer and syntax colours without a
      remount
- [ ] A dark class scoped to a subtree affects only an editor inside it
- [ ] Verified in a real browser, since this is invisible to jsdom

---

### Group 2.3: Verification debt from the spike

#### Task 2.3.1: Touch behaviour on a physical device

| Field | Value |
|-------|-------|
| Status | `[ ]` Not Started |
| Assigned | testing-specialist |
| Complexity | medium |
| Dependencies | 2.1.2 |

**Description:**
The prototype synthesised touch events; selection handles, caret placement by tap and the on-screen
keyboard were never exercised. Run the reveal model on a real phone and record what breaks. This is
the requirement's own motivation — the touch model exists because of a mobile audit — so it cannot
rest on synthesised events.

**Acceptance Criteria:**
- [ ] Tap-to-place-caret reveals the expected line on iOS and Android
- [ ] Selection handles can extend a selection across a hidden marker without surprises
- [ ] The on-screen keyboard does not obscure or displace the editor's own chrome
- [ ] Findings recorded, with anything unfixable stated as a known limitation

---

#### Task 2.3.2: Screen reader pass

| Field | Value |
|-------|-------|
| Status | `[ ]` Not Started |
| Assigned | testing-specialist |
| Complexity | medium |
| Dependencies | 2.1.1 |

**Description:**
The accessibility gate proved the markdown is exposed in the tree; nobody has heard it. Read a
representative document with a screen reader and confirm the experience is coherent rather than
merely present — marker noise is expected and accepted by the spec, but it should not be
misleading.

**Acceptance Criteria:**
- [ ] A document with headings, emphasis, code and links read end to end on at least one screen
      reader
- [ ] Caret navigation traverses exactly the characters announced
- [ ] Any surprise is either fixed or documented as a known characteristic of the model

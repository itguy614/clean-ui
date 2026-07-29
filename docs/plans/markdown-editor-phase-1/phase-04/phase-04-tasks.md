# Phase 04: Built-in Plugins, Slash Menu and Paste

## Overview

Every formatting action written as an ordinary plugin against the Phase 03 API, shipped as presets.
This phase is where the plugin tier gets proven or found wanting: if any action needs privileged
access, Phase 03 is incomplete and comes back rather than the built-in getting a special case.

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

| Agent                                  | Focus Area                      | Tasks         |
| -------------------------------------- | ------------------------------- | ------------- |
| web-developer-tools:frontend-developer | Plugins, toolbar, dialogs       | 4.1.1 – 4.3.2 |
| developer-tools:testing-specialist     | Policy and paste coverage       | 4.3.3         |

## Tasks

### Group 4.1: Formatting plugins and toolbar

#### Task 4.1.1: Inline and block formatting plugins

| Field | Value |
|-------|-------|
| Status | `[ ]` Not Started |
| Assigned | frontend-developer |
| Complexity | high |
| Dependencies | Phase 03 |

**Description:**
Bold, italic, strikethrough, inline code, headings one to three, bulleted list, numbered list, task
list, blockquote, code fence and horizontal rule — each a plugin declaring its command, toolbar
entry, keybinding, construct and decoration rule. No table plugin: tables ship complete in phase 2,
and an insert button without cell navigation advertises an experience that is not there.

**Acceptance Criteria:**
- [ ] Each action applies, toggles off, and behaves with an empty, partial and multi-line selection
- [ ] Each is one undo step
- [ ] No action reaches inside the editor for anything the plugin API does not expose
- [ ] Icons used are registered by this package, so they render in a consumer app rather than
      falling back to a placeholder glyph

---

#### Task 4.1.2: Toolbar with config and slot

| Field | Value |
|-------|-------|
| Status | `[ ]` Not Started |
| Assigned | frontend-developer |
| Complexity | medium |
| Dependencies | 4.1.1 |

**Description:**
Default toolbar from the preset, a prop to subset and order by command id including plugin ids, and
a slot to replace it entirely. Built from clean-ui components, keyboard operable as one tab stop with
arrow navigation, and horizontally scrollable when it overflows rather than clipping — the failure
this library already fixed once in its tab bar.

**Acceptance Criteria:**
- [ ] Zero configuration yields the full default set; a subset yields exactly what was named
- [ ] One tab stop, arrow-key navigation, all controls at least 24px
- [ ] At 360px width the toolbar scrolls and every action stays reachable
- [ ] Pressed state reflects `isActive`

---

#### Task 4.1.3: Presets and composition

| Field | Value |
|-------|-------|
| Status | `[ ]` Not Started |
| Assigned | frontend-developer |
| Complexity | medium |
| Dependencies | 4.1.1 |

**Description:**
Export plugins individually and as presets, including the default used when `plugins` is not
supplied. Support composing a custom set, extending the default, and configuring a preset to omit
individual actions — the "I don't want italic" case that motivated the construct policy.

**Acceptance Criteria:**
- [ ] Zero-config, explicit list, extend-default and omit-one all work
- [ ] An app omitting a plugin does not ship it, verified in the fixture build
- [ ] Excluding italic removes button, shortcut, slash entry and command

---

### Group 4.2: List continuation and dialogs

#### Task 4.2.1: List typing ergonomics

| Field | Value |
|-------|-------|
| Status | `[ ]` Not Started |
| Assigned | frontend-developer |
| Complexity | medium |
| Dependencies | 4.1.1 |

**Description:**
Enter continues the item, Enter on an empty item exits, Tab and Shift-Tab indent and outdent, task
items continue unchecked, ordered lists renumber. Reuse `@codemirror/lang-markdown`'s continuation
commands, which the prototype measured as tree-shaking free of that package's HTML grammar for
2.3 kB — do not reimplement them, and do not import the whole language.

**Acceptance Criteria:**
- [ ] Each behaviour above verified for bulleted, ordered and task lists
- [ ] Nested lists indent and outdent to the right level
- [ ] The bundle assertion confirms no HTML grammar arrived with the commands

---

#### Task 4.2.2: Link and image dialogs

| Field | Value |
|-------|-------|
| Status | `[ ]` Not Started |
| Assigned | frontend-developer |
| Complexity | medium |
| Dependencies | 4.1.1, Phase 03 |

**Description:**
Dialogs built from clean-ui components, driven through the `collect` seam — their first real
consumer. A URL-looking selection pre-fills the URL; any other selection becomes the link label
rather than being discarded. URL schemes are allowlisted, since a `javascript:` URL in link syntax is
valid CommonMark and the likeliest real vulnerability in this feature. Mode switching is blocked
while a dialog is open.

**Acceptance Criteria:**
- [ ] Selecting text and inserting a link produces a labelled link, not a discarded selection
- [ ] A `javascript:` URL is refused with a clear message
- [ ] Cancelling changes nothing; confirming is one undo step
- [ ] Images are inserted by URL only — no upload affordance exists in v1

---

### Group 4.3: Slash menu, paste and policy

#### Task 4.3.1: Slash menu

| Field | Value |
|-------|-------|
| Status | `[ ]` Not Started |
| Assigned | frontend-developer |
| Complexity | high |
| Dependencies | 4.1.1 |

**Description:**
Typing `/` opens a filtered palette of insert commands built on CodeMirror's autocomplete, sourced
from plugin commands carrying a label and icon — so a plugin appears in both surfaces from one
declaration. Follows the combobox pattern for keyboard operation, and leaves the literal text when
dismissed.

**Acceptance Criteria:**
- [ ] Filtering, arrow navigation, Enter to run, Escape to dismiss leaving the typed text
- [ ] A third-party plugin command appears with no extra declaration
- [ ] An excluded construct's command does not appear
- [ ] Announced per the combobox pattern

---

#### Task 4.3.2: Paste conversion and construct policy

| Field | Value |
|-------|-------|
| Status | `[ ]` Not Started |
| Assigned | frontend-developer |
| Complexity | high |
| Dependencies | 4.1.1 |

**Description:**
HTML paste converts to markdown through the plugins' paste rules, honouring the loaded construct set
and degrading to the nearest available representation or plain text. The converter must never emit
raw HTML: an unrecognised element becomes text, so markup pasted from a hostile page cannot be
laundered into stored content. A modifier paste inserts plain text. Pasted image files are refused
with a localised message.

**Acceptance Criteria:**
- [ ] Pasting a rendered page preserves headings, emphasis, links, lists and a table
- [ ] With italic excluded, pasted emphasis arrives as plain text
- [ ] A script tag or unknown element yields text, never raw HTML, in the stored markdown
- [ ] An image file paste inserts nothing and explains why

---

#### Task 4.3.3: Policy and paste test suite

| Field | Value |
|-------|-------|
| Status | `[ ]` Not Started |
| Assigned | testing-specialist |
| Complexity | high |
| Dependencies | 4.3.2 |

**Description:**
The construct policy is the feature most likely to rot, because it spans four subsystems — commands,
slash menu, paste and decoration — and a gap in any one of them silently breaks the guarantee.
Cover each exclusion across all four.

**Acceptance Criteria:**
- [ ] For at least three excluded constructs, all four surfaces are verified absent
- [ ] Paste conversion tested against real clipboard HTML from a browser, not hand-written fixtures
- [ ] Hand-typed markers for an excluded construct stay unstyled literal text

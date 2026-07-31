# Phase 07: Documentation Site

## Overview

`apps/editor-docs`, the editor's own documentation site and its first real consumer. Dogfooding is the
point: if the plugin guide's examples are not the library's own source, the plugin API is not being
tested by its own documentation.

## Status

| Status      | Count |
| ----------- | ----- |
| Complete    | 5     |
| In Progress | 0     |
| Not Started | 0     |
| Blocked     | 0     |
| Deferred    | 0     |

**Progress:** 5/5 tasks complete

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
| Status | `[X]` Complete |
| Assigned | frontend-developer |
| Complexity | medium |
| Dependencies | Phase 01 |

**Description:**
A second docs app resolving clean-ui and the editor through the **shared alias module** from the
platform work — if this app resolves clean-ui differently from the existing docs site, two copies load
and every duplicate-instance symptom appears in our own documentation. Built with its own base path so
the composed Pages artifact can host both.

**Acceptance Criteria:**
- [X] Uses the shared alias module; no local alias list
- [X] Builds with a base path and deep links work from the composed artifact
- [X] Theme switcher, dark mode and density controls work as on the main site

**Note:** `apps/editor-docs`, mirroring `apps/docs`'s conventions file-for-file (App.vue shell,
Example/PropTable/EventTable, router, Tailwind + theme.css setup) rather than inventing a new
pattern. `vite.config.ts` uses `workspaceAliases()`/`workspaceVersionDefines()` from
`config/workspace-aliases.ts` — the platform work's shared alias module — which already anticipated
this exact package (its own comment names `clean-ui-editor` explicitly, and it guards with
`existsSync` so calling it before that package existed was always safe). Registered in
`config/docs-sites.mjs` as `{ dir: "apps/editor-docs", base: "/editor/" }` — the ONLY change
`scripts/build-docs-sites.mjs`/`.github/workflows/deploy-docs.yml` needed, since both were already
written generically against that config list. Verified: the composed build
(`node scripts/build-docs-sites.mjs`) produces the main site at the artifact root and this one at
`/editor/`, with the shared root `404.html` correctly dispatching a deep link into either. Real-browser
verification: theme switching, dark mode, and density controls all confirmed working (measured
`document.documentElement.className`/`.dark` class/header label changes after each), and the mobile
hamburger menu correctly opens a slideover containing the same nav, closing on navigation.

---

#### Task 7.1.2: Component reference and live examples

| Field | Value |
|-------|-------|
| Status | `[X]` Complete |
| Assigned | frontend-developer |
| Complexity | medium |
| Dependencies | 7.1.1, Phase 05 |

**Description:**
Every prop, event, slot and command id documented, with live examples: default editor, mode switching,
a form-integrated editor beside a `CuiTextarea` for parity, a length-limited editor, a custom toolbar
subset, and an editor with a construct excluded so the policy is demonstrable rather than described.

**Acceptance Criteria:**
- [X] Reference tables cover the full public API with no omissions
- [X] Each example is interactive and shows its source
- [X] The form example visibly demonstrates parity with a sibling control

**Note:** `apps/editor-docs/src/pages/EditorPage.vue` — all 16 props, all 6 events, the `#toolbar`
slot, all 7 exposed methods, and all 13 built-in commands (with their exact keymaps) tabulated. Six
live examples: default, mode switching (`v-model:mode` displayed live), a form-integrated
`CuiMarkdownEditor` beside a `CuiTextarea` inside the same `CuiForm`/`CuiFormField` wiring (submitting
empty shows the identical error on both, verified live in a real browser), a `maxLength`-limited
editor, a `:toolbar="['bold','italic','link']"` subset, and a construct-excluded editor
(`DEFAULT_PLUGINS.filter(p => p.id !== "cui-italic")`) with no italic button/keymap/slash-entry. All
six confirmed working end-to-end in a real browser, including toolbar button counts differing exactly
as documented (15/15/15/15/3/14 across the six editor instances on the page).

---

#### Task 7.1.3: Accessibility and mobile demonstration

| Field | Value |
|-------|-------|
| Status | `[X]` Complete |
| Assigned | frontend-developer |
| Complexity | low |
| Dependencies | 7.1.2 |

**Description:**
A page stating the accessibility characteristics honestly, including the one that surprises people: in
WYSIWYG mode a screen reader reads the markdown markers, because hiding is visual only and nothing is
concealed from assistive technology. Plus a width-adjustable demo showing toolbar overflow and the
touch reveal granularity.

**Acceptance Criteria:**
- [X] The screen-reader behaviour is documented as a deliberate characteristic, not omitted
- [X] Keyboard shortcuts are listed in full
- [X] The narrow-viewport demo shows the toolbar scrolling rather than clipping

**Note:** `apps/editor-docs/src/pages/AccessibilityPage.vue` leads with the marker-reveal-is-visual-only
characteristic explicitly (framed as "read this before filing it as a bug," not buried), explains why
it isn't also hidden from the accessibility tree (undermines the "document is markdown text" guarantee
for the users who rely on it most), documents the label-focus limitation inherent to every
contenteditable-based editor (found via real-browser testing back in Phase 05, referenced here rather
than re-discovered), states touch reveal granularity honestly as *not demonstrable in a desktop
browser tab* rather than faking it with a mouse-simulated example, and provides a live width-slider
demo. Real-browser verification: at the slider's default (320px) the toolbar already overflows its
container (743px content vs. 300px client width) and scrolls rather than clips; shrinking to the
minimum (240px) still scrolls, never clips, confirmed by measuring `scrollWidth` vs. `clientWidth`
directly rather than eyeballing a screenshot.

---

### Group 7.2: Guides

#### Task 7.2.1: Plugin authoring guide

| Field | Value |
|-------|-------|
| Status | `[X]` Complete |
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
- [X] A reader can write a working plugin from the guide alone
- [X] Both tiers documented with the stability difference explicit
- [X] The examples are the library's own built-in plugins, not parallel inventions
- [X] Precedence, conflict warnings and the API version check are explained

**Note:** `apps/editor-docs/src/pages/PluginAuthoringPage.vue` — the FR23 reference `timestamp`
plugin as the live, working declarative-tier example (toolbar button + `Mod-Shift-T` + slash-menu
entry, all from ~10 lines); `bold.ts`'s actual unmodified source quoted verbatim as the "built-in read
as an ordinary plugin" example (FR23's "not parallel inventions"); a raw-tier example highlighting a
plain word (`TODO`) via a CodeMirror `ViewPlugin` — something the declarative `decorations` field
(one syntax node name) genuinely cannot express, motivating the escape hatch honestly rather than by
assertion. **A real, load-bearing correction found while building the precedence example**: the guide
originally claimed a raw extension's `Prec.highest` could override a *declarative-tier* plugin's own
keymap entry (e.g. bold's `Mod-b`) — tried live in a real browser, and it silently did nothing. Traced
to `CuiMarkdownEditor.vue`'s `registryExtensions()`: the registry's own keymap is *already*
`Prec.highest`-wrapped and placed first in the extension array, so two same-tier `Prec.highest`
extensions resolve by array position, and the registry's own always wins. Verified what actually
*does* work instead — a raw extension overriding one of CodeMirror's own **base** keybindings (undo,
indentation, default editing — installed with no `Prec` wrapper at all) — and rewrote the example and
surrounding prose around that real boundary instead of the broken claim. This is exactly what the
task's own rationale warns about: a plugin author hitting this silently would assume a bug, so getting
it right (and documenting *why* the naive approach fails) mattered more here than anywhere else on the
page. Precedence/conflict resolution (later-plugin-wins for ids/commands/keymap, with warnings naming
both contributors) and the API version rejection are both explained against `registry.ts`'s actual
logic, not paraphrased from memory.

---

#### Task 7.2.2: Integration and testing guide

| Field | Value |
|-------|-------|
| Status | `[X]` Complete |
| Assigned | frontend-developer |
| Complexity | medium |
| Dependencies | 7.1.2, Phase 06 |

**Description:**
What an integrator needs that is not a prop: installing with the right peer versions, the CSP nonce for
a policy-enforcing app, server rendering, choosing a render adapter or supplying their own, the
documented test contract with its jsdom-safe and browser-only split, and the bundle cost with the
figure that justifies not shipping a renderer in core.

**Acceptance Criteria:**
- [X] Covers install, CSP, SSR, rendering choice, testing and bundle cost
- [X] The test contract lists the stable hooks and which assertions hold in jsdom
- [X] A Laravel-style and a Tauri-style note each cover their specific concern

**Note:** `apps/editor-docs/src/pages/IntegrationTestingPage.vue` + `InstallationPage.vue` (peers,
registration, stylesheet side effect, icons). CSP section demonstrated live with an actual
`cspNonce`-constructed editor on the page (confirms the prop applies with no runtime error, though
this site itself serves no strict `style-src` to show the visual difference — stated honestly rather
than faked). Rendering section covers both paths (bring-your-own adapter with a `marked`+`DOMPurify`
worked example; the supplied `/render` adapter) plus an explicit FR41 boundary callout (the trust
boundary — and `maxLength`/construct-policy being client-side-only — is the consumer's, not this
library's). Test contract table transcribed directly from this package's own actual test suite
(jsdom/node/real-browser split, naming the exact jsdom-vs-real-browser divergence found for the slash
menu). Bundle cost cites the real, currently-measured figures (~55 kB gzip against the 65 kB budget,
and the ~70 kB `@lezer/markdown`-vs-`@codemirror/lang-markdown` saving) rather than the original spike
numbers, and states `/render` is entirely outside that budget. Laravel note covers CSP nonce
generation/Blade meta-tag fallback; Tauri note covers the same CSP concern plus offline behavior
(no network dependency at runtime beyond fonts).

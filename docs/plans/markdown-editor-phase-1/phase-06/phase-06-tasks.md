# Phase 06: Render Subpath

## Overview

Rendering markdown to HTML for display, kept entirely out of the core entry. The editor never needs
it — live preview is decorations, not HTML — so the only reason it exists is that consumers displaying
saved content should not have to solve it twice.

The design deliberately avoids making this library the security boundary: the adapter is injectable so
an application supplies whatever it already uses, and the supplied implementation escapes raw HTML by
configuration rather than by sanitising.

## Status

| Status      | Count |
| ----------- | ----- |
| Complete    | 4     |
| In Progress | 0     |
| Not Started | 0     |
| Blocked     | 0     |
| Deferred    | 0     |

**Progress:** 4/4 tasks complete

## Agent Assignments

| Agent                                  | Focus Area                | Tasks         |
| -------------------------------------- | ------------------------- | ------------- |
| web-developer-tools:frontend-developer | Adapter, viewer           | 6.1.1 – 6.1.3 |
| developer-tools:testing-specialist     | Security coverage         | 6.1.4         |

## Tasks

### Group 6.1: Adapter and viewer

#### Task 6.1.1: The adapter contract

| Field | Value |
|-------|-------|
| Status | `[X]` Complete |
| Assigned | frontend-developer |
| Complexity | medium |
| Dependencies | Phase 01 |

**Description:**
A synchronous adapter type returning a value produced only by an explicit trust-marking helper, so the
type itself says the caller is asserting the HTML is safe to inject. Synchronous in v1: widening to
allow a promise later is additive, narrowing would be breaking. Document that phase 1.5's split
preview will consume this same contract.

**Acceptance Criteria:**
- [X] An adapter returning a plain string does not type-check; trust must be marked explicitly
- [X] The contract is documented with a worked example using a third-party renderer
- [X] Nothing in the core entry imports the adapter implementation

**Note:** `src/render/contract.ts` — `TrustedHtml` is a `string` branded with a `unique symbol` that
never leaves the module, so only `markAsTrustedHtml()` can produce one; a plain string assigned to
`MarkdownRenderAdapter`'s return type is a real type error, verified in `contract.test-d.ts` via
`@ts-expect-error` (checked by a new `tsconfig.typecheck.json`, mirroring clean-ui's own
`messages.test-d.ts` pattern). The doc comment carries a worked example using `marked` + `DOMPurify`.
Kept in its own file, separate from `supplied-adapter.ts` (the actual renderer) and re-exported from
BOTH the core barrel (contract only) and `/render` (contract + implementation) — documented so a
future core feature (phase 1.5's split preview) can depend on just the contract. Verified mechanically
against the real built output (task 6.1.3's own AC4 covers the isolation check itself).

---

#### Task 6.1.2: Viewer component

| Field | Value |
|-------|-------|
| Status | `[X]` Complete |
| Assigned | frontend-developer |
| Complexity | medium |
| Dependencies | 6.1.1 |

**Description:**
A viewer taking a markdown string and an adapter. It applies clean-ui's typography layer itself
rather than documenting that consumers should, and it catches an adapter that throws — falling back to
escaped source with a developer warning, never blanking and never propagating into the component tree.

**Acceptance Criteria:**
- [X] Rendered output inherits typography styling with no extra consumer setup
- [X] A throwing adapter yields escaped source plus one warning
- [X] Re-rendering on value change does not leak DOM or listeners

**Note:** `src/render/CuiMarkdownViewer.vue` — a plain `v-html` binding on a `computed` that
try/catches the adapter call; a throw logs one `console.warn` and falls back to the escaped source
(`white-space: pre-wrap` so the raw text stays readable). "Re-rendering doesn't leak DOM/listeners"
holds by construction — `v-html` is Vue's own reactive diffing, not manually-created DOM, so there is
nothing to leak; verified anyway with a test asserting no duplicate/stale nodes survive a value or
adapter change. Real-browser verification: typography CSS genuinely applies (h1 measured larger than
body text via `getComputedStyle`), and — the critical check — an escaped `<script>` block never
becomes a real `<script>` DOM element (`document.querySelectorAll("script")` count is 0), confirmed
against the actual rendered DOM, not just the HTML string.

---

#### Task 6.1.3: Supplied adapter at `/render`

| Field | Value |
|-------|-------|
| Status | `[X]` Complete |
| Assigned | frontend-developer |
| Complexity | medium |
| Dependencies | 6.1.1 |

**Description:**
A ready-made adapter for applications with no renderer of their own. It escapes raw HTML by
configuring the parser not to emit it, which needs no sanitiser and keeps the subpath free of any DOM
dependency so it also runs during server rendering. Allowing raw HTML requires the consumer to supply
their own sanitiser — this library does not bundle one. URL schemes are allowlisted.

**Acceptance Criteria:**
- [X] Raw HTML in the source is escaped by default
- [X] Enabling raw HTML without supplying a sanitiser is refused, not silently permitted
- [X] The adapter runs under the node test environment, proving no DOM dependency
- [X] Importing `/render` adds the parser to a consumer bundle; importing the barrel does not

**Note:** Rather than a new markdown-parser dependency, `src/render/serialize.ts` walks the tree
produced by the *same* `gfmParser` `CuiMarkdownEditor` edits against — exported from
`language/markdown-language.ts` (a plain `@lezer/markdown` `MarkdownParser` with GFM, no CodeMirror
props attached) specifically so editing and rendering can never disagree about what a document means,
and so the render subpath pulls in `@lezer/markdown`/`@lezer/common` only, never `@codemirror/*`.
Every node-name assumption (`Task`'s tree shape, `InlineCode` having no dedicated text child, a bare
GFM autolink appearing as an unwrapped `URL` node, an indented code block's leading 4-space indent
living in the *parent's* gap rather than the node itself, etc.) was verified empirically against the
real parser's own tree output before being relied on, not assumed from documentation — `@lezer/markdown`'s
own README explicitly disclaims providing HTML-rendering guidance, and reading its source directly
via `node_modules` was blocked by this environment's permission settings, so ground truth came from a
disposable diagnostic test dumping `tree.toString()` for ~25 constructs (deleted once its findings
were encoded). `createMarkdownRenderAdapter()` refuses (throws) `allowRawHtml: true` with no
`sanitize` function — construction-time, not a silent escape-anyway fallback. `isAllowedUrl` moved
from `plugins/builtin/dialogs/` to a package-wide `src/url-policy.ts` so the dialogs (FR14) and this
adapter enforce the *identical* allowlist (FR42) — and gained `tel:`, missing from the dialogs' own
list until now. A new `scripts/check-render-subpath-isolation.mjs`, chained into the package's own
`build` script (mirroring clean-ui's `check-fixture-guarantees.mjs`), asserts against the actual
built `dist/index.js`/`dist/render.js` that the barrel imports only the plain contract and never the
serializer/adapter/viewer, while `/render` imports all three — a permanent, mechanical check rather
than a one-time manual read of the build output.

---

#### Task 6.1.4: Security test suite

| Field | Value |
|-------|-------|
| Status | `[X]` Complete |
| Assigned | testing-specialist |
| Complexity | medium |
| Dependencies | 6.1.3 |

**Description:**
The XSS surface is wider than raw HTML blocks, and the trust boundary needs asserting rather than
describing: script tags, event-handler attributes, `javascript:` and `data:` URLs in both link and
image syntax, and HTML smuggled through paste then rendered.

**Acceptance Criteria:**
- [X] Each vector above is neutralised by default and covered by a named test
- [X] Enabling raw HTML with a sanitiser present still neutralises scheme-based vectors
- [X] A test documents the boundary: the same markdown rendered by a different renderer is the
      consumer's responsibility, and the server is the authority

**Note:** `src/render/__tests__/security.test.ts` — 17 named tests: `<script>` (block and inline),
event-handler attributes on both an inline and a block-level raw tag, `javascript:`/`data:` in both
link and image syntax, a `javascript:` angle-bracket autolink, HTML smuggled through paste (reusing
Phase 04's `convertHtmlToMarkdown` — asserts a pasted `<script>` never survives as markdown text at
all, so no later render-time configuration could resurrect it, and that a pasted `onclick` attribute
on a recognized element like a link is dropped rather than carried through), a permissive
(no-op) sanitizer that still can't reopen the `javascript:`/`data:` link/image vectors (proving that
protection lives in the URL allowlist, not the consumer's sanitizer), and two boundary-documenting
tests for FR41 (a hypothetical unsafe third-party adapter is explicitly out of this library's
control; `maxLength`/the construct policy are client-side-only conveniences, not validation).
Real-browser verification: an escaped `<script>` block never becomes a real `<script>` DOM element
(checked via `document.querySelectorAll`, not string inspection) when rendered by `CuiMarkdownViewer`.

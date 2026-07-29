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
| Complete    | 0     |
| In Progress | 0     |
| Not Started | 4     |
| Blocked     | 0     |
| Deferred    | 0     |

**Progress:** 0/4 tasks complete

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
| Status | `[ ]` Not Started |
| Assigned | frontend-developer |
| Complexity | medium |
| Dependencies | Phase 01 |

**Description:**
A synchronous adapter type returning a value produced only by an explicit trust-marking helper, so the
type itself says the caller is asserting the HTML is safe to inject. Synchronous in v1: widening to
allow a promise later is additive, narrowing would be breaking. Document that phase 1.5's split
preview will consume this same contract.

**Acceptance Criteria:**
- [ ] An adapter returning a plain string does not type-check; trust must be marked explicitly
- [ ] The contract is documented with a worked example using a third-party renderer
- [ ] Nothing in the core entry imports the adapter implementation

---

#### Task 6.1.2: Viewer component

| Field | Value |
|-------|-------|
| Status | `[ ]` Not Started |
| Assigned | frontend-developer |
| Complexity | medium |
| Dependencies | 6.1.1 |

**Description:**
A viewer taking a markdown string and an adapter. It applies clean-ui's typography layer itself
rather than documenting that consumers should, and it catches an adapter that throws — falling back to
escaped source with a developer warning, never blanking and never propagating into the component tree.

**Acceptance Criteria:**
- [ ] Rendered output inherits typography styling with no extra consumer setup
- [ ] A throwing adapter yields escaped source plus one warning
- [ ] Re-rendering on value change does not leak DOM or listeners

---

#### Task 6.1.3: Supplied adapter at `/render`

| Field | Value |
|-------|-------|
| Status | `[ ]` Not Started |
| Assigned | frontend-developer |
| Complexity | medium |
| Dependencies | 6.1.1 |

**Description:**
A ready-made adapter for applications with no renderer of their own. It escapes raw HTML by
configuring the parser not to emit it, which needs no sanitiser and keeps the subpath free of any DOM
dependency so it also runs during server rendering. Allowing raw HTML requires the consumer to supply
their own sanitiser — this library does not bundle one. URL schemes are allowlisted.

**Acceptance Criteria:**
- [ ] Raw HTML in the source is escaped by default
- [ ] Enabling raw HTML without supplying a sanitiser is refused, not silently permitted
- [ ] The adapter runs under the node test environment, proving no DOM dependency
- [ ] Importing `/render` adds the parser to a consumer bundle; importing the barrel does not

---

#### Task 6.1.4: Security test suite

| Field | Value |
|-------|-------|
| Status | `[ ]` Not Started |
| Assigned | testing-specialist |
| Complexity | medium |
| Dependencies | 6.1.3 |

**Description:**
The XSS surface is wider than raw HTML blocks, and the trust boundary needs asserting rather than
describing: script tags, event-handler attributes, `javascript:` and `data:` URLs in both link and
image syntax, and HTML smuggled through paste then rendered.

**Acceptance Criteria:**
- [ ] Each vector above is neutralised by default and covered by a named test
- [ ] Enabling raw HTML with a sanitiser present still neutralises scheme-based vectors
- [ ] A test documents the boundary: the same markdown rendered by a different renderer is the
      consumer's responsibility, and the server is the authority

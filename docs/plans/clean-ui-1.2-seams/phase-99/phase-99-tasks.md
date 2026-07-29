# Phase 99: Cross-Cutting Concerns

## Overview

Repository-wide items surfaced by the reviews that are not blocking the seams but should not be
carried silently into a two-package world.

## Status

| Status      | Count |
| ----------- | ----- |
| Complete    | 0     |
| In Progress | 0     |
| Not Started | 3     |
| Blocked     | 0     |
| Deferred    | 0     |

**Progress:** 0/3 tasks complete

## Agent Assignments

| Agent                                    | Focus Area                    | Tasks           |
| ---------------------------------------- | ----------------------------- | --------------- |
| web-developer-tools:full-stack-developer | Tooling, audit scripts        | 99.1.1          |
| developer-tools:documentation-expert     | Convention documentation      | 99.1.2, 99.1.3  |

## Decisions Already Taken

- **No linter.** The repository has no eslint, prettier or biome configuration, and the root `lint`
  script matches nothing. Rather than introduce one, the acceptance criteria that claimed "linting
  passes" were struck from the specifications; `vue-tsc` remains the automated code gate. Recorded
  here because the absence is deliberate, not an oversight for someone to helpfully fix.

## Tasks

### Group 99.1: Repository hygiene

#### Task 99.1.1: Extend the contrast audit beyond one package

| Field | Value |
|-------|-------|
| Status | `[ ]` Not Started |
| Assigned | full-stack-developer |
| Complexity | medium |
| Dependencies | None |

**Description:**
`scripts/check-contrast.mjs` reads clean-ui's `theme.css` with a hardcoded token pair list, so it
cannot see a second package's tokens. The editor's syntax-highlighting requirement claims coverage
by "the same contrast audit", which depends on this. Generalise the script to take token sources
from configuration.

**Acceptance Criteria:**
- [ ] The script audits token pairs from more than one package
- [ ] Existing clean-ui coverage is unchanged
- [ ] A failing pair in either package fails the audit with its source named

---

#### Task 99.1.2: Record the global-install exception in CLAUDE.md

| Field | Value |
|-------|-------|
| Status | `[ ]` Not Started |
| Assigned | documentation-expert |
| Complexity | low |
| Dependencies | None |

**Description:**
The component checklist tells contributors to register components in the plugin's global
`app.component()` install. A satellite package with a heavy dependency graph must not do that: a
global install puts its whole dependency tree in every consumer's main bundle and defeats
route-level code splitting. Record the exception where the rule lives, or the next contributor
follows the rule and undoes the reason the package was split.

**Acceptance Criteria:**
- [ ] The checklist states the exception and why
- [ ] Satellite packages are directed to named imports with an async-component example

---

#### Task 99.1.3: Reconcile the docs with reality

| Field | Value |
|-------|-------|
| Status | `[ ]` Not Started |
| Assigned | documentation-expert |
| Complexity | low |
| Dependencies | 3.2.2 |

**Description:**
Small factual drift found while reviewing: `CONTRIBUTING.md` says the docs site consumes the built
library when it aliases to source, and the release instructions predate the matrix. Fix both, and
sanity-check the rest of the contributor documentation against the current setup while in there.

**Acceptance Criteria:**
- [ ] No contributor-facing document describes a setup that no longer exists
- [ ] The build, test and release commands in the docs actually work as written

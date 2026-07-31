# Phase 03: Release Machinery and Docs Deploy

## Overview

The publish and deploy workflows are single-package by construction. Under lockstep versioning the
root `VERSION`, root `CHANGELOG.md` and `vX.Y.Z` tags all survive, so this phase is narrower than
independent versioning would have required — but the publish job still has to become a matrix, and
GitHub Pages still hosts one site per repository.

Do this before the editor package exists. Discovering it during the editor's first release turns a
planned change into an emergency.

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

| Agent                                    | Focus Area                  | Tasks         |
| ----------------------------------------- | --------------------------- | ------------- |
| web-developer-tools:full-stack-developer | Workflows, release tooling  | 3.1.1 – 3.2.2 |

## Tasks

### Group 3.1: Publish and CI

#### Task 3.1.1: Publish as a matrix over packages

| Field | Value |
|-------|-------|
| Status | `[X]` Complete |
| Assigned | full-stack-developer |
| Complexity | medium |
| Dependencies | None |

**Acceptance Criteria:**
- [x] Publishing clean-ui alone still works exactly as it does today
- [x] Adding a package to the matrix requires no other workflow change
- [x] A re-run of an already-published version is a no-op

---

#### Task 3.1.2: Changed-files guard

| Field | Value |
|-------|-------|
| Status | `[X]` Complete |
| Assigned | full-stack-developer |
| Complexity | medium |
| Dependencies | 3.1.1 |

**Acceptance Criteria:**
- [x] A release touching only clean-ui publishes only clean-ui
- [x] A release touching both publishes both
- [x] The skip is logged so a release reader can see it was intentional

---

#### Task 3.1.3: CI across the workspace

| Field | Value |
|-------|-------|
| Status | `[X]` Complete |
| Assigned | full-stack-developer |
| Complexity | medium |
| Dependencies | None |

**Acceptance Criteria:**
- [x] Every workspace package builds and tests on every supported Node version
- [x] Build order respects workspace dependencies
- [x] The fixture job from Phase 02 runs alongside

---

### Group 3.2: Documentation deploy and conventions

#### Task 3.2.1: Compose multiple docs sites into one Pages artifact

| Field | Value |
|-------|-------|
| Status | `[X]` Complete |
| Assigned | full-stack-developer |
| Complexity | medium |
| Dependencies | None |

**Acceptance Criteria:**
- [x] The existing site keeps its current URL
- [x] A second app is reachable at its own base path with working deep links
- [x] Both are rebuilt on every deploy, so neither can go stale

---

#### Task 3.2.2: Record the release and changelog conventions

| Field | Value |
|-------|-------|
| Status | `[X]` Complete |
| Assigned | full-stack-developer |
| Complexity | low |
| Dependencies | 3.1.1, 3.1.2 |

**Acceptance Criteria:**
- [x] `CONTRIBUTING.md` describes the release process accurately
- [x] The ordering rule for coupled releases is stated explicitly
- [x] The `/make-release` workflow's behaviour matches what is documented

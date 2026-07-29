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
| Complete    | 0     |
| In Progress | 0     |
| Not Started | 5     |
| Blocked     | 0     |
| Deferred    | 0     |

**Progress:** 0/5 tasks complete

## Agent Assignments

| Agent                                    | Focus Area                  | Tasks         |
| ---------------------------------------- | --------------------------- | ------------- |
| web-developer-tools:full-stack-developer | Workflows, release tooling  | 3.1.1 – 3.2.2 |

## Tasks

### Group 3.1: Publish and CI

#### Task 3.1.1: Publish as a matrix over packages

| Field | Value |
|-------|-------|
| Status | `[ ]` Not Started |
| Assigned | full-stack-developer |
| Complexity | medium |
| Dependencies | None |

**Description:**
`publish-npm.yml` hardcodes `working-directory: packages/clean-ui` and a single version check.
Turn it into a matrix over publishable packages, keeping the `npm view` idempotency check that
already works — it makes re-runs and non-bumping pushes safe.

**Acceptance Criteria:**
- [ ] Publishing clean-ui alone still works exactly as it does today
- [ ] Adding a package to the matrix requires no other workflow change
- [ ] A re-run of an already-published version is a no-op

---

#### Task 3.1.2: Changed-files guard

| Field | Value |
|-------|-------|
| Status | `[ ]` Not Started |
| Assigned | full-stack-developer |
| Complexity | medium |
| Dependencies | 3.1.1 |

**Description:**
Under lockstep, a clean-ui-only patch moves every package's version, so the `npm view` check sees
a genuinely new version and would republish a byte-identical package. Skip a package whose files
have not changed since the previous release tag.

**Acceptance Criteria:**
- [ ] A release touching only clean-ui publishes only clean-ui
- [ ] A release touching both publishes both
- [ ] The skip is logged so a release reader can see it was intentional

---

#### Task 3.1.3: CI across the workspace

| Field | Value |
|-------|-------|
| Status | `[ ]` Not Started |
| Assigned | full-stack-developer |
| Complexity | medium |
| Dependencies | None |

**Description:**
`ci.yml` filters to `@itguy614/clean-ui` in three places and type-checks one docs app, so a new
package would be invisible on day one. Move to workspace-recursive, topological build and test,
keeping the Node version matrix. A green pipeline that does not look at the new package is worse
than no pipeline.

**Acceptance Criteria:**
- [ ] Every workspace package builds and tests on every supported Node version
- [ ] Build order respects workspace dependencies
- [ ] The fixture job from Phase 02 runs alongside

---

### Group 3.2: Documentation deploy and conventions

#### Task 3.2.1: Compose multiple docs sites into one Pages artifact

| Field | Value |
|-------|-------|
| Status | `[ ]` Not Started |
| Assigned | full-stack-developer |
| Complexity | medium |
| Dependencies | None |

**Description:**
`deploy-docs.yml` uploads one app's `dist` as the entire artifact with a single `404.html`. Pages
hosts one site per repository, so multiple docs apps must be built with their own base paths into
subdirectories of a composed artifact, each with its own `404.html`, all rebuilt on every deploy.

**Acceptance Criteria:**
- [ ] The existing site keeps its current URL
- [ ] A second app is reachable at its own base path with working deep links
- [ ] Both are rebuilt on every deploy, so neither can go stale

---

#### Task 3.2.2: Record the release and changelog conventions

| Field | Value |
|-------|-------|
| Status | `[ ]` Not Started |
| Assigned | full-stack-developer |
| Complexity | low |
| Dependencies | 3.1.1, 3.1.2 |

**Description:**
Write down what lockstep means in practice, because the next release will be run by someone
reading the docs rather than this plan: one shared version, changelog entries naming the package
when it is not clean-ui, a new package joining at the current shared version rather than 1.0.0,
and the rule that a satellite release depending on a new clean-ui seam must not reach `master`
before the clean-ui release providing it.

**Acceptance Criteria:**
- [ ] `CONTRIBUTING.md` describes the release process accurately
- [ ] The ordering rule for coupled releases is stated explicitly
- [ ] The `/make-release` workflow's behaviour matches what is documented

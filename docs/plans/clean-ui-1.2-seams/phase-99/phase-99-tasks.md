# Phase 99: Cross-Cutting Concerns

## Overview

Repository-wide items surfaced by the reviews that are not blocking the seams but should not be
carried silently into a two-package world.

## Status

| Status      | Count |
| ----------- | ----- |
| Complete    | 3     |
| In Progress | 0     |
| Not Started | 0     |
| Blocked     | 0     |
| Deferred    | 0     |

**Progress:** 3/3 tasks complete

## Agent Assignments

| Agent                                    | Focus Area                    | Tasks           |
| ----------------------------------------- | ------------------------------ | --------------- |
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
| Status | `[X]` Complete |
| Assigned | full-stack-developer |
| Complexity | medium |
| Dependencies | None |

**Acceptance Criteria:**
- [x] The script audits token pairs from more than one package
- [x] Existing clean-ui coverage is unchanged
- [x] A failing pair in either package fails the audit with its source named

---

#### Task 99.1.2: Record the global-install exception in CLAUDE.md

| Field | Value |
|-------|-------|
| Status | `[X]` Complete |
| Assigned | documentation-expert |
| Complexity | low |
| Dependencies | None |

**Acceptance Criteria:**
- [x] The checklist states the exception and why
- [x] Satellite packages are directed to named imports with an async-component example

---

#### Task 99.1.3: Reconcile the docs with reality

| Field | Value |
|-------|-------|
| Status | `[X]` Complete |
| Assigned | documentation-expert |
| Complexity | low |
| Dependencies | 3.2.2 |

**Acceptance Criteria:**
- [x] No contributor-facing document describes a setup that no longer exists
- [x] The build, test and release commands in the docs actually work as written

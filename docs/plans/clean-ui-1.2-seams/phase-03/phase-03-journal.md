# Phase 03 Journal: Release Machinery and Docs Deploy

Progress, decisions and notes logged as tasks are addressed. Entries are appended by whoever works
a task — the tasks file tracks status, this file records why things happened.

## Log

### 2026-07-29 - Task 3.1.1 & 3.1.2: Publish matrix + changed-files guard
**Agent:** claude (direct implementation)  **Status:** Completed

**Work Done:**
- New `scripts/list-publishable-packages.mjs`: the single discovery logic for "which `packages/*`
  get published" (no `"private": true`), exported as a function AND runnable as a CLI that prints
  a JSON array of workspace-relative dirs. Also refactored `scripts/verify-fixture.mjs` (Phase 02)
  to import this instead of its own copy of the same discovery logic — a real, low-risk dedup
  opportunity found while writing this.
- Restructured `publish-npm.yml` into three jobs: `discover` (runs the script above to build the
  matrix), `publish` (matrix over packages — npm-view idempotency check, then a new
  changed-files-since-previous-tag check, then build + `npm publish`), `release` (runs once after
  the whole matrix, creates the GitHub Release from the root `VERSION`/`CHANGELOG.md` — moved off
  clean-ui's own `package.json` version specifically, since under lockstep the root files are the
  actual source of truth, not any one package's).
- Checkout now uses `fetch-depth: 0` + `fetch-tags: true` — the changed-files guard needs full
  history and every tag to diff against the previous release.

**Decisions Made:**
- Previous-release-tag resolution: `git tag --list 'v*' --sort=-v:refname | grep -vx
  "v$CURRENT_VERSION" | head -n 1` — the newest tag that ISN'T the version being released right
  now. Validated against this repo's real tag history (`v1.1.0` current, `v1.0.1` correctly
  resolved as previous) rather than invented data.
- A package failing its own npm-view check (already published) short-circuits before the
  changed-files check even runs — no reason to diff a package that's definitely being skipped
  anyway.

**Tests:** Validated the changed-files-guard shell logic directly against this repo's real git
history and tags (confirmed `packages/clean-ui` correctly reads as "changed since v1.0.1", and a
genuinely untouched path like `LICENSE` correctly reads as "not changed"). Full YAML syntax
validated (`js-yaml` via `npx`, since no `actionlint`/`yamllint` was available in this
environment). Couldn't exercise the two-package matrix behavior for real — there's only one
publishable package today — so this is verified by logic + isolated shell testing, not an
end-to-end second-package run; the mechanism is the same one already proven correct for `pnpm
pack`'s JSON output and `git diff --quiet` elsewhere in this repo's own tooling.

---

### 2026-07-29 - Task 3.1.3: CI across the workspace
**Agent:** claude (direct implementation)  **Status:** Completed

**Work Done:**
- `ci.yml`'s "Build library" + "Type-check docs" steps replaced with one `pnpm -r build` —
  confirmed empirically this builds `packages/clean-ui` before `apps/docs` (topological, pnpm's
  default for `-r`) and that `apps/docs`'s own `build` script already runs `vue-tsc --noEmit`
  internally, making a separate docs type-check step redundant once this is recursive.
  `check:imports` similarly became `pnpm -r --if-present check:imports` (docs has no such script;
  `--if-present` skips it rather than erroring).
- **Real, user-facing bug found and fixed as part of this task:** `packages/clean-ui`'s `"test"`
  script was `vitest run` with no `--project` filter, meaning it ran the `browser` project too —
  so a fresh contributor's very first `pnpm test`, before ever running `playwright install`, would
  fail outright on a missing-browser error, not a helpful one. Split it:
  `"test": "vitest run --project jsdom --project ssr"` (required, and now what `pnpm -r
  --if-present test` runs workspace-wide), new `"test:browser": "vitest run --project browser"`
  (explicit opt-in, still what CI's non-blocking browser step calls). Root `package.json`'s own
  `"build"`/`"test"` scripts now delegate to `pnpm -r build` / `pnpm -r --if-present test` instead
  of hardcoding `--filter @itguy614/clean-ui`.
- Non-workspace-generic pieces stayed package-filtered on purpose: installing/running the
  Playwright browser project, and the whole consumer-fixture/guarantees/budget chain (which
  already has its own generic package discovery from Phase 02, not tied to CI's build/test loop).

**Tests:** Ran the exact CI step sequence locally end to end (`pnpm -r build` →
`pnpm -r --if-present check:imports` → `pnpm -r --if-present test` → `pnpm --filter @itguy614/clean-ui
test:browser` → `pnpm verify:fixture`) — all green. Confirmed topological build order and that
`docs`'s type-check still runs (now via its own build script) without a dedicated step.

---

### 2026-07-29 - Task 3.2.1: Compose multiple docs sites into one Pages artifact
**Agent:** claude (direct implementation)  **Status:** Completed

**Work Done:**
- New `config/docs-sites.mjs`: explicit list of `{ dir, base }` — deliberately NOT
  auto-discovered like publishable packages, since "which apps are deployable docs sites, at
  which path" isn't a safe thing to infer from a field like `private` (apps/docs is already
  private and still deploys). First entry's base must be `"/"` (the existing site's URL);
  additional entries are non-root apps at their own subdirectory.
- New `scripts/build-docs-sites.mjs`: builds each site (its own `VITE_BASE`), composes all of them
  into one output directory, and writes the *one* `404.html` GitHub Pages will ever actually serve
  for an unmatched path anywhere on the site.
- `deploy-docs.yml` now builds `packages/clean-ui` first (docs sites resolve `@itguy614/clean-ui`'s
  *types* through the ordinary `workspace:*` symlink even though they alias to source at bundle
  time — confirmed this dependency is real, not vestigial, before removing anything), then calls
  the compose script, then uploads its output directory as the one Pages artifact.

**Decisions Made — the important one:** GitHub Pages has no per-directory 404 support. It serves
exactly one `404.html`, from the artifact root, for *any* unmatched path *anywhere* on the site — a
`404.html` nested under a non-root site's own subdirectory is simply never requested. A first
design (redirect-and-restore for every 404, root included) worked but changed the *existing*
site's behavior for no reason: today, a root-site deep link is served directly by the plain
`index.html`-copied `404.html`, at the URL the browser already has — no redirect ever happens,
because GitHub Pages just serves that content at the exact URL requested. The final design
preserves that exactly: the composed `404.html` **is** the root site's own `index.html`, with a
small dispatcher script prepended that only acts when the path matches a *non-root* site's
segment — sessionStorage stashes the real path, `location.replace` sends the browser to that
site's own `index.html`, and only *that* site's `index.html` (not the root's) has a
`history.replaceState` restore snippet injected, since only it can ever be reached this way.

**Tests:** This needed real verification, not just code review — a subtle mistake here breaks
routing invisibly. Built a minimal GitHub-Pages-behavior simulator (a Node static server: serve the
requested file if it exists, else serve `404.html` with a 404 status — that's the entirety of
Pages' actual routing) and drove it with a real headless Chromium (Playwright, already installed
for Phase 02's browser project) rather than assuming the JS was correct:
- A deep link into the root site (`/deep/route`, no such file) resolved with **zero navigations
  beyond the initial request** — confirming the existing single-site behavior is unchanged (no
  visible redirect where there wasn't one before).
- A deep link into a throwaway second site (`/second/some/deep/path?x=1#frag` — including a query
  string and a hash fragment, both deliberately) correctly redirected, loaded the second site's own
  shell, and restored the *exact* original URL via `history.replaceState`.
Also ran `scripts/build-docs-sites.mjs` against the real, single `apps/docs` site and confirmed its
output structure and 404.html content are correct; the throwaway second-site fixtures used for the
browser test were never added to the repository.

---

### 2026-07-29 - Task 3.2.2: Record the release and changelog conventions
**Agent:** claude (direct implementation)  **Status:** Completed

**Work Done:**
- New "Releases" section in `CONTRIBUTING.md`: lockstep versioning explained in practice (root
  `VERSION`/`CHANGELOG.md`/tags are the source of truth; changelog entries name the package in
  parentheses when it isn't clean-ui, mirroring the `/make-release` skill's own existing
  convention language), a new package joins at the current shared version rather than `1.0.0`, the
  coupled-release ordering rule stated explicitly (a satellite depending on an unshipped clean-ui
  seam must not reach `master` first, because its peer range resolves against the registry), and
  the changed-files-skip behavior from Task 3.1.2.
- Explicitly called out `fixtures/consumer-app/package.json`'s own `"version"` field as *not* part
  of lockstep (it's `"private": true` test infrastructure) — a generic version-bump tool that
  greps the repo for `"version"` fields, like the `/make-release` skill installed in this
  environment, would otherwise find and needlessly flag it.
- Refreshed the "Repository layout" table for `config/docs-sites.mjs` and the two new scripts.

**Decisions Made:** `/make-release` is a generic, shared plugin skill (not owned by this repo) that
scans broadly for anything with a `"version"` field — it can't be taught this repo's lockstep rule
directly. The fix available here is documentation: `CONTRIBUTING.md` now states precisely which
files are part of a release (root `VERSION`/`CHANGELOG.md` + every publishable package's
`package.json`) and which aren't (the fixture's), so whoever runs the skill — human or agent — has
the correct list in front of them, and the skill's own "Show Preview" confirmation step gives a
last chance to exclude anything it found that shouldn't be there.

---

### 2026-07-29 - Phase 03 complete
**Status:** All 5 tasks complete. Full verification pass: `pnpm -r build`, `pnpm -r --if-present
check:imports`, `pnpm -r --if-present test`, `pnpm --filter @itguy614/clean-ui test:browser`,
`node scripts/build-docs-sites.mjs`, and `pnpm verify:fixture` all green. All three workflow files
(`ci.yml`, `publish-npm.yml`, `deploy-docs.yml`) validated for YAML syntax.

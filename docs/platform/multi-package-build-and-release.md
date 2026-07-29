# Platform: Multi-Package Build, Release and Verification

**Status**: Draft
**Created**: 2026-07-29
**Applies to**: this monorepo as it grows past one published package. Written while specifying
`@itguy614/clean-ui-editor` (see `docs/features/markdown-editor.md`), but every decision here
is intended to serve any future satellite package.

## Problem Statement

### Current State

The repository publishes exactly one package and the tooling assumes it everywhere:

- `.github/workflows/publish-npm.yml` hardcodes `working-directory: packages/clean-ui`, one
  `npm view` version check, one `CHANGELOG.md` section extracted by version, and one
  `gh release create "v$VERSION"`.
- `.github/workflows/ci.yml` hardcodes `--filter @itguy614/clean-ui` and type-checks exactly
  one docs app.
- `.github/workflows/deploy-docs.yml` uploads `apps/docs/dist` as the entire Pages artifact.
- `packages/clean-ui/vite.config.ts` externalizes a hand-written list of four specifiers.
- `apps/docs/vite.config.ts` aliases `@itguy614/clean-ui` to source, so nothing in CI ever
  exercises the published artifact, its `exports` map, or peer resolution.
- The only size measurement, `scripts/postbuild.mjs`, reports the library's own `dist` sizes,
  not what reaches a consumer's bundle.

### Desired State

A second package can be built, tested, published and documented without rewriting the
pipeline, and the guarantees the packages advertise — tree-shaking, no accidental
dependencies, single instances of shared runtime state — are verified mechanically rather than
asserted in a changelog.

### Gap

Every workflow is single-package by construction, and the two guarantees that have already
been broken once in this repository (a stylesheet shipping Tailwind utilities, an icon barrel
defeating tree-shaking) are exactly the class of problem that only shows up in a consumer's
build, which nothing in CI performs.

## Requirements

### Dependency policy

- P1: A published package externalizes dependencies **by rule**, not by a maintained list.
  The Rollup `external` predicate derives from the union of `dependencies` and
  `peerDependencies`, matched by prefix. A hand-written list silently inlines a transitive
  dependency the moment an upstream package adds one.
- P2: CI asserts that every bare import specifier in a built `dist` is either relative or
  declared in that package's `package.json`. This closes the whole class rather than the cases
  someone remembered.
- P3: CodeMirror packages are `dependencies` of the editor with caret ranges, not
  `peerDependencies` and not pinned. Consumers should not have to install a dozen packages,
  and pinning exact versions guarantees duplicates in a consumer tree that has any other
  CodeMirror-based dependency.
- P4: A package that must resolve to a single runtime instance ships a re-export subpath so
  extension authors never install the underlying library themselves. For the editor this is
  `@itguy614/clean-ui-editor/codemirror`, re-exporting the CodeMirror surface a raw-tier plugin
  needs plus its types, documented as the supported way to author one.
- P5: Single-instance violations are detected, not documented and hoped for. Two layers: at
  runtime, stamp identity on a versioned global on first editor construction and emit a
  developer warning when it differs, translating CodeMirror's `Unrecognized extension value`
  error into a message naming the fix (Vite `resolve.dedupe`, pnpm `overrides`); in CI, assert
  the fixture app's build contains exactly one copy. The same technique applies to clean-ui,
  whose module-scope singletons (injection keys, icon registry, density) fail silently rather
  than loudly when duplicated.
- P6: A satellite package depends on clean-ui through a caret peer range (`^1.2.0`), never
  `>=`, which would assert compatibility with majors that do not exist yet. It additionally
  lists clean-ui as a `devDependency` at `workspace:*`, because a peer entry alone does not
  make pnpm link it or order the builds.

### Verification

- P7: A consumer fixture job in CI packs every published package with `pnpm pack`, installs the
  tarballs into a throwaway Vite and Vue application using **npm** rather than the pnpm
  workspace — which is how the real consumers install — builds it, and asserts against the
  output. This is the only place the `exports` map, peer resolution and published file list are
  exercised at all.
- P8: The fixture job's assertions are the package guarantees, expressed mechanically: the core
  entry's chunks contain no markdown-to-HTML renderer or sanitiser; importing a subpath adds
  them; exactly one copy of each single-instance dependency; the `@phosphor-icons/vue` barrel is
  absent; and gzip totals fall within a committed budget.
- P9: Bundle budgets live in a committed file and fail CI on regression. A budget that is only
  documented gates nothing.
- P10: Test environments match what is under test. Alongside the existing jsdom project:
  a `node`-environment project for server-rendering assertions, which cannot be made in jsdom;
  and a real-browser runner for behaviour that depends on layout, selection or input method.
  Shared setup provides the polyfills a DOM-dependent editor needs to mount in jsdom at all
  (`Range.prototype.getBoundingClientRect` and `getClientRects`), because their absence looks
  like "this cannot be tested" rather than a missing stub.
- P11: Resolution policy lives in one place. The alias list mapping published package names to
  workspace source is a shared module consumed by every docs app and test setup, so two apps
  cannot disagree and quietly load two copies of clean-ui.

### Release

- P12: Versions are **lockstep**: all published packages share one version number, the root
  `VERSION` file and the root `CHANGELOG.md`, and tags stay `vMAJOR.MINOR.PATCH`. Changelog
  entries name the package they affect when it is not clean-ui.
- P13: The publish job is a matrix over publishable packages, keeping the existing `npm view`
  idempotency check.
- P14: A package whose files have not changed since the previous release tag is skipped by the
  publish matrix. Under lockstep its version number moves anyway, so the version check alone
  would republish a byte-identical artifact.
- P15: A new package joins at the current shared version rather than starting at 1.0.0. Its
  maturity is communicated in its documentation, not in a version number it does not control.
- P16: A satellite release that depends on a new clean-ui seam must not reach `master` before
  the clean-ui release providing it. The peer range resolves against the registry, not the
  workspace, so the ordering is real rather than a formality.
- P17: CI builds and tests the whole workspace topologically (`pnpm -r`), across the existing
  Node version matrix, rather than filtering to one package. A green pipeline that does not
  look at a new package is worse than no pipeline.
- P18: GitHub Pages hosts one site per repository, so multiple docs apps are composed into a
  single artifact — each built with its own base path into a subdirectory, each with its own
  `404.html` — and all are rebuilt on every deploy.

### Conventions this supersedes

- P19: `CLAUDE.md`'s component checklist says to register new components in the plugin's global
  `app.component()` install. A satellite package with a heavy dependency graph must **not** do
  this: a global install puts its entire dependency tree in every consumer's main bundle and
  defeats route-level code splitting. Named imports only, with an async-component example in
  the docs. `CLAUDE.md` should record the exception.

## Acceptance Criteria

- [ ] Adding a dependency to a published package requires no change to any `external` list, and
      CI fails if a built `dist` imports something undeclared
- [ ] The fixture app builds from packed tarballs installed with npm, and its assertions fail
      when a renderer, an icon barrel, or a second copy of a single-instance dependency is
      introduced
- [ ] A deliberate bundle regression fails CI against the committed budget
- [ ] A DOM-dependent editor component mounts in the jsdom project; server-rendering assertions
      run in the node project; the browser runner executes the layout- and input-dependent cases
- [ ] Two docs apps resolve clean-ui through the same shared alias module, and a duplicate copy
      is detected rather than silently tolerated
- [ ] A release publishes only the packages whose files changed, at the shared version, with
      correctly namespaced release notes
- [ ] Both docs sites deploy from one Pages artifact, each reachable at its own base path
- [ ] CI builds and tests every workspace package on every supported Node version

## Known Gaps Not Addressed Here

- There is no linter in this repository: no eslint, prettier or biome configuration exists, and
  the root `lint` script matches no package script. **Decision: no linter is being introduced**,
  and every acceptance criterion asserting "linting passes" has been struck rather than left
  false. Type checking through `vue-tsc` remains the automated code gate. Adding a linter later
  is a separate piece of work, and would come with its own decision about formatting the existing
  code. Note the root `lint` script still exists and silently matches nothing, which is worth
  removing whenever someone next touches the root scripts.
- `scripts/check-contrast.mjs` reads clean-ui's `theme.css` with a hardcoded token pair list.
  Extending the audit to a second package's tokens is real work, and any requirement claiming
  a satellite package is "verified by the same contrast audit" depends on it.
- `CONTRIBUTING.md` still states the docs site consumes the built library; it consumes source
  via an alias.

## References

- CodeMirror duplicate-instance failure mode:
  https://discuss.codemirror.net/t/uncaught-error-unrecognized-extension-value-in-extension-set-object-object-this-sometimes-happens-because-multiple-instances-of-codemirror-state-are-loaded-breaking-instanceof-checks/7898
- Prior art in this repository for guarantees that only broke in consumer builds: issues #42
  (icon barrel defeating tree-shaking) and #62 (stylesheet shipping Tailwind utilities)
- Existing workflows: `.github/workflows/{ci,publish-npm,deploy-docs}.yml`

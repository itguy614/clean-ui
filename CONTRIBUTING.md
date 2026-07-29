# Contributing to Clean UI

Thanks for your interest in contributing! This guide covers setup, the day-to-day
workflow, and the conventions that keep the library consistent.

## Prerequisites

- **Node** ≥ 20
- **pnpm** ≥ 10 (this repo is a pnpm workspace — `npm`/`yarn` are not used)

```sh
pnpm install
```

## Repository layout

| Path | Description |
|---|---|
| `packages/clean-ui` | The published library (`@itguy614/clean-ui`) |
| `apps/docs` | Documentation site — it **dogfoods** the library and is deployed to GitHub Pages |
| `config` | Shared config modules used by more than one app/package — e.g. `workspace-aliases.ts`, the one place that maps a published package name to its workspace source |
| `fixtures/consumer-app` | Not a workspace member. A throwaway app `scripts/verify-fixture.mjs` installs packed tarballs into with **npm**, to check what a real external install actually resolves to |
| `scripts` | Tooling — `new-component.mjs` (scaffold), `check-contrast.mjs` (WCAG audit), `verify-fixture.mjs` / `check-fixture-guarantees.mjs` / `check-bundle-budget.mjs` (consumer-fixture verification) |
| `CLAUDE.md` | The canonical conventions & architecture reference — read it before building components |

## Common commands

```sh
pnpm dev               # run the docs site locally (hot reload)
pnpm build             # build the library (Vite + vue-tsc type declarations)
pnpm test              # run the test suite (vitest)
pnpm check:contrast    # audit color contrast across every theme
pnpm verify:fixture     # pack + install with npm into fixtures/consumer-app, check
                        # tree-shaking/CSS/single-instance guarantees and the size budget
```

> **Heads-up:** the docs site resolves `@itguy614/clean-ui` to the library's *workspace
> source* (via the shared alias in `config/workspace-aliases.ts`), not a built `dist` — so
> changes show up immediately under `pnpm dev`, no `pnpm build` needed. If Vite's
> dependency pre-bundling cache goes stale (rare — usually right after adding a new
> source file under an aliased path), clear it: `rm -rf apps/docs/node_modules/.vite`.
> The one place a real built-and-installed package is exercised is `pnpm verify:fixture`
> (`fixtures/consumer-app`) — see below.

## Adding a new component

Use the scaffold — it stamps the component, an optional context file, and a docs page,
and wires everything up (library `index.ts` export + plugin registration, docs route, nav entry):

```sh
pnpm new:component SegmentedControl --group "Form Controls"
# add --context to also generate a provide/inject context file
```

Valid `--group` values: `Layout`, `Form Controls`, `Actions`, `Feedback`, `Data Display`, `Navigation`, `Overlay`.

Then implement the component following the conventions. The essentials (full checklist in [`CLAUDE.md`](./CLAUDE.md)):

- **Compose shared prop mixins** from `types/common.ts` via `extends` — `HideableProps`,
  `ColorableProps` (`color: CuiColor`), `SizeableProps` (`size: CuiSize`), `DisableableProps`,
  `FormControlProps`. Don't re-declare these per component.
- **Use the shared types** — `CuiColor`, `CuiSize`, `CuiRounded`, `CuiOrientation`. Import size
  scales from `utils/sizing.ts` (and `clampSize` to narrow). Never define local size/color types or maps.
- **Semantic tokens only** — `var(--cui-surface-base)`, `var(--cui-border)`, `var(--cui-{role})` /
  `-bg` / `-border`. Never hardcode colors or use Tailwind color utilities (breaks theming),
  and never use template literals for Tailwind classes (v4 can't detect them — use inline `:style`).
- **Subtle by default, bold by choice** — resting states use tinted `-bg`/`-border`; solid fills only via `variant="solid"`.
- **Accessible first** — `aria-*`, keyboard navigation, visible focus rings.
- **`defineExpose({ el, focus, blur })`** on interactive components.
- **Icons** via `CuiIcon` (never inline SVGs).
- Document the component on its generated docs page (props table + examples using `CuiCard`/`Example`).

Finish with a green `pnpm build` (zero TypeScript errors) and `pnpm test`.

## Tests

`packages/clean-ui/vitest.config.ts` runs three vitest projects — `pnpm test` runs all of them:

- **jsdom** (`src/components/__tests__`, `src/composables/__tests__`, etc.) — the main suite:
  vitest + `@vue/test-utils` + jsdom. New components should at least have a smoke test (mounts,
  renders, respects `hidden`/`disabled`); bug fixes should add a regression test where practical.
- **ssr** (`src/__tests__/ssr/`) — renders through `@vue/server-renderer` in a real `node`
  environment (no DOM at all, unlike jsdom which always fakes one). Use this for anything that must
  not touch `document`/`window` outside a lifecycle hook.
- **browser** (`src/__tests__/browser/`) — a real headless Chromium via Playwright
  (`@vitest/browser`), for behaviour that depends on real layout, selection or input method (jsdom's
  layout engine is a no-op — `getComputedStyle`/`scrollHeight` are always zero there). First run
  needs the browser installed once: `pnpm --filter @itguy614/clean-ui exec playwright install
  chromium`. Run just this project with `pnpm --filter @itguy614/clean-ui exec vitest run --project
  browser`. **Triaging a failure:** re-run with `--project browser` and drop `headless: true` in
  `vitest.config.ts` locally to watch it happen in a visible browser window, or add
  `page.pause()`-style debugging via the test's `page` object (see [Vitest's browser mode
  docs](https://vitest.dev/guide/browser/)). CI treats this project as non-blocking for now
  (`continue-on-error`) — a red run there is a signal to look at, not (yet) a merge blocker.

## Commits & pull requests

- **Branch from `develop`** and open PRs **against `develop`** (the integration branch). `master` tracks releases.
- Keep PRs focused; reference the issue they address (e.g. `Closes #12`).
- Use clear, conventional-style commit subjects (`feat:`, `fix:`, `docs:`, `refactor:`, `chore:`).
- Ensure `pnpm build` and `pnpm test` pass. For visual changes, include before/after screenshots.
- Be kind in reviews — we credit effort and iterate together. 💙

## License

By contributing, you agree your contributions are licensed under the [MIT License](./LICENSE).

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
| `scripts` | Tooling — `new-component.mjs` (scaffold), `check-contrast.mjs` (WCAG audit) |
| `CLAUDE.md` | The canonical conventions & architecture reference — read it before building components |

## Common commands

```sh
pnpm dev               # run the docs site locally (hot reload)
pnpm build             # build the library (Vite + vue-tsc type declarations)
pnpm test              # run the test suite (vitest)
pnpm check:contrast    # audit color contrast across every theme
```

> **Heads-up:** the docs site consumes the *built* library. After changing library
> source, run `pnpm build` and clear the docs cache: `rm -rf apps/docs/node_modules/.vite`.

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

Tests live in `packages/clean-ui/src/components/__tests__` and run on vitest + `@vue/test-utils` + jsdom.
New components should at least have a smoke test (mounts, renders, respects `hidden`/`disabled`);
bug fixes should add a regression test where practical.

## Commits & pull requests

- **Branch from `develop`** and open PRs **against `develop`** (the integration branch). `master` tracks releases.
- Keep PRs focused; reference the issue they address (e.g. `Closes #12`).
- Use clear, conventional-style commit subjects (`feat:`, `fix:`, `docs:`, `refactor:`, `chore:`).
- Ensure `pnpm build` and `pnpm test` pass. For visual changes, include before/after screenshots.
- Be kind in reviews — we credit effort and iterate together. 💙

## License

By contributing, you agree your contributions are licensed under the [MIT License](./LICENSE).

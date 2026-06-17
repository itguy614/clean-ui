# Clean UI

[![npm](https://img.shields.io/npm/v/@itguy614/clean-ui.svg)](https://www.npmjs.com/package/@itguy614/clean-ui)
[![license](https://img.shields.io/npm/l/@itguy614/clean-ui.svg)](./LICENSE)
[![docs](https://img.shields.io/badge/docs-live-blue.svg)](https://itguy614.github.io/clean-ui/)

A clean, dark-mode-ready **Vue 3** component library — 100+ components on a fully
token-driven theme system. Subtle by default, bold by choice; accessible first;
overridable at every level via CSS custom properties.

**[📖 Documentation & live examples →](https://itguy614.github.io/clean-ui/)**

## Install

```sh
npm install @itguy614/clean-ui vue@^3.5
```

```ts
import { createCleanUI } from "@itguy614/clean-ui";
import "@itguy614/clean-ui/styles";

createApp(App).use(createCleanUI()).mount("#app");
```

Full install, usage, and theming guide: [`packages/clean-ui/README.md`](./packages/clean-ui/README.md).

## Highlights

- **100+ components** across layout, form controls, actions, feedback, data display, navigation, overlays.
- **8 themes** + light/dark, driven by `--cui-*` tokens — override on `:root` or any scope.
- **Accessible first**, **TypeScript**-native, **Tailwind v4** compatible, tree-shakeable ESM.

## Repository structure

This is a pnpm monorepo:

| Path | Description |
|---|---|
| `packages/clean-ui` | The published library (`@itguy614/clean-ui`) |
| `apps/docs` | The documentation site (dogfoods the library), deployed to GitHub Pages |
| `scripts` | Tooling (e.g. `check-contrast.mjs` — WCAG audit across themes) |

## Development

```sh
pnpm install

pnpm dev               # run the docs site locally
pnpm build             # build the library (Vite + vue-tsc declarations)
pnpm test              # run the test suite
pnpm new:component Foo --group "Form Controls"   # scaffold a new component
pnpm check:contrast    # audit color contrast across all themes
```

See [`CONTRIBUTING.md`](./CONTRIBUTING.md) for the full workflow, and [`CLAUDE.md`](./CLAUDE.md) for conventions, architecture, and the component checklist.

## License

[MIT](./LICENSE) © Kurt Wolf

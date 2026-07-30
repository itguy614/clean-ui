// The "ssr" project runs in Vitest's node environment — no `window`/`document`,
// so it can't share `test-setup.ts` (which installs jsdom polyfills). It still
// needs the built-in plugins' icons registered before `renderToString` renders
// a toolbar button using one, for the same reason "jsdom" does — see
// test-setup.ts.
import "./icons";

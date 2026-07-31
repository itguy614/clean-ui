import { installJsdomPolyfills } from "../../../config/jsdom-polyfills";
// Tests import components directly (e.g. `../components/CuiMarkdownEditor.vue`),
// bypassing the package barrel (`src/index.ts`) that registers the built-in
// plugins' icons as a side effect — without this, every icon-rendering test
// hits CuiIcon's unregistered-name warning path instead of what a real
// consumer (who always goes through the barrel) actually experiences.
import "./icons";

installJsdomPolyfills();

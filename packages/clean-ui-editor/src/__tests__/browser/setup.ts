/**
 * Shared setup for the editor's real-browser project (#145).
 *
 * Loads the two stylesheets a consumer loads: clean-ui's (its tokens, its scoped base and
 * CuiButton's own rules) and the editor's. The editor's rules depend on how those two
 * cascade against each other (#186), so a suite here measures the real pair, not a stub of
 * either. `@itguy614/clean-ui` resolves to the built package, as it does for a consumer,
 * so rebuild clean-ui after changing it or this measures a stale CuiButton.
 *
 * The editor's sheet loads FIRST, which is the order that is worst for it. A consumer's
 * bundler decides the real order, so an editor rule has to win on specificity alone. Loaded
 * last, the editor's rules would also win every tie, and a CuiButton rule that regained
 * just enough specificity to tie with them would pass here and break in an app that
 * happens to load the sheets the other way round.
 */
import "../../styles/editor.css";
import "@itguy614/clean-ui/styles";

// The built-in plugins' icons, for the same reason the jsdom setup registers them: tests
// import components directly, bypassing the barrel that registers them as a side effect.
import "../../icons";

// Real <Transition> in the browser, as in clean-ui's browser setup (#263).
import { config } from "@vue/test-utils";
config.global.stubs = { ...config.global.stubs, transition: false, "transition-group": false };

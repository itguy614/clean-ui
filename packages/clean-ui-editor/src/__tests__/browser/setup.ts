/**
 * Shared setup for the editor's real-browser project (#145).
 *
 * Loads the two stylesheets a consumer loads, in the order they load them: clean-ui's
 * (its tokens, its scoped base, and CuiButton's own rules) and then the editor's. The
 * editor's rules depend on how those two cascade against each other (#186), so a suite
 * here measures the real pair, not a stub of either. `@itguy614/clean-ui` resolves to the
 * built package, like it does for a consumer, so build clean-ui before running this.
 */
import "@itguy614/clean-ui/styles";
import "../../styles/editor.css";

// The built-in plugins' icons, for the same reason the jsdom setup registers them: tests
// import components directly, bypassing the barrel that registers them as a side effect.
import "../../icons";

// Real <Transition> in the browser, as in clean-ui's browser setup (#263).
import { config } from "@vue/test-utils";
config.global.stubs = { ...config.global.stubs, transition: false, "transition-group": false };

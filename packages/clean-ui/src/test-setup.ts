import { config } from "@vue/test-utils";
import { defineComponent, Transition, type FunctionalComponent } from "vue";
import { installJsdomPolyfills } from "../../../config/jsdom-polyfills";

installJsdomPolyfills();

// Overlays stay mounted through their exit and unmount on <Transition>'s after-leave (#263),
// which test-utils' default stub never fires: a closed panel would stay in the DOM, hidden,
// for good. jsdom has no CSS transitions, so this is the real <Transition> with `css: false`:
// with no CSS to wait for it finishes a leave at once and fires after-leave. Called as a
// function rather than rendered, or test-utils would swap the stub in for it again. The
// browser project runs the real transitions.
const InstantTransition = defineComponent({
  inheritAttrs: false,
  setup: (_, { attrs, slots, emit }) => () =>
    (Transition as unknown as FunctionalComponent)({ ...attrs, css: false }, { attrs, slots, emit }),
});
config.global.stubs = { ...config.global.stubs, transition: InstantTransition };

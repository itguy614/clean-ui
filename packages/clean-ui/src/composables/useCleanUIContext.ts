import { inject, type App } from "vue";
import { CuiConfigKey, CuiDefaultsKey } from "../components/config-context";
import { useCleanUIDefaults } from "../utils/configure";

/**
 * What clean-ui has provided above a component: the app's defaults (`createCleanUI()`
 * options and any `CuiConfigProvider` layers) and the message catalog. Opaque: it only
 * hands itself on.
 */
export interface CleanUIContext {
  /** Provide this context to another Vue app, so clean-ui components there behave as here. */
  provideTo(app: App): void;
}

/**
 * Capture the clean-ui context provided above the calling component, to hand on to an app
 * mounted outside its tree — a dialog created with `createApp()`, which cannot see the host's
 * injections, so its components would otherwise fall back to the library's defaults and the
 * English catalog (#326). Call it in `setup()`; call `provideTo(app)` before `app.mount()`.
 *
 * ```ts
 * const cleanUI = useCleanUIContext(); // in setup
 * // later
 * const app = createApp(MyDialog);
 * cleanUI.provideTo(app);
 * app.mount(el);
 * ```
 *
 * What it hands on is live: a change to the host's provider reaches the other app too.
 */
export function useCleanUIContext(): CleanUIContext {
  const defaults = useCleanUIDefaults();
  // Not useMessages(): that falls back to the English catalog, and a fallback must not be
  // provided to the other app as if the host had chosen it.
  const messages = inject(CuiConfigKey, null);
  return {
    provideTo(app) {
      if (defaults) app.provide(CuiDefaultsKey, defaults);
      if (messages) app.provide(CuiConfigKey, messages);
    },
  };
}

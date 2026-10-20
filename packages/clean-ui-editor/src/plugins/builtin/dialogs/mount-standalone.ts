import { createApp, type Component } from "vue";

/**
 * Mounts a Vue component as its own standalone app in a detached DOM node —
 * a plugin command has no access to the host's component tree (`CommandContext`
 * intentionally carries no Vue app/render context, only plain data and edit
 * helpers), so a dialog-driving command must render its own UI this way. This
 * is what a `collect()` `open()` callback (src/plugins/types.ts) does in
 * practice for a real dialog, as opposed to the plain-callback openers used
 * in Phase 03's tests.
 */
let standaloneCount = 0;

export function mountStandaloneDialog<P extends Record<string, unknown>>(component: Component, props: P): () => void {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const app = createApp(component, props);
  // clean-ui generates its ids with useId(), which is unique per app only. Without a
  // distinct prefix, this app's ids ("cui-modal-title-v-0", ...) can duplicate the host
  // app's on the same document and cross-wire aria-labelledby.
  app.config.idPrefix = `cui-standalone-${++standaloneCount}`;
  app.mount(container);
  return () => {
    app.unmount();
    container.remove();
  };
}

import { createApp, type Component } from "vue";
import type { CleanUIContext } from "@itguy614/clean-ui";

const THEME_CLASS = /^cui-theme-/;

/**
 * The scoped theme around `anchor` (#399): the nearest `cui-theme-*` class and any `dark`
 * class below `document.body`. One on `<body>` or `<html>` already reaches the dialog.
 * A stopgap until clean-ui's teleported components carry a scoped theme themselves (#418).
 */
function scopedThemeClasses(anchor: Element | null): string[] {
  let theme: string | undefined;
  let dark = false;
  for (let el = anchor; el && el !== document.body; el = el.parentElement) {
    theme ??= [...el.classList].find((name) => THEME_CLASS.test(name));
    dark ||= el.classList.contains("dark");
  }
  return [theme, dark ? "dark" : undefined].filter((name): name is string => name !== undefined);
}

/**
 * Mounts a Vue component as its own standalone app in a detached DOM node —
 * a plugin command has no access to the host's component tree (`CommandContext`
 * intentionally carries no Vue app/render context, only plain data and edit
 * helpers), so a dialog-driving command must render its own UI this way. This
 * is what a `collect()` `open()` callback (src/plugins/types.ts) does in
 * practice for a real dialog, as opposed to the plain-callback openers used
 * in Phase 03's tests.
 *
 * `cleanUI` (the command's `context.cleanUI`) is provided to the new app, so the
 * clean-ui components in it follow the host's defaults and catalog (#326).
 *
 * `anchor` (the editor's element) lends the app its scoped theme, as a snapshot taken at
 * mount. The classes go on the root component as a fallthrough `class`, not on the
 * container: a CuiModal teleports to `body`, leaving the container empty, and forwards
 * them to its panel.
 */
let standaloneCount = 0;

export function mountStandaloneDialog<P extends Record<string, unknown>>(
  component: Component,
  props: P,
  cleanUI: CleanUIContext,
  anchor: Element | null = null,
): () => void {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const theme = scopedThemeClasses(anchor);
  const app = createApp(component, theme.length ? { ...props, class: theme } : props);
  // clean-ui generates its ids with useId(), which is unique per app only. Without a
  // distinct prefix, this app's ids ("cui-modal-title-v-0", ...) can duplicate the host
  // app's on the same document and cross-wire aria-labelledby.
  app.config.idPrefix = `cui-standalone-${++standaloneCount}`;
  cleanUI.provideTo(app);
  app.mount(container);
  return () => {
    app.unmount();
    container.remove();
  };
}

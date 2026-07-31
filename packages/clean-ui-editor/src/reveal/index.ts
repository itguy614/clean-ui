import type { Extension } from "@codemirror/state";
import { inputTypeGranularityExtension, granularityField } from "./granularity";
import { revealPlugin, revealFocusTracking } from "./reveal-plugin";
import { activeConstructsExtension } from "./construct-policy";
import { listBulletPlugin } from "./list-bullet-plugin";

/** Everything `wysiwyg` mode needs beyond the base editor: the active
 * construct policy (FR27/FR29), granularity tracking and the marker-hiding
 * decoration layer. `source` mode adds none of this — nothing hidden, per
 * FR4. `initialConstructs` is the node-name set the currently active plugins
 * declare via `decorations` (see `CuiMarkdownEditor.vue`). */
export function revealExtension(initialConstructs: ReadonlySet<string>): Extension {
  return [
    ...activeConstructsExtension(initialConstructs),
    granularityField,
    inputTypeGranularityExtension(),
    revealPlugin,
    revealFocusTracking,
    listBulletPlugin,
  ];
}

export { granularityField, setGranularityEffect, type RevealGranularity } from "./granularity";
export { activeConstructsField, setActiveConstructsEffect } from "./construct-policy";

import type { Extension } from "@codemirror/state";
import { inputTypeGranularityExtension, granularityField } from "./granularity";
import { revealPlugin } from "./reveal-plugin";

/** Everything `wysiwyg` mode needs beyond the base editor: granularity
 * tracking and the marker-hiding decoration layer. `source` mode adds none
 * of this — nothing hidden, per FR4. */
export function revealExtension(): Extension {
  return [granularityField, inputTypeGranularityExtension(), revealPlugin];
}

export { granularityField, setGranularityEffect, type RevealGranularity } from "./granularity";

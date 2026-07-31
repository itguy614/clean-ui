import { StateField, StateEffect } from "@codemirror/state";
import { EditorView } from "@codemirror/view";

/**
 * FR8: construct-level reveal for pointer input, whole-line for touch —
 * landing a caret between two asterisks with a fingertip isn't a reasonable
 * requirement. Tracks the *most recent* input type, so a hybrid device
 * (touchscreen laptop) behaves sensibly regardless of which it used last.
 */
export type RevealGranularity = "construct" | "line";

/** Not exported from the package barrel or `/codemirror` — internal state,
 * inspectable in tests via `view.state.field(granularityField)` (FR/task
 * 2.1.2's "inspectable for tests without exposing internals as public API"),
 * imported directly from this module rather than through any public entry. */
export const setGranularityEffect = StateEffect.define<RevealGranularity>();

export const granularityField = StateField.define<RevealGranularity>({
  create: () => "construct",
  update(value, tr) {
    for (const effect of tr.effects) {
      if (effect.is(setGranularityEffect)) return effect.value;
    }
    return value;
  },
});

/**
 * Observes pointer events (non-blocking — never interferes with CodeMirror's
 * own handling) and dispatches a granularity change when the input type
 * actually differs from the current one. "touch" switches to line
 * granularity; anything else (mouse, pen — a stylus is precise enough for
 * construct-level targeting) switches back to construct.
 */
export function inputTypeGranularityExtension() {
  return EditorView.domEventObservers({
    pointerdown(event, view) {
      const next: RevealGranularity = event.pointerType === "touch" ? "line" : "construct";
      if (view.state.field(granularityField) !== next) {
        view.dispatch({ effects: setGranularityEffect.of(next) });
      }
    },
  });
}

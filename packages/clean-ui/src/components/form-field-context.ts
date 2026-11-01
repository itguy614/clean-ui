import { computed, inject, provide, type InjectionKey, type Ref } from "vue";
import type { CuiSize } from "../types/common";

/**
 * How a control's floating label rests (#191), which only the control knows:
 *
 * - `inline` — a single-line input: the label rests centred in it.
 * - `multiline` — a textarea: the label rests on the first line.
 * - `pinned` — something already sits where the label would rest (a prefix, an attached
 *   button, a stepper's minus button), so the label stays floated.
 */
export type FloatingLabelKind = "inline" | "multiline" | "pinned";

/**
 * `CuiFormField` provides the id of the control its label may float over — its own field
 * id, or null when it isn't floating. A control that supports floating injects that and,
 * when its own `id` is that one, marks its native `<input>`/`<textarea>` with
 * `data-cui-float-label` and a single-space placeholder. The field's CSS does the rest:
 * `:has([data-cui-float-label])` turns the floating layout on (without the marker it stays
 * a top label, which is the fallback for every control that never marks itself), and
 * `:placeholder-shown` on the marked element is the "empty" test, so a value set by
 * autofill — which fires no event — moves the label with no JS state at all.
 *
 * Matching the id is what keeps a composite honest: a transfer list's filter boxes or a data
 * grid's search are CuiInputs too, but not the control the label names, so they never mark
 * themselves and the field falls back. The marker, not this injection, is what the CSS keys
 * on, so the server render is already right: a flag reported back up to the field would
 * only land after the field had rendered.
 */
export const FloatingLabelKey: InjectionKey<Readonly<Ref<string | null>>> = Symbol("cui-floating-label");

/**
 * Provide the id a floating label may rest over. `CuiFormField` calls it. So does a control
 * that hands its own id to a supported control inside it while not being one itself
 * (CuiDatePicker's masked input, CuiTimePicker's), passing `() => null`, or that inner
 * control would claim the field's floating layout for its host.
 */
export function useFloatingLabelProvider(id: () => string | null): void {
  provide(FloatingLabelKey, computed(id));
}

export interface FloatingLabelState {
  kind: FloatingLabelKind;
  size: CuiSize;
  /** The control's own id: it is marked only when this is the field's. */
  id?: string;
  /** The control's own placeholder, if any. */
  placeholder?: string;
}

export interface FloatingLabelBindings {
  /** The placeholder to render: the control's own, or `" "` while a label can rest. */
  placeholder: string | undefined;
  /** The `data-cui-float-label` value, or undefined when not floating. */
  marker: string | undefined;
}

/**
 * For a control whose focus surface is a native `<input>`/`<textarea>`. Optional by
 * design, unlike a family's `useXContext()`: these controls are standalone, and outside a
 * floating `CuiFormField` this hands back their own placeholder and no marker.
 *
 * Returns a getter for the template, not a computed, so `state` may read `$slots` (which a
 * computed would not track): it re-runs on every render, which is when slots change.
 *
 * The single-space placeholder is only added when the control has none of its own,
 * because `:placeholder-shown` needs *some* placeholder to match. A control with a real
 * placeholder keeps it, and its label stays floated (the field's CSS rests the label only
 * over `[placeholder=" "]`), since the two would otherwise be drawn on top of each other.
 */
export function useFloatingLabel(state: () => FloatingLabelState): () => FloatingLabelBindings {
  const floatingId = inject(FloatingLabelKey, null);
  return () => {
    const { kind, size, id, placeholder } = state();
    if (!floatingId?.value || id !== floatingId.value) return { placeholder, marker: undefined };
    // A pinned label never rests, so it has no use for the empty test.
    if (kind === "pinned") return { placeholder, marker: kind };
    return { placeholder: placeholder || " ", marker: `${kind} ${size}` };
  };
}

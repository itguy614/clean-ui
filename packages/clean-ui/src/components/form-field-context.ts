import { computed, inject, provide, type InjectionKey, type Ref } from "vue";
import type { CuiSize } from "../types/common";
import { FLOATING_LABEL_SCALE, type FloatingLabelSize } from "../utils/sizing";

/**
 * How a control's floating label rests (#191), which only the control knows:
 *
 * - `inline` — a single-line input: the label rests centred in it, where the text starts
 *   (after a leading icon), and floats to the top of the box above the value.
 * - `multiline` — a textarea: the label rests on the first line.
 * - `pinned` — something already sits where the label would rest (a prefix, an attached
 *   button, a stepper's minus button), so the label stays floated.
 */
export type FloatingLabelKind = "inline" | "multiline" | "pinned";

/**
 * `CuiFormField` provides the id of the control its label may float over — its own field
 * id, or null when it isn't floating. A control that supports floating injects that and,
 * when its own `id` is that one, marks its native `<input>`/`<textarea>` with
 * `data-cui-float-label` and a single-space placeholder, and grows one size step taller
 * through its own private height property. The field's CSS does the rest:
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
  /** A leading icon sits before the text, so the resting label starts after it. */
  lead?: boolean;
  /** A trailing button (clear, password toggle) the label must stay clear of. */
  end?: boolean;
  /** Size the field to the control rather than the row (a stepper's compact box). */
  fit?: boolean;
}

export interface FloatingLabelBindings {
  /** The placeholder to render: the control's own, or `" "` while a label can rest. */
  placeholder: string | undefined;
  /** The `data-cui-float-label` value, or undefined when not floating. */
  marker: string | undefined;
  /** The floating geometry for the control's size, or null when no label floats over it. */
  float: (typeof FLOATING_LABEL_SCALE)[FloatingLabelSize] | null;
}

const isFloatingSize = (size: CuiSize): size is FloatingLabelSize => size in FLOATING_LABEL_SCALE;

/**
 * For a control whose focus surface is a native `<input>`/`<textarea>`. Optional by
 * design, unlike a family's `useXContext()`: these controls are standalone, and outside a
 * floating `CuiFormField` this hands back their own placeholder and no marker.
 *
 * `control` is the control's own id and placeholder: it is marked only when its id is the
 * field's, and keeps its own placeholder otherwise. Returns a getter
 * for the template, not a computed, so `state` may read `$slots` (which a computed would not
 * track): it re-runs on every render, which is when slots change.
 *
 * Only md, lg and xl float: the label sits inside the control, above the value, and an xs
 * or sm control is too short for both. A smaller one stays unmarked, so the field falls
 * back to a top label and warns.
 *
 * The marker is the kind, the size, and `lead` / `end` / `fit` when they apply, space separated,
 * for the field's `~=` selectors. The single-space placeholder is only added when the
 * control has none of its own, because `:placeholder-shown` needs *some* placeholder to
 * match. A control's own placeholder is transparent until focus, so it only ever shows
 * under a floated label.
 */
export function useFloatingLabel(
  control: () => { id?: string; placeholder?: string },
  state: () => FloatingLabelState,
): () => FloatingLabelBindings {
  const floatingId = inject(FloatingLabelKey, null);
  return () => {
    const { id, placeholder } = control();
    // The id first, so a control nowhere near a floating field never builds its state (a
    // CuiInput would otherwise walk its prefix slot on every render).
    if (!floatingId?.value || id !== floatingId.value) return { placeholder, marker: undefined, float: null };
    const { kind, size, lead, end, fit } = state();
    if (!isFloatingSize(size)) return { placeholder, marker: undefined, float: null };
    const marker = [kind, size, kind === "inline" && lead && "lead", end && "end", fit && "fit"].filter(Boolean).join(" ");
    // A pinned label never rests, so it has no use for the empty test.
    return { placeholder: kind === "pinned" ? placeholder : placeholder || " ", marker, float: FLOATING_LABEL_SCALE[size] };
  };
}

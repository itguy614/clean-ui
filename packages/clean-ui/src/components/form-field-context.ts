import { computed, inject, provide, type ComputedRef, type InjectionKey, type Ref } from "vue";
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
 * `CuiFormField` provides whether its label floats; a control that supports it injects
 * that and, while it is true, marks its native `<input>`/`<textarea>` with
 * `data-cui-float-label` and a single-space placeholder. The field's CSS does the rest:
 * `:has([data-cui-float-label])` turns the floating layout on (without the marker it
 * stays a top label, which is the fallback for every control that never marks itself),
 * and `:placeholder-shown` on the marked element is the "empty" test, so a value set by
 * autofill — which fires no event — moves the label with no JS state at all.
 *
 * The marker, not this injection, is what the CSS keys on, so the server render is
 * already right: a flag reported back up to the field would only land after the field
 * had rendered.
 */
export const FloatingLabelKey: InjectionKey<Readonly<Ref<boolean>>> = Symbol("cui-floating-label");

/**
 * Provide whether descendant controls float their label. `CuiFormField` calls it; so does
 * any control that renders a supported control *inside* an unsupported one (CuiDatePicker's
 * masked input, CuiTimePicker's steppers), passing `() => false`, so the inner control does
 * not claim support for its host.
 */
export function useFloatingLabelProvider(floating: () => boolean): void {
  provide(FloatingLabelKey, computed(floating));
}

export interface FloatingLabelState {
  kind: FloatingLabelKind;
  size: CuiSize;
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
 * The single-space placeholder is only added when the control has none of its own,
 * because `:placeholder-shown` needs *some* placeholder to match. A control with a real
 * placeholder keeps it, and its label stays floated (the field's CSS rests the label only
 * over `[placeholder=" "]`), since the two would otherwise be drawn on top of each other.
 */
export function useFloatingLabel(state: () => FloatingLabelState): ComputedRef<FloatingLabelBindings> {
  const floating = inject(FloatingLabelKey, null);
  return computed(() => {
    const { kind, size, placeholder } = state();
    if (!floating?.value) return { placeholder, marker: undefined };
    // A pinned label never rests, so it has no use for the empty test.
    if (kind === "pinned") return { placeholder, marker: kind };
    return { placeholder: placeholder || " ", marker: `${kind} ${size}` };
  });
}

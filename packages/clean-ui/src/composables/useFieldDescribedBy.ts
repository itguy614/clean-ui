import { computed, useId, type ComputedRef } from "vue";

/** The props any control needs for this: its own id, a caller's descriptions, and an error. */
interface DescribableProps {
  id?: string;
  ariaDescribedby?: string;
  error?: boolean;
  errorMessage?: string;
}

/**
 * Wire a control's own error message into `aria-describedby`.
 *
 * A control that sets `aria-invalid` and renders an unreferenced error message tells a
 * screen-reader user that something is wrong and never what (#175). Put `errorId` on the
 * message element and `describedBy` on the control.
 *
 * Caller-supplied ids come first, then ours: `aria-describedby` is read in the order given,
 * and a caller's own help text is the more general description.
 *
 * The id falls back to Vue's `useId()` rather than `Math.random()`, which is what the rest
 * of the library still uses: `useId()` is stable across re-renders *and* identical between
 * a server render and its hydration, so it does not produce an attribute mismatch. Eight
 * components render an error message this way; extracting it means the next six do not each
 * re-derive the id-list rule.
 */
export function useFieldDescribedBy(props: DescribableProps): {
  errorId: ComputedRef<string>;
  describedBy: ComputedRef<string | undefined>;
} {
  const uid = useId();
  const errorId = computed(() => `${props.id ?? uid}-error`);
  const describedBy = computed(() => {
    const own = props.error && props.errorMessage ? errorId.value : undefined;
    if (props.ariaDescribedby && own) return `${props.ariaDescribedby} ${own}`;
    return props.ariaDescribedby ?? own;
  });
  return { errorId, describedBy };
}

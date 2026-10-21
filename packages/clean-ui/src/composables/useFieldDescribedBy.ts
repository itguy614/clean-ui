import { computed, type ComputedRef } from "vue";
import { useCuiId } from "./useCuiId";

/** The props any control needs for this: its own id, a caller's descriptions, and an error. */
export interface DescribableProps {
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
 * The order is the control's own description, then caller-supplied ids, then the error:
 * `aria-describedby` is read in the order given. `descriptionId` is for a control that
 * renders its own description inside itself (CuiCheckbox, CuiRadio, CuiToggle, #183), which
 * would otherwise be read as part of its name.
 *
 * The id falls back to `useCuiId()`, which is stable across re-renders *and* identical
 * between a server render and its hydration, so it does not produce an attribute mismatch. Eight
 * components render an error message this way; extracting it means the next six do not each
 * re-derive the id-list rule.
 */
export function useFieldDescribedBy(
  props: DescribableProps,
  options: {
    /** The control's own description element's id, when it renders one. */
    descriptionId?: () => string | undefined;
  } = {},
): {
  errorId: ComputedRef<string>;
  describedBy: ComputedRef<string | undefined>;
} {
  const uid = useCuiId("field");
  const errorId = computed(() => `${props.id ?? uid}-error`);
  const describedBy = computed(() => {
    const own = props.error && props.errorMessage ? errorId.value : undefined;
    const ids = [options.descriptionId?.(), props.ariaDescribedby, own].filter(Boolean);
    return ids.length ? ids.join(" ") : undefined;
  });
  return { errorId, describedBy };
}

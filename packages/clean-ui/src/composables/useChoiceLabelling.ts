import { computed, useSlots } from "vue";
import { useCuiId } from "./useCuiId";
import { useFieldDescribedBy, type DescribableProps } from "./useFieldDescribedBy";

/**
 * Naming for CuiCheckbox, CuiRadio and CuiToggle (#183). Internal — not exported.
 *
 * Their description renders inside the element carrying the role, so it was read as part of
 * the accessible name. With a description, the control is named by its label span instead —
 * unless a caller (CuiFormField) passes `aria-labelledby` — and described by the description,
 * ahead of the caller's own descriptions (useFieldDescribedBy owns that order).
 *
 * Bind `labelId` and `descriptionId` on the two spans, `labelledBy` and `describedBy` on the
 * role element. Call it in setup: it reads the `description` slot.
 */
export function useChoiceLabelling(props: DescribableProps & { description?: string; ariaLabelledby?: string }) {
  const slots = useSlots();
  const uid = useCuiId("choice");
  const labelId = `${uid}-label`;
  const descriptionId = `${uid}-description`;
  const hasDescription = computed(() => !!props.description || !!slots.description);
  const { describedBy } = useFieldDescribedBy(props, {
    descriptionId: () => (hasDescription.value ? descriptionId : undefined),
  });
  const labelledBy = computed(() => props.ariaLabelledby ?? (hasDescription.value ? labelId : undefined));
  return { labelId, descriptionId, hasDescription, describedBy, labelledBy };
}

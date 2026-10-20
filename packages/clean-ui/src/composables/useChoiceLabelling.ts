import { useAttrs, useSlots } from "vue";
import { useCuiId } from "./useCuiId";
import { useFieldDescribedBy, type DescribableProps } from "./useFieldDescribedBy";

/**
 * Naming for CuiCheckbox, CuiRadio and CuiToggle (#183). Internal — not exported.
 *
 * Their description renders inside the element carrying the role, so it was read as part of
 * the accessible name. With a description, the control is named by its label span instead —
 * unless a caller names it (`aria-labelledby`, e.g. CuiFormField, or `aria-label`), or there
 * is no label to point at — and described by the description, ahead of the caller's own
 * descriptions (useFieldDescribedBy owns that order).
 *
 * Bind `labelId` and `descriptionId` on the two spans, `labelledBy()` and `describedBy()` on
 * the role element. They are functions, read at render, not computeds: slots aren't reactive,
 * so a computed would miss a #description slot that comes or goes.
 */
export function useChoiceLabelling(props: DescribableProps & { label?: string; description?: string; ariaLabelledby?: string }) {
  const slots = useSlots();
  const attrs = useAttrs();
  const uid = useCuiId("choice");
  const labelId = `${uid}-label`;
  const descriptionId = `${uid}-description`;

  const hasDescription = () => !!props.description || !!slots.description;
  const hasLabel = () => !!props.label || !!slots.default;

  // The caller's ids and the error, from the shared helper; the description goes first, and
  // is added at render, where the slot check is current.
  const { describedBy: rest } = useFieldDescribedBy(props);
  const describedBy = () => [hasDescription() ? descriptionId : undefined, rest.value].filter(Boolean).join(" ") || undefined;

  const labelledBy = () => {
    if (props.ariaLabelledby) return props.ariaLabelledby; // || semantics: an empty one isn't a name
    if (attrs["aria-label"] || !hasDescription() || !hasLabel()) return undefined;
    return labelId;
  };

  return { labelId, descriptionId, hasDescription, describedBy, labelledBy };
}

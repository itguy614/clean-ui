import { Text, computed, useSlots } from "vue";
import { slotNodes } from "../utils/vnodes";
import type { CuiAutoOrientation } from "../types/common";

/**
 * A form-control group's `orientation="auto"` (#206): horizontal for two options or fewer,
 * vertical for three or more, counted from the default slot. Shared by CuiRadioGroup,
 * CuiCheckboxGroup and CuiToggleGroup. Internal.
 */
export function useAutoOrientation(orientation: () => CuiAutoOrientation) {
  const slots = useSlots();
  // Bare text is not an option.
  const childCount = computed(() => slotNodes(slots.default?.() ?? []).filter((n) => n.type !== Text).length);

  return computed<"horizontal" | "vertical">(() => {
    const value = orientation();
    if (value !== "auto") return value;
    return childCount.value <= 2 ? "horizontal" : "vertical";
  });
}

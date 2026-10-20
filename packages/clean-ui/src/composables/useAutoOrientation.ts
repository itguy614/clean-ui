import { Fragment, computed, useSlots } from "vue";
import type { CuiAutoOrientation } from "../types/common";

/**
 * A form-control group's `orientation="auto"` (#206): horizontal for two options or fewer,
 * vertical for three or more, counted from the default slot — a `v-for` fragment counts its
 * children. Shared by CuiRadioGroup, CuiCheckboxGroup and CuiToggleGroup. Internal.
 */
export function useAutoOrientation(orientation: () => CuiAutoOrientation) {
  const slots = useSlots();
  const childCount = computed(() => {
    const vnodes = slots.default?.() ?? [];
    return vnodes.reduce((count, vnode) => {
      // A fragment (`v-for`, a `<template>`) holds the real options.
      if (vnode.type === Fragment) return count + ((vnode.children as unknown[] | null)?.length ?? 0);
      return count + 1;
    }, 0);
  });

  return computed<"horizontal" | "vertical">(() => {
    const value = orientation();
    if (value !== "auto") return value;
    return childCount.value <= 2 ? "horizontal" : "vertical";
  });
}

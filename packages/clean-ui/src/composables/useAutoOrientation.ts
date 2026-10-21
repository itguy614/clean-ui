import { Comment, Fragment, Text, computed, useSlots, type VNode } from "vue";
import type { CuiAutoOrientation } from "../types/common";

/** The options in a slot's vnodes: fragments (`v-for`, `<template>`) unwrapped at any depth, and
    the comment a false `v-if` leaves behind, and bare text, not counted. */
function countOptions(vnodes: VNode[]): number {
  let count = 0;
  for (const vnode of vnodes) {
    if (vnode.type === Comment || vnode.type === Text) continue;
    if (vnode.type === Fragment) {
      if (Array.isArray(vnode.children)) count += countOptions(vnode.children as VNode[]);
      continue;
    }
    count += 1;
  }
  return count;
}

/**
 * A form-control group's `orientation="auto"` (#206): horizontal for two options or fewer,
 * vertical for three or more, counted from the default slot. Shared by CuiRadioGroup,
 * CuiCheckboxGroup and CuiToggleGroup. Internal.
 */
export function useAutoOrientation(orientation: () => CuiAutoOrientation) {
  const slots = useSlots();
  const childCount = computed(() => countOptions(slots.default?.() ?? []));

  return computed<"horizontal" | "vertical">(() => {
    const value = orientation();
    if (value !== "auto") return value;
    return childCount.value <= 2 ? "horizontal" : "vertical";
  });
}

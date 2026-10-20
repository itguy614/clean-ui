<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue";

/**
 * Native form participation for a custom control (#174, #303). Internal — not exported, not
 * registered. CuiSelect, CuiCombobox and CuiTagInput render no native control carrying their
 * value, so a form post or FormData would miss it — or, with `name` on a search input, post
 * the typed text instead. This renders one hidden input per value under `name`, as a native
 * <select> posts: a single value posts one entry (empty when there is none), a multiple one
 * per value (none when empty). Disabled posts nothing, like a disabled native control.
 *
 * A native control fires bubbling `input` and `change` events when its value changes, which
 * is what form-level listeners (dirty tracking, autosave) hear; a hidden input whose value
 * Vue patches fires nothing. So this dispatches both after each real change — from the first
 * hidden input, so `e.target.name` and `.value` say which field it was, or from its own root
 * when no input is left — and not while disabled, nor for a new array with the same values.
 */
const props = defineProps<{
  name?: string;
  /** The control's model value: a scalar, or an array when `multiple`. */
  value: unknown;
  multiple?: boolean;
  disabled?: boolean;
}>();

const values = computed<Array<string | number>>(() => {
  const v = props.value as string | number | Array<string | number> | null | undefined;
  if (props.multiple) return Array.isArray(v) ? v : [];
  return [v == null || Array.isArray(v) ? "" : v];
});

const root = ref<HTMLElement | null>(null);

watch(
  // By content: a parent passing a fresh array of the same values changes nothing.
  () => JSON.stringify(values.value),
  () => {
    if (!props.name || props.disabled) return;
    nextTick(() => {
      const target = root.value?.querySelector("input") ?? root.value;
      target?.dispatchEvent(new Event("input", { bubbles: true }));
      target?.dispatchEvent(new Event("change", { bubbles: true }));
    });
  },
);
</script>

<template>
  <span v-if="name" ref="root" class="cui-form-values" hidden>
    <input v-for="(v, i) in values" :key="i" type="hidden" :name="name" :value="v" :disabled="disabled" />
  </span>
</template>

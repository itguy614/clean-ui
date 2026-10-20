<script setup lang="ts">
import { nextTick, ref, watch } from "vue";

/**
 * Native form participation for a custom control (#174, #303). Internal — not exported, not
 * registered. CuiSelect, CuiCombobox and CuiTagInput render no native control carrying their
 * value, so a form post or FormData would miss it — or, with `name` on a search input, post
 * the typed text instead. This renders one hidden input per value under `name`, as a native
 * <select> posts: the component passes `[]` for an empty multiple (nothing posts) and `[""]`
 * for an empty single. Disabled posts nothing, like a disabled native control.
 *
 * A native control fires bubbling `input` and `change` events when its value changes, which
 * is what form-level listeners (dirty tracking, autosave) hear; a hidden input whose value
 * Vue patches fires nothing. So this dispatches both after each change, from an element that
 * stays in the form even when no input is left.
 */
const props = defineProps<{
  name?: string;
  values: Array<string | number>;
  disabled?: boolean;
}>();

const root = ref<HTMLElement | null>(null);

watch(
  () => props.values,
  () => {
    if (!props.name) return;
    nextTick(() => {
      root.value?.dispatchEvent(new Event("input", { bubbles: true }));
      root.value?.dispatchEvent(new Event("change", { bubbles: true }));
    });
  },
  { deep: true },
);
</script>

<template>
  <span v-if="name" ref="root" class="cui-form-values" hidden>
    <input v-for="(v, i) in values" :key="i" type="hidden" :name="name" :value="v" :disabled="disabled" />
  </span>
</template>

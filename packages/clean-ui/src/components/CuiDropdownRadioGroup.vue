<script setup lang="ts">
import { provide, toRef, type Ref } from "vue";
import { DropdownRadioKey } from "./dropdown-context";

export interface CuiDropdownRadioGroupProps {
  /** Selected value */
  modelValue?: string | number;
}

const props = defineProps<CuiDropdownRadioGroupProps>();

const emit = defineEmits<{
  "update:modelValue": [value: string | number];
}>();

provide(DropdownRadioKey, {
  modelValue: toRef(props, "modelValue") as Ref<string | number>,
  select(value: string | number) {
    emit("update:modelValue", value);
  },
});
</script>

<template>
  <div role="group">
    <slot />
  </div>
</template>

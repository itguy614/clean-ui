<script setup lang="ts">
import { provide, toRef, type Ref } from "vue";
import { DropdownRadioKey } from "./dropdown-context";
import type { AriaLabelableProps } from "../types/common";

export interface CuiDropdownRadioGroupProps extends AriaLabelableProps {
  /** Selected value */
  modelValue?: string | number;
  /** Accessible group name, when no `aria-labelledby` target exists. */
  label?: string;
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
  <div
    class="cui-dropdown-radio-group"
    role="radiogroup"
    :id="id"
    :aria-labelledby="ariaLabelledby"
    :aria-describedby="ariaDescribedby"
    :aria-label="ariaLabelledby ? undefined : label"
  >
    <slot />
  </div>
</template>

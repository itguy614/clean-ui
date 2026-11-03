<script setup lang="ts">
import { useButtonGroupProvider } from "../composables/useButtonGroup";

const props = defineProps<{
  /** Which edge of the field it is merged into: `start` is the prefix button. */
  side: "start" | "end";
}>();

// The button inside takes its corners from this: outer ones follow the field, inner ones are
// square (#444).
useButtonGroupProvider({ attached: props.side });
</script>

<template>
  <div class="cui-input-attachment">
    <slot />
  </div>
</template>

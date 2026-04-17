<script setup lang="ts">
import { inject, ref, onMounted } from "vue";
import { DropdownContextKey } from "./dropdown-context";

const ctx = inject(DropdownContextKey);
const el = ref<HTMLElement>();

onMounted(() => {
  if (ctx && el.value) {
    ctx.triggerEl.value = el.value;
  }
});

function onClick() {
  if (ctx?.trigger.value === "click") {
    ctx.toggle();
  }
}
</script>

<template>
  <div ref="el" class="cui-dropdown-trigger" @click="onClick">
    <slot />
  </div>
</template>

<style scoped>
.cui-dropdown-trigger {
  display: inline-flex;
}
</style>

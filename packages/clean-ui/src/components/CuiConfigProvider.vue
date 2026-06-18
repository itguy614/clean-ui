<script setup lang="ts">
import { computed, inject, provide } from "vue";
import { CuiConfigKey } from "./config-context";
import { defaultMessages, mergeMessages, type CuiMessages, type DeepPartialMessages } from "../messages";

export interface CuiConfigProviderProps {
  /**
   * Partial overrides for the default (English) message catalog. Only the keys
   * you supply are replaced; everything else falls back to the defaults (or a
   * parent provider's values when nested).
   */
  messages?: DeepPartialMessages;
}

const props = defineProps<CuiConfigProviderProps>();

// Nesting: merge onto the parent provider's catalog (or built-in defaults).
const parent = inject(CuiConfigKey, null);
const merged = computed<CuiMessages>(() =>
  mergeMessages(parent ? parent.value : defaultMessages, props.messages),
);

provide(CuiConfigKey, merged);
</script>

<template>
  <slot />
</template>

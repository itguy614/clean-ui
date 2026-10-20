<script setup lang="ts">
import { computed, inject, provide } from "vue";
import { CuiConfigKey, CuiDefaultsKey, type CuiHeadingLevels } from "./config-context";
import { defaultMessages, mergeMessages, type CuiMessages, type DeepPartialMessages } from "../messages";
import { mergeDefaults } from "../utils/configure";
import type { CuiColor } from "../types/common";

export interface CuiConfigProviderProps {
  /** Heading levels for the titled components inside (#149), over the app's. */
  headingLevels?: Partial<CuiHeadingLevels>;
  /** Role icons for the feedback components inside (#149), over the app's. */
  roleIcons?: Partial<Record<CuiColor, string>>;
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

// The app-wide defaults, the same way: this subtree's over the app's (or an outer provider's).
const parentDefaults = inject(CuiDefaultsKey, null);
provide(
  CuiDefaultsKey,
  computed(() => mergeDefaults(parentDefaults?.value, { headingLevels: props.headingLevels, roleIcons: props.roleIcons })),
);
</script>

<template>
  <slot />
</template>

<script setup lang="ts">
import type { AvatarSize } from "./CuiAvatar.vue";

export interface CuiAvatarGroupProps {
  /** Negative margin overlap between avatars */
  spacing?: string;
  /** Max avatars to show before "+N" overflow */
  max?: number;
  /** Hide the component */
  hidden?: boolean;
}

const props = withDefaults(defineProps<CuiAvatarGroupProps>(), {
  spacing: "-0.5rem",
  hidden: false,
});
</script>

<template>
  <div v-show="!hidden" class="cui-avatar-group" :style="{ '--_avatar-group-spacing': spacing }">
    <slot />
  </div>
</template>

<style>
.cui-avatar-group {
  display: inline-flex;
  flex-direction: row-reverse;
  align-items: center;
}

.cui-avatar-group > .cui-avatar {
  margin-left: var(--_avatar-group-spacing, -0.5rem);
  border: 2px solid var(--cui-surface-base, white);
  transition: transform 0.15s ease;
}

.cui-avatar-group > .cui-avatar:last-child {
  margin-left: 0;
}

.cui-avatar-group > .cui-avatar:hover {
  transform: translateY(-2px);
  z-index: 1;
}
</style>

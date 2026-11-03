<script setup lang="ts">
import { Text, h, useSlots } from "vue";
import type { HideableProps } from "../types/common";
import { slotNodes } from "../utils/vnodes";
import CuiAvatar from "./CuiAvatar.vue";
import { useMessages } from "../composables/useMessages";

export interface CuiAvatarGroupProps extends HideableProps {
  /** Negative margin overlap between avatars */
  spacing?: string;
  /**
   * Most avatars to show; the rest collapse into one "+N" avatar. Unset shows them all. Zero
   * or less shows only the "+N" avatar. It takes its size and shape from the first avatar.
   */
  max?: number;
}

const props = withDefaults(defineProps<CuiAvatarGroupProps>(), {
  spacing: "-0.5rem",
  hidden: false,
});

/** The neutral role: the "+N" is a count, not a person, so it takes no hue. */
const OVERFLOW_COLOR = "surface";

const slots = useSlots();
const messages = useMessages();

// A functional component, so the slot and `max` are read in a render of their own and a
// dynamic list (`v-if`, `v-for`) is counted again on every change.
const Avatars = () => {
  const children = slotNodes(slots.default?.() ?? []).filter((n) => n.type !== Text || String(n.children).trim());
  const limit = props.max == null || Number.isNaN(props.max) ? children.length : Math.max(0, Math.floor(props.max));
  if (children.length <= limit) return children;
  const hiddenCount = children.length - limit;
  const first = children[0].props ?? {};
  return [
    ...children.slice(0, limit),
    h(CuiAvatar, {
      class: "cui-avatar-group__overflow",
      initials: `+${hiddenCount}`,
      color: OVERFLOW_COLOR,
      size: first.size,
      shape: first.shape,
      role: "img",
      "aria-label": messages.value.avatar.overflow(hiddenCount),
    }),
  ];
};
</script>

<template>
  <div v-show="!hidden" class="cui-avatar-group" :style="{ '--_avatar-group-spacing': spacing }">
    <Avatars />
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
  transition: transform var(--cui-duration-fast) var(--cui-ease-out);
}

.cui-avatar-group > .cui-avatar:last-child {
  margin-left: 0;
}

/* Hover-only motion, for a fine pointer: a tap on a touch screen would set it and leave it (#265). */
@media (hover: hover) and (pointer: fine) {
  .cui-avatar-group > .cui-avatar:hover {
    transform: translateY(-2px);
    z-index: 1;
  }
}
</style>

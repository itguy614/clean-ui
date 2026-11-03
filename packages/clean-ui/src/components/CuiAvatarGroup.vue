<script setup lang="ts">
import { Text, h, useSlots, type VNode } from "vue";
import type { HideableProps } from "../types/common";
import { slotNodes } from "../utils/vnodes";
import CuiAvatar from "./CuiAvatar.vue";
import { useMessages } from "../composables/useMessages";

export interface CuiAvatarGroupProps extends HideableProps {
  /** Negative margin overlap between avatars */
  spacing?: string;
  /**
   * Most avatars to show; the rest collapse into one "+N" avatar. Unset shows them all. Zero
   * or less shows only the "+N" avatar (shown as "99+" past 99). It takes its size and shape
   * from the `size` and `shape` props of the first child, so a wrapped avatar gets the defaults.
   * Children with `hidden` are left out, and don't count toward `max` or the "+N".
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

/** An avatar with `hidden` (or a bare `hidden` attribute) is not on screen, so it is not counted. */
const isHidden = (n: VNode) => {
  const v = n.props?.hidden;
  return v === "" || (v !== undefined && v !== false && v !== "false");
};

// A functional component, so the slot and `max` are read in a render of their own and a
// dynamic list (`v-if`, `v-for`) is counted again on every change.
const Avatars = () => {
  const children = slotNodes(slots.default?.() ?? []).filter(
    (n) => (n.type !== Text || String(n.children).trim()) && !isHidden(n),
  );
  const limit = props.max == null || Number.isNaN(props.max) ? children.length : Math.max(0, Math.floor(props.max));
  if (children.length <= limit) return children;
  const hiddenCount = children.length - limit;
  const first = children[0].props ?? {};
  // First in the DOM: the group is `row-reverse`, so that is its visual right end, and it
  // overlaps and paints beneath its neighbour exactly as every other avatar does.
  return [
    h(CuiAvatar, {
      class: "cui-avatar-group__overflow",
      // Three characters is all an avatar's initials font fits; the label keeps the exact count.
      initials: hiddenCount > 99 ? "99+" : `+${hiddenCount}`,
      color: OVERFLOW_COLOR,
      size: first.size,
      shape: first.shape,
      role: "img",
      "aria-label": messages.value.avatar.overflow(hiddenCount),
    }),
    ...children.slice(0, limit),
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

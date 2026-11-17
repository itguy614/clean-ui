<script setup lang="ts">
import { computed, ref, watch } from "vue";
import CuiBackdrop from "./CuiBackdrop.vue";
import { usePresence } from "../composables/usePresence";
import { useScopedTheme } from "../composables/useScopedTheme";
import { subtreeTransition } from "../utils/motion";
import type { TailwindBreakpoint } from "../types/grid";
import { useOverlayStackProvider } from "../composables/useOverlayStack";
import { useSlideoverStackLayout } from "../composables/useSlideoverStackLayout";

export interface CuiSlideoverStackProps {
  /**
   * Which way panels already open move when another is added: `inward` (default) slides them
   * toward the open side while the newest enters at the docked edge; `outward` leaves them
   * where they are and attaches the newest on the open side. A closing panel reverses it.
   */
  push?: "inward" | "outward";
  /**
   * Whether the stack's panels are modal. `false` makes every panel co-active: none makes
   * another inert, nothing traps focus, and Escape closes the panel focus is in. A panel's
   * own `modal` prop still overrides it.
   */
  modal?: boolean;
  /** `auto` attaches panels edge to edge and falls back to peeking when they no longer fit; `peek` always peeks */
  mode?: "auto" | "peek";
  /** Space kept free on the open side of the viewport, in px: the stack never reaches it (default 32, the 2rem a lone slideover leaves) */
  gap?: number;
  /** The narrowest a panel may be squeezed to before the stack falls back to peeking, in px */
  minWidth?: number;
  /** In peek mode, how far each lower panel's edge shows beyond the one above it, in px */
  peekOffset?: number;
  /** In peek mode, how many layers show their own edge; deeper ones share the last offset */
  maxPeek?: number;
  /** Below this breakpoint the stack peeks instead of attaching panels edge to edge */
  peekBelow?: TailwindBreakpoint;
}

const props = withDefaults(defineProps<CuiSlideoverStackProps>(), {
  push: "inward",
  modal: true,
  mode: "auto",
  gap: 32,
  minWidth: 320,
  peekOffset: 32,
  maxPeek: 3,
  peekBelow: "sm",
});

const stack = useOverlayStackProvider({ modal: () => props.modal });

// The one backdrop of the group (#41). The stack draws it, once, for as long as any panel is
// open, so opening a panel, closing one or changing the active set never remounts it or
// restarts its fade: it fades in with the first panel and out with the last. It sits behind
// the bottom panel throughout, and takes its props from the lowest active panel.
const open = computed(() => stack.entries.length > 0);
const { present, onAfterLeave } = usePresence(() => open.value);
const shown = ref(false);
// The theme scope around the stack, on the teleported backdrop (#418).
const themeScope = useScopedTheme(() => present.value);
watch(
  open,
  (now) => {
    if (!now) shown.value = false;
    // After a paint, so the fade runs from the hidden state.
    else requestAnimationFrame(() => (shown.value = open.value));
  },
  { flush: "sync" },
);
let lastProps: Record<string, unknown> = {};
let lastZ = "var(--cui-z-overlay, 9990)";
const backdrop = computed(() => {
  const entry = stack.backdropEntry();
  const bottom = stack.bottomEntry();
  if (entry) lastProps = entry.backdrop?.() ?? {};
  // Always just behind the bottom panel, so it never changes layer; the panels above it that are
  // out of the active set dim themselves (useOverlayStack).
  if (bottom) lastZ = stack.zIndex(bottom);
  return { props: lastProps, zIndex: lastZ };
});

useSlideoverStackLayout(stack, {
  mode: () => props.mode,
  push: () => props.push,
  gap: () => props.gap,
  minWidth: () => props.minWidth,
  peekOffset: () => props.peekOffset,
  maxPeek: () => props.maxPeek,
  peekBelow: () => props.peekBelow,
});
</script>

<template>
  <Teleport to="body">
    <Transition v-bind="subtreeTransition" @after-leave="onAfterLeave">
      <CuiBackdrop
        v-if="present"
        v-show="open"
        class="cui-slideover-stack__backdrop"
        :class="themeScope"
        v-bind="backdrop.props"
        :visible="shown"
        :style="{ position: 'fixed', zIndex: backdrop.zIndex }"
        @click="stack.closeTop()"
      />
    </Transition>
  </Teleport>
  <slot />
</template>

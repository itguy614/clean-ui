<script setup lang="ts">
import type { TailwindBreakpoint } from "../types/grid";
import { useOverlayStackProvider } from "../composables/useOverlayStack";

export interface CuiSlideoverStackProps {
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

withDefaults(defineProps<CuiSlideoverStackProps>(), {
  gap: 32,
  minWidth: 320,
  peekOffset: 32,
  maxPeek: 3,
  peekBelow: "sm",
});

useOverlayStackProvider();
</script>

<template>
  <slot />
</template>

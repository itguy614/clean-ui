<script setup lang="ts">
/**
 * The frame every app-shell demo runs in: a bordered, fixed-height box that owns its own
 * scrolling, so a shell can be shown whole without taking over the real page.
 *
 * Nothing inside a frame is `sticky`. A sticky `CuiNavbar` writes `--cui-navbar-height` and
 * `scroll-padding-top` onto `<html>` and measures against the *page* scroll, so one in a
 * frame would fight this site's own sticky header. The frame scrolls instead, and its regions
 * (navbar, sidebar, content) are laid out so that only the content scrolls. See `ShellPage`.
 */
withDefaults(defineProps<{ label: string; height?: string }>(), { height: "32rem" });
</script>

<template>
  <div class="cui-shell-frame" role="group" :aria-label="`${label}, live demo`" :style="{ height }">
    <slot />
  </div>
</template>

<style>
/* Not scoped: the demo content is slot content, and the layout helpers below are used by it.
   The cui- prefix keeps the typography layer's prose rules off these elements. */
.cui-shell-frame {
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
  border: 1px solid var(--cui-border);
  border-radius: var(--cui-radius-lg, 0.5rem);
  background: var(--cui-surface-base);
  color: var(--cui-text-body);
  position: relative;
}

.cui-shell-frame__body {
  display: flex;
  flex: 1;
  min-height: 0;
}

.cui-shell-frame__main {
  flex: 1;
  min-width: 0;
  overflow: auto;
}

.cui-shell-frame__side {
  flex-shrink: 0;
  width: 14rem;
  min-height: 0;
}

.cui-shell-frame__pad {
  padding: 1.25rem;
}

.cui-shell-title {
  margin: 0 0 0.25rem;
  font-size: 1.125rem;
  font-weight: 600;
  line-height: 1.3;
  color: var(--cui-text-emphasis);
}

.cui-shell-text {
  margin: 0 0 0.75rem;
  font-size: 0.875rem;
  color: var(--cui-text-secondary);
}
</style>

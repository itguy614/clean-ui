<script setup lang="ts">
/**
 * The frame every app-shell demo runs in: a bordered, fixed-height box that owns its own
 * scrolling, so a shell can be shown whole without taking over the real page.
 *
 * Nothing inside a frame is `sticky`. A sticky `CuiNavbar` writes `--cui-navbar-height` and
 * `scroll-padding-top` onto `<html>` and measures against the *page* scroll, so one in a
 * frame would fight this site's own sticky header. The frame scrolls instead, and its regions
 * are laid out so that only the content scrolls. See `ShellPage`.
 *
 * Two layouts, by what owns the top: a navbar-first shell puts the navbar directly in the frame,
 * above a `cui-shell-frame__body` row of sidebar and content; a sidebar-first shell puts only the
 * body row in the frame, with the sidebar at full height and a `cui-shell-frame__col` beside it
 * holding the bar over the content.
 */
import { CuiCard } from "@itguy614/clean-ui";

withDefaults(defineProps<{ label: string; height?: string }>(), { height: "32rem" });
</script>

<template>
  <!-- The frame is a CuiCard (outline): its surface, border and radius come from the library, and
       only the layout below is ours. -->
  <CuiCard variant="outline" class="cui-shell-frame" role="group" :aria-label="`${label}, live demo`" :style="{ height }">
    <slot />
  </CuiCard>
</template>

<style>
/* Not scoped: the demo content is slot content, and the layout helpers below are used by it.
   The cui- prefix keeps the typography layer's prose rules off these elements. */
.cui-shell-frame {
  display: flex;
  flex-direction: column;
  min-height: 0;
  color: var(--cui-text-body);
  position: relative;
}

.cui-shell-frame__body {
  display: flex;
  flex: 1;
  min-height: 0;
}

/* A column beside a full-height sidebar: a bar over the content, which scrolls on its own. */
.cui-shell-frame__col {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
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

.cui-shell-bar-title {
  margin: 0;
  flex: 1;
}

.cui-shell-text {
  margin: 0 0 0.75rem;
  font-size: 0.875rem;
  color: var(--cui-text-secondary);
}
</style>

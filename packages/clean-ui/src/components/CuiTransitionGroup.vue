<script setup lang="ts">
import { computed } from "vue";
import { pinOutOfFlow, type TransitionDuration, type TransitionPreset, type TransitionSide } from "../utils/motion";

export interface CuiTransitionGroupProps {
  /** The motion: a plain `fade`, a `fade-slide` from one edge, a `grow` from 0.95, or a `collapse` of the height. */
  preset?: TransitionPreset;
  /** `fade-slide` only: the edge items slide in from (and back out to). */
  side?: TransitionSide;
  /** The enter's duration token, for slower or snappier items than `base`. The exit stays on `fast`. */
  duration?: TransitionDuration;
  /** The element to render, as for Vue's `<TransitionGroup tag>`. With none, the items render straight into the parent. */
  tag?: string;
  /** Play the enter on first render too. */
  appear?: boolean;
  /** The class an item takes while it moves to its new place. The default slides it over `base` on `--cui-ease-in-out`. */
  moveClass?: string;
}

// A group with no `tag` has a fragment root, which can't carry a cui-* class; with a tag
// it renders that element, which does. Events (`@after-leave` …) and anything else fall
// through to the <TransitionGroup>.
const props = withDefaults(defineProps<CuiTransitionGroupProps>(), {
  preset: "fade",
  side: "bottom",
});

// The presets' own classes (components-shared.css), spelled out because the side and the
// duration have to ride on them: a raw `name` would give no way to add either.
const classes = computed(() => {
  const base = `cui-transition-${props.preset}`;
  const side = props.preset === "fade-slide" ? ` cui-transition-side-${props.side}` : "";
  const collapse = props.preset === "collapse" ? " cui-transition-collapse" : "";
  const duration = props.duration && props.duration !== "base" ? ` cui-transition-duration-${props.duration}` : "";
  return {
    enterFromClass: `${base}-enter-from${side}`,
    enterActiveClass: `${base}-enter-active${collapse}${duration}`,
    enterToClass: `${base}-enter-to`,
    leaveFromClass: `${base}-leave-from`,
    leaveActiveClass: `${base}-leave-active${collapse}`,
    leaveToClass: `${base}-leave-to${side}`,
  };
});
</script>

<template>
  <TransitionGroup
    :tag="tag"
    :appear="appear"
    :move-class="moveClass ?? 'cui-transition-move'"
    v-bind="{ ...classes, ...(tag ? { class: 'cui-transition-group' } : {}) }"
    @before-leave="pinOutOfFlow"
  >
    <slot />
  </TransitionGroup>
</template>

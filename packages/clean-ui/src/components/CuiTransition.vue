<script setup lang="ts">
import { presetTransition, type TransitionDuration, type TransitionPreset, type TransitionSide } from "../utils/motion";

export interface CuiTransitionProps {
  /** The motion: a plain `fade`, a `fade-slide` from one edge, a `grow` from 0.95, or a `collapse` of the height. */
  preset?: TransitionPreset;
  /** `fade-slide` only: the edge the content slides in from (and back out to). */
  side?: TransitionSide;
  /** The enter's duration token, for slower or snappier content than `base`. The exit stays on `fast`. */
  duration?: TransitionDuration;
  /** Vue's `<Transition mode>`: what to do when the content swaps for other content. */
  mode?: "in-out" | "out-in" | "default";
  /** Play the enter on first render too. */
  appear?: boolean;
}

// A component with a non-element root (<Transition>) can't carry a cui-* class: the
// content it wraps is the consumer's, and carries theirs. Events (`@after-leave` …) and
// anything else fall through to the <Transition>.
const props = withDefaults(defineProps<CuiTransitionProps>(), { preset: "fade", side: "bottom" });

const hooks = presetTransition(() => ({ preset: props.preset, side: props.side, duration: props.duration }));
</script>

<template>
  <Transition v-bind="hooks" :mode="mode" :appear="appear">
    <slot />
  </Transition>
</template>

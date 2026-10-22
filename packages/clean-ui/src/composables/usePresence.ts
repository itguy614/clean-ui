import { ref, watch, type Ref } from "vue";

/**
 * Whether an overlay's panel should be in the DOM, for a `<Transition>` exit (#263).
 *
 * The panel is rendered `v-if="present" v-show="open"` inside a `<Transition>` that calls
 * `onAfterLeave`. `present` turns true as `open` does and stays true through the leave, so
 * the exit plays and a re-open mid-exit reverses the same element from where it is, rather
 * than removing it and fading a new one in from nothing (a v-if toggled mid-leave does
 * that). Once the leave has finished, `present` turns false and the panel unmounts, so a
 * closed overlay keeps nothing in the DOM.
 *
 * Internal. `open` is read on change, so pass a getter.
 */
export function usePresence(open: () => boolean): { present: Ref<boolean>; onAfterLeave: () => void } {
  const present = ref(open());
  watch(open, (now) => {
    if (now) present.value = true;
  });
  // A leave that a re-open cancelled fires leave-cancelled, never after-leave.
  const onAfterLeave = () => {
    if (!open()) present.value = false;
  };
  return { present, onAfterLeave };
}

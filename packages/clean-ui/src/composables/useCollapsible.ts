import { ref, computed, watch, onMounted } from "vue";
import { afterAnimations } from "../utils/motion";

/**
 * Whether the browser supports `hidden="until-found"`: content hidden but still reachable by
 * find-in-page, which fires `beforematch` on it. Chromium has it; elsewhere the attribute
 * would read as a plain `hidden`, which find-in-page can't see into, so those browsers get
 * `inert` plus `visibility: hidden` instead.
 */
function supportsUntilFound(): boolean {
  return typeof HTMLElement !== "undefined" && "onbeforematch" in HTMLElement.prototype;
}

/**
 * The hidden state of a collapsible's content (Accordion, Fieldset, TreeNode, #270). The
 * collapse itself is CSS (`grid-template-rows: 0fr → 1fr` on the element carrying `panel`);
 * this keeps what it hides out of the tab order and the accessibility tree once it is shut,
 * without cutting the animation short:
 *
 * - **Opening:** the content is revealed at once, in the same update that starts the
 *   transition.
 * - **Closing:** the content stays revealed until the collapse has finished, then is hidden.
 *   Nothing is waited for when no transition started (a zero duration, reduced motion,
 *   `transition: none`, jsdom), so it is hidden at once.
 * - **Find-in-page:** where `hidden="until-found"` is supported, a match inside shut content
 *   fires `beforematch`, which calls `reveal` so the owner opens.
 *
 * Bind `panel` as the template ref of the element that is both the grid and the thing to
 * hide, `hiddenAttr` / `inertAttr` with the `.attr` modifier (`:hidden.attr`: a `hidden` DOM
 * property set to "until-found" is not reliable across browsers) and
 * `@beforematch="onBeforeMatch"`. Pair with CSS `[inert] { visibility: hidden }`.
 *
 * Internal. `open` is read on change, so pass a getter.
 */
export function useCollapsible(open: () => boolean, reveal: () => void) {
  const panel = ref<HTMLElement>();
  /** True once the collapse has finished, and from the start when collapsed. */
  const settled = ref(!open());
  // Decided on mount, so a server render and the first client render agree (both inert).
  const untilFound = ref(false);
  onMounted(() => {
    untilFound.value = supportsUntilFound();
  });

  // Each change supersedes the last: a collapse reversed mid-flight must not hide.
  let generation = 0;
  watch(
    open,
    (isOpen) => {
      const mine = ++generation;
      if (isOpen) {
        settled.value = false;
      } else if (panel.value) {
        afterAnimations(panel.value, () => {
          if (mine === generation) settled.value = true;
        });
      } else {
        settled.value = true;
      }
    },
    // After the DOM has the collapsed state, so the transition has started and can be seen.
    { flush: "post" },
  );

  return {
    panel,
    hiddenAttr: computed(() => (settled.value && untilFound.value ? "until-found" : undefined)),
    inertAttr: computed(() => (settled.value && !untilFound.value ? true : undefined)),
    onBeforeMatch: () => {
      if (!open()) reveal();
    },
  };
}

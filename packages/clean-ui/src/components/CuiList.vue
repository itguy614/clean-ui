<script setup lang="ts">
import { computed } from "vue";
import type { CuiRounded, HideableProps } from "../types/common";
import { RADIUS_SCALE } from "../utils/sizing";
import { useListProvider, type ListVariant } from "./list-context";

export interface CuiListProps extends HideableProps {
  /**
   * `plain`: rows on the page's own background. `inset`: the rows read as one rounded card,
   * like a settings app's grouped list — each row paints the card's fill and border, and
   * the first and last round their outer corners.
   */
  variant?: ListVariant;
  /**
   * The list element. `ul` and `ol` render real list items (announced as "list, N items");
   * `div` renders plain rows, for a stack that is not a list.
   */
  as?: "ul" | "ol" | "div";
  /** Draw a divider between rows. An `inset` list always has them. */
  divided?: boolean;
  /**
   * Corner radius of an `inset` list's outer corners, and of a row's hover fill. Unset, it
   * follows `--cui-card-radius`, so the list matches the cards around it.
   */
  rounded?: CuiRounded;
}

const props = withDefaults(defineProps<CuiListProps>(), {
  variant: "plain",
  as: "ul",
  divided: false,
  hidden: false,
});

const isList = computed(() => props.as === "ul" || props.as === "ol");

useListProvider({
  get variant() {
    return props.variant;
  },
  get divided() {
    return props.divided || props.variant === "inset";
  },
  get itemTag() {
    return isList.value ? "li" : "div";
  },
});

// Only the radius depends on a prop; every other default lives in CuiListItem's stylesheet,
// read through the public `--cui-list-*` tokens (see "Themeable Properties" in CLAUDE.md).
const listStyle = computed(() => (props.rounded ? { "--_list-radius": RADIUS_SCALE[props.rounded] } : undefined));
</script>

<template>
  <!-- `role="list"`: Safari drops a list's semantics once its markers are removed with
       `list-style: none`, and this list never shows markers. -->
  <component
    :is="as"
    v-show="!hidden"
    class="cui-list"
    :class="{ 'cui-list--inset': variant === 'inset' }"
    :role="isList ? 'list' : undefined"
    :style="listStyle"
  >
    <slot />
  </component>
</template>

<style scoped>
.cui-list {
  display: flex;
  flex-direction: column;
  list-style: none;
  margin: 0;
  padding: 0;
}
</style>

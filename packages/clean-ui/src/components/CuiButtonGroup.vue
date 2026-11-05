<script setup lang="ts">
import { useTemplateRef } from "vue";
import type { HideableProps, AriaLabelableProps } from "../types/common";
import { useButtonGroupProvider } from "../composables/useButtonGroup";
import type { ButtonGroupOrientation as Orientation } from "./button-group-context";

export type ButtonGroupOrientation = Orientation;

export interface CuiButtonGroupProps extends AriaLabelableProps, HideableProps {
  /** Accessible group name, when no `aria-labelledby` target exists. */
  label?: string;
  /** Layout direction */
  orientation?: ButtonGroupOrientation;
}

const props = withDefaults(defineProps<CuiButtonGroupProps>(), {
  orientation: "horizontal",
  hidden: false,
});

// Each button reads its own place from this and sets its own corners (#444).
useButtonGroupProvider({ orientation: () => props.orientation, el: useTemplateRef("groupRef") });
</script>

<template>
  <div
    ref="groupRef"
    v-show="!hidden"
    class="cui-button-group"
    :class="`cui-button-group--${orientation}`"
    role="group"
    :id="id"
    :aria-labelledby="ariaLabelledby"
    :aria-describedby="ariaDescribedby"
    :aria-label="ariaLabelledby ? undefined : label"
  >
    <slot />
  </div>
</template>

<style scoped>
/* Merged buttons share their borders, so one shrinking on press (#261) would open seams
   against its neighbours. A token, not a rule, so a group can still opt back in. */
:where(.cui-button-group) {
  --cui-press-scale: 1;
}

.cui-button-group {
  display: inline-flex;
}

.cui-button-group--horizontal {
  flex-direction: row;
}

.cui-button-group--vertical {
  flex-direction: column;
}

/* Corners, shared borders and the stacking of a hovered, pressed or focused button belong to
   the buttons themselves, from their place in the group (#444): `.cui-button--flat-*`,
   `--seam-*` and `--grouped` in `styles/components-shared.css`. */
</style>

<script setup lang="ts">
export type ButtonGroupOrientation = "horizontal" | "vertical";

export interface CuiButtonGroupProps {
  /** Layout direction */
  orientation?: ButtonGroupOrientation;
  /** Hide the component */
  hidden?: boolean;
}

withDefaults(defineProps<CuiButtonGroupProps>(), {
  orientation: "horizontal",
  hidden: false,
});
</script>

<template>
  <div
    v-show="!hidden"
    class="cui-button-group"
    :class="`cui-button-group--${orientation}`"
    role="group"
  >
    <slot />
  </div>
</template>

<style scoped>
.cui-button-group {
  display: inline-flex;
}

.cui-button-group--horizontal {
  flex-direction: row;
}

.cui-button-group--vertical {
  flex-direction: column;
}

/* Strip inner border-radius on horizontal buttons */
.cui-button-group--horizontal > :deep(.cui-button:not(:first-child):not(:last-child)),
.cui-button-group--horizontal > :deep(.cui-dropdown:not(:first-child):not(:last-child) .cui-button) {
  border-radius: 0 !important;
}

.cui-button-group--horizontal > :deep(.cui-button:first-child:not(:last-child)),
.cui-button-group--horizontal > :deep(.cui-dropdown:first-child:not(:last-child) .cui-button) {
  border-top-right-radius: 0 !important;
  border-bottom-right-radius: 0 !important;
}

.cui-button-group--horizontal > :deep(.cui-button:last-child:not(:first-child)),
.cui-button-group--horizontal > :deep(.cui-dropdown:last-child:not(:first-child) .cui-button) {
  border-top-left-radius: 0 !important;
  border-bottom-left-radius: 0 !important;
}

/* Remove double borders between horizontal buttons */
.cui-button-group--horizontal > :deep(.cui-button + .cui-button),
.cui-button-group--horizontal > :deep(.cui-dropdown + .cui-button),
.cui-button-group--horizontal > :deep(.cui-button + .cui-dropdown .cui-button),
.cui-button-group--horizontal > :deep(.cui-dropdown + .cui-dropdown .cui-button) {
  margin-left: -1px;
}

/* Strip inner border-radius on vertical buttons */
.cui-button-group--vertical > :deep(.cui-button:not(:first-child):not(:last-child)),
.cui-button-group--vertical > :deep(.cui-dropdown:not(:first-child):not(:last-child) .cui-button) {
  border-radius: 0 !important;
}

.cui-button-group--vertical > :deep(.cui-button:first-child:not(:last-child)),
.cui-button-group--vertical > :deep(.cui-dropdown:first-child:not(:last-child) .cui-button) {
  border-bottom-left-radius: 0 !important;
  border-bottom-right-radius: 0 !important;
}

.cui-button-group--vertical > :deep(.cui-button:last-child:not(:first-child)),
.cui-button-group--vertical > :deep(.cui-dropdown:last-child:not(:first-child) .cui-button) {
  border-top-left-radius: 0 !important;
  border-top-right-radius: 0 !important;
}

/* Remove double borders between vertical buttons */
.cui-button-group--vertical > :deep(.cui-button + .cui-button),
.cui-button-group--vertical > :deep(.cui-dropdown + .cui-button),
.cui-button-group--vertical > :deep(.cui-button + .cui-dropdown .cui-button),
.cui-button-group--vertical > :deep(.cui-dropdown + .cui-dropdown .cui-button) {
  margin-top: -1px;
}

/* Ensure hovered/focused/active button appears above siblings so borders aren't hidden */
.cui-button-group > :deep(.cui-button:hover),
.cui-button-group > :deep(.cui-button:focus-visible),
.cui-button-group > :deep(.cui-button[aria-pressed="true"]),
.cui-button-group > :deep(.cui-button.cui-button--active),
.cui-button-group > :deep(.cui-radio-button--active),
.cui-button-group > :deep([aria-checked="true"]),
.cui-button-group > :deep(.cui-dropdown .cui-button:hover),
.cui-button-group > :deep(.cui-dropdown .cui-button:focus-visible) {
  z-index: 1;
  position: relative;
}
</style>

<script setup lang="ts">
import { ref, computed, watch, type Component } from "vue";
import { useCuiId } from "../composables/useCuiId";
import type { CuiColor, HideableProps, OverlayFocusProps, TitleAsProps } from "../types/common";
import CuiModal from "./CuiModal.vue";
import CuiModalBody from "./CuiModalBody.vue";
import CuiModalFooter from "./CuiModalFooter.vue";
import CuiButton from "./CuiButton.vue";
import CuiInput from "./CuiInput.vue";
import CuiIcon from "./CuiIcon.vue";
import { useMessages } from "../composables/useMessages";
import { useHeadingLevel } from "../utils/configure";
import { IconInfo } from "../icons/generated/info";
import { IconSealQuestion } from "../icons/generated/seal-question";
import { IconWarning } from "../icons/generated/warning";
import { IconWarningCircle } from "../icons/generated/warning-circle";
import { IconX } from "../icons/generated/x";

export type ConfirmDialogVariant = "danger" | "warning" | "info" | "primary";

export interface CuiConfirmDialogProps extends HideableProps, TitleAsProps, OverlayFocusProps {
  /** Control visibility (v-model:visible) */
  visible?: boolean;
  /** Dialog title */
  title?: string;
  /** Confirmation message */
  message?: string;
  /**
   * Variant — picks the icon and the confirm button's colour. `primary` is for a routine,
   * non-destructive confirm.
   */
  variant?: ConfirmDialogVariant;
  /** Confirm button colour, overriding the variant's. The icon tile keeps the variant's colour. */
  confirmColor?: CuiColor;
  /** Confirm button text */
  confirmText?: string;
  /** Cancel button text */
  cancelText?: string;
  /** Require typing this word to enable the confirm button */
  confirmWord?: string;
  /** Prompt text shown above the confirmation input */
  confirmPrompt?: string;
  /**
   * Icon — a registered name or an icon component (auto-selected by variant if omitted).
   * `false` renders no icon tile; the title then sits flush left.
   */
  icon?: string | Component | false;
  /** Loading state on confirm button */
  loading?: boolean;
}

const props = withDefaults(defineProps<CuiConfirmDialogProps>(), {
  visible: false,
  variant: "danger",
  loading: false,
  hidden: false,
  // `icon` accepts `false`, so Vue's Boolean casting would turn an absent prop into `false`
  // and hide the tile by default. An explicit default keeps "absent" meaning "the variant's".
  icon: undefined,
  // Same reason as CuiModal: `returnFocus` accepts `false`, which Vue would otherwise cast an
  // absent prop to, and stop returning focus at all.
  initialFocus: undefined,
  returnFocus: undefined,
});

// Its own `titleAs`, else the app's default (#149), else the library's.
const headingTag = useHeadingLevel("confirmDialog", () => props.titleAs);

// The dialog assembles its own header, so CuiModal has no `title` to name itself from —
// without this the confirm dialog had no accessible name at all (#158).
const titleId = useCuiId("confirm-dialog-title");

const messages = useMessages();

// Prop override > provider catalog > built-in default.
const resolvedTitle = computed(() => props.title ?? messages.value.confirmDialog.title);
const resolvedConfirmText = computed(() => props.confirmText ?? messages.value.confirmDialog.confirm);
const resolvedCancelText = computed(() => props.cancelText ?? messages.value.confirmDialog.cancel);

const emit = defineEmits<{
  "update:visible": [value: boolean];
  confirm: [];
  cancel: [];
  /** The entry has finished and focus is in place (#437). */
  "after-enter": [];
  /** The exit has finished and focus has been returned (#437). */
  "after-leave": [];
}>();

const typedWord = ref("");

watch(
  () => props.visible,
  (open) => {
    if (open) typedWord.value = "";
  },
);

const variantConfig: Record<ConfirmDialogVariant, { role: CuiColor; icon: Component }> = {
  danger: { role: "error", icon: IconWarningCircle },
  warning: { role: "warning", icon: IconWarning },
  info: { role: "info", icon: IconInfo },
  // Not IconQuestion: that is CuiIcon's fallback glyph for an unknown name, so a routine
  // confirm would look like a broken icon and an `icon` typo would go unnoticed.
  primary: { role: "primary", icon: IconSealQuestion },
};

const cfg = computed(() => variantConfig[props.variant]);

const resolvedConfirmColor = computed(() => props.confirmColor ?? cfg.value.role);

// The variant's tint, for the icon tile and the typed-word prompt: private properties the
// stylesheet reads back through `--cui-confirm-dialog-bg` / `-border` / `-color`.
const accent = computed(() => ({
  "--_confirm-dialog-bg": `var(--cui-${cfg.value.role}-bg)`,
  "--_confirm-dialog-border": `var(--cui-${cfg.value.role}-border)`,
  "--_confirm-dialog-color": `var(--cui-${cfg.value.role})`,
}));
// The prompt is a tinted box with no icon: it has no use for the colour.
const promptAccent = computed(() => ({
  "--_confirm-dialog-bg": accent.value["--_confirm-dialog-bg"],
  "--_confirm-dialog-border": accent.value["--_confirm-dialog-border"],
}));

// `false` hides the tile; anything else falsy (unset, "") falls back to the variant's icon.
// CuiIcon takes a name and a component as separate props, so forward by type.
const tileIcon = computed(() => {
  if (props.icon === false) return null;
  const icon = props.icon || cfg.value.icon;
  return typeof icon === "string" ? { name: icon } : { icon };
});

const confirmDisabled = computed(() => {
  if (!props.confirmWord) return false;
  return typedWord.value.trim().toLowerCase() !== props.confirmWord.trim().toLowerCase();
});

const defaultPrompt = computed(() =>
  messages.value.confirmDialog.typePrompt(props.confirmWord ?? ""),
);

function close() {
  emit("update:visible", false);
}

function onConfirm() {
  if (confirmDisabled.value) return;
  emit("confirm");
}

function onCancel() {
  emit("cancel");
  close();
}
</script>

<template>
  <CuiModal class="cui-confirm-dialog" :hidden="hidden" :visible="visible" size="sm" no-close-button :aria-labelledby="titleId" :initial-focus="initialFocus" :return-focus="returnFocus" @update:visible="emit('update:visible', $event)" @after-enter="emit('after-enter')" @after-leave="emit('after-leave')">
    <!-- Custom header with icon badge -->
    <div class="cui-confirm-dialog__header">
      <!-- Icon badge -->
      <div v-if="tileIcon" class="cui-confirm-dialog__icon" aria-hidden="true" :style="accent">
        <CuiIcon v-bind="tileIcon" size="1.25rem" />
      </div>

      <div class="cui-confirm-dialog__main">
        <!-- Title -->
        <component :is="headingTag" :id="titleId" class="cui-confirm-dialog__title">
          {{ resolvedTitle }}
        </component>

        <!-- Message -->
        <div v-if="message || $slots.default" class="cui-confirm-dialog__message">
          <slot>{{ message }}</slot>
        </div>
      </div>

      <!-- Close button -->
      <button type="button" class="cui-confirm-dialog__close" :aria-label="messages.close" @click="onCancel">
        <CuiIcon :icon="IconX" size="1rem" />
      </button>
    </div>

    <CuiModalBody>
      <!-- Confirmation input -->
      <div v-if="confirmWord">
        <div class="cui-confirm-dialog__prompt" :style="promptAccent">
          {{ confirmPrompt || defaultPrompt }}
        </div>
        <CuiInput
          v-model="typedWord"
          :placeholder="confirmWord"
          size="sm"
          @keydown.enter="onConfirm"
        />
      </div>
    </CuiModalBody>

    <CuiModalFooter>
      <div class="cui-confirm-dialog__actions">
        <CuiButton variant="outline" size="sm" @click="onCancel">
          {{ resolvedCancelText }}
        </CuiButton>
        <CuiButton
          variant="solid"
          size="sm"
          :color="resolvedConfirmColor"
          :disabled="confirmDisabled || loading"
          @click="onConfirm"
        >
          <template v-if="loading" #prefix>
            <span class="cui-confirm-dialog__spinner" />
          </template>
          {{ resolvedConfirmText }}
        </CuiButton>
      </div>
    </CuiModalFooter>
  </CuiModal>
</template>

<style scoped>
/*
 * Every themeable rule is a whole :where(), so a consumer's plain `.cui-confirm-dialog__title { … }`
 * at (0,1,0) wins without !important; structure (display, flex, size) keeps normal specificity.
 * The icon tile and the typed-word prompt share the variant's tint, which the component emits as
 * private --_confirm-dialog-bg / -border / -color and these rules read through the public tokens.
 */
.cui-confirm-dialog__header {
  display: flex;
  align-items: flex-start;
}
:where(.cui-confirm-dialog__header) {
  gap: var(--cui-confirm-dialog-gap, calc(0.875rem * var(--cui-density-scale, 1)));
  padding: calc(1.25rem * var(--cui-density-scale, 1)) var(--cui-confirm-dialog-px, calc(1.5rem * var(--cui-density-scale, 1))) 0;
}

.cui-confirm-dialog__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 2.5rem;
  height: 2.5rem;
}
:where(.cui-confirm-dialog__icon) {
  border-radius: 0.625rem;
  background: var(--cui-confirm-dialog-bg, var(--_confirm-dialog-bg));
  color: var(--cui-confirm-dialog-color, var(--_confirm-dialog-color));
  border: 1px solid var(--cui-confirm-dialog-border, var(--_confirm-dialog-border));
}

.cui-confirm-dialog__main {
  flex: 1;
  min-width: 0;
}

:where(.cui-confirm-dialog__title) {
  font-size: 1.0625rem;
  font-weight: 600;
  line-height: 1.3;
  color: var(--cui-text-emphasis);
  margin: calc(0.125rem * var(--cui-density-scale, 1)) 0 0;
}

:where(.cui-confirm-dialog__message) {
  font-size: 0.875rem;
  color: var(--cui-text-secondary);
  line-height: 1.55;
  margin-top: calc(0.375rem * var(--cui-density-scale, 1));
}

.cui-confirm-dialog__close {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 1.75rem;
  height: 1.75rem;
  cursor: pointer;
}
:where(.cui-confirm-dialog__close) {
  padding: 0;
  border: none;
  border-radius: 0.25rem;
  background: none;
  color: var(--cui-text-tertiary);
  margin-top: calc(-0.125rem * var(--cui-density-scale, 1));
  margin-right: calc(-0.25rem * var(--cui-density-scale, 1));
}

:where(.cui-confirm-dialog__prompt) {
  font-size: 0.8125rem;
  color: var(--cui-text-secondary);
  margin-bottom: calc(0.5rem * var(--cui-density-scale, 1));
  line-height: 1.4;
  padding: calc(0.625rem * var(--cui-density-scale, 1)) calc(0.75rem * var(--cui-density-scale, 1));
  background: var(--cui-confirm-dialog-bg, var(--_confirm-dialog-bg));
  border-radius: 0.375rem;
  border: 1px solid var(--cui-confirm-dialog-border, var(--_confirm-dialog-border));
}

.cui-confirm-dialog__actions {
  display: flex;
  justify-content: flex-end;
}
:where(.cui-confirm-dialog__actions) {
  gap: calc(0.5rem * var(--cui-density-scale, 1));
}

.cui-confirm-dialog__spinner {
  display: inline-block;
  width: 0.875rem;
  height: 0.875rem;
}
:where(.cui-confirm-dialog__spinner) {
  border: 2px solid currentColor;
  border-top-color: transparent;
  border-radius: 50%;
  animation: cui-spin 0.75s linear infinite;
}
</style>

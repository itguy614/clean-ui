<script setup lang="ts">
import { ref, computed, watch } from "vue";
import type { CuiColor, HideableProps } from "../types/common";
import CuiModal from "./CuiModal.vue";
import CuiModalBody from "./CuiModalBody.vue";
import CuiModalFooter from "./CuiModalFooter.vue";
import CuiButton from "./CuiButton.vue";
import CuiInput from "./CuiInput.vue";
import CuiIcon from "./CuiIcon.vue";
import { useMessages } from "../composables/useMessages";

export type ConfirmDialogVariant = "danger" | "warning" | "info";

export interface CuiConfirmDialogProps extends HideableProps {
  /** Control visibility (v-model:visible) */
  visible?: boolean;
  /** Dialog title */
  title?: string;
  /** Confirmation message */
  message?: string;
  /** Variant — affects icon and confirm button color */
  variant?: ConfirmDialogVariant;
  /** Confirm button text */
  confirmText?: string;
  /** Cancel button text */
  cancelText?: string;
  /** Require typing this word to enable the confirm button */
  confirmWord?: string;
  /** Prompt text shown above the confirmation input */
  confirmPrompt?: string;
  /** Icon name (auto-selected by variant if omitted) */
  icon?: string;
  /** Loading state on confirm button */
  loading?: boolean;
}

const props = withDefaults(defineProps<CuiConfirmDialogProps>(), {
  visible: false,
  variant: "danger",
  loading: false,
  hidden: false,
});

const messages = useMessages();

// Prop override > provider catalog > built-in default.
const resolvedTitle = computed(() => props.title ?? messages.value.confirmDialog.title);
const resolvedConfirmText = computed(() => props.confirmText ?? messages.value.confirmDialog.confirm);
const resolvedCancelText = computed(() => props.cancelText ?? messages.value.confirmDialog.cancel);

const emit = defineEmits<{
  "update:visible": [value: boolean];
  confirm: [];
  cancel: [];
}>();

const typedWord = ref("");

watch(
  () => props.visible,
  (open) => {
    if (open) typedWord.value = "";
  },
);

const variantConfig: Record<ConfirmDialogVariant, { color: CuiColor; icon: string }> = {
  danger: { color: "error", icon: "warning-circle" },
  warning: { color: "warning", icon: "warning" },
  info: { color: "info", icon: "info" },
};

const cfg = computed(() => variantConfig[props.variant]);

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
  <CuiModal :hidden="hidden" :visible="visible" size="sm" no-close-button @update:visible="emit('update:visible', $event)">
    <!-- Custom header with icon badge -->
    <div
      :style="{
        padding: 'calc(1.25rem * var(--cui-density-scale, 1)) calc(1.5rem * var(--cui-density-scale, 1)) 0',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 'calc(0.875rem * var(--cui-density-scale, 1))',
      }"
    >
      <!-- Icon badge -->
      <div
        :style="{
          width: '2.5rem',
          height: '2.5rem',
          borderRadius: '0.625rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: '0',
          background: `var(--cui-${cfg.color}-bg)`,
          color: `var(--cui-${cfg.color})`,
          border: `1px solid var(--cui-${cfg.color}-border)`,
        }"
      >
        <CuiIcon :name="icon || cfg.icon" size="1.25rem" />
      </div>

      <div style="flex: 1; min-width: 0;">
        <!-- Title -->
        <h2
          :style="{
            fontSize: '1.0625rem',
            fontWeight: '600',
            lineHeight: '1.3',
            color: 'var(--cui-text-emphasis)',
            margin: 'calc(0.125rem * var(--cui-density-scale, 1)) 0 0',
          }"
        >
          {{ resolvedTitle }}
        </h2>

        <!-- Message -->
        <div
          v-if="message || $slots.default"
          :style="{
            fontSize: '0.875rem',
            color: 'var(--cui-text-secondary)',
            lineHeight: '1.55',
            marginTop: 'calc(0.375rem * var(--cui-density-scale, 1))',
          }"
        >
          <slot>{{ message }}</slot>
        </div>
      </div>

      <!-- Close button -->
      <button
        type="button"
        :style="{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '1.75rem',
          height: '1.75rem',
          border: 'none',
          background: 'none',
          cursor: 'pointer',
          color: 'var(--cui-text-tertiary)',
          borderRadius: '0.25rem',
          flexShrink: '0',
          marginTop: 'calc(-0.125rem * var(--cui-density-scale, 1))',
          marginRight: 'calc(-0.25rem * var(--cui-density-scale, 1))',
        }"
        :aria-label="messages.close"
        @click="onCancel"
      >
        <CuiIcon name="x" size="1rem" />
      </button>
    </div>

    <CuiModalBody>
      <!-- Confirmation input -->
      <div v-if="confirmWord">
        <div
          :style="{
            fontSize: '0.8125rem',
            color: 'var(--cui-text-secondary)',
            marginBottom: 'calc(0.5rem * var(--cui-density-scale, 1))',
            lineHeight: '1.4',
            padding: 'calc(0.625rem * var(--cui-density-scale, 1)) calc(0.75rem * var(--cui-density-scale, 1))',
            background: `var(--cui-${cfg.color}-bg)`,
            borderRadius: '0.375rem',
            border: `1px solid var(--cui-${cfg.color}-border)`,
          }"
        >
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
      <div style="display: flex; gap: calc(0.5rem * var(--cui-density-scale, 1)); justify-content: flex-end;">
        <CuiButton variant="outline" size="sm" @click="onCancel">
          {{ resolvedCancelText }}
        </CuiButton>
        <CuiButton
          variant="solid"
          size="sm"
          :color="cfg.color"
          :disabled="confirmDisabled || loading"
          @click="onConfirm"
        >
          <template v-if="loading" #prefix>
            <span
              :style="{
                display: 'inline-block',
                width: '0.875rem',
                height: '0.875rem',
                border: '2px solid currentColor',
                borderTopColor: 'transparent',
                borderRadius: '50%',
                animation: 'cui-spin 0.75s linear infinite',
              }"
            />
          </template>
          {{ resolvedConfirmText }}
        </CuiButton>
      </div>
    </CuiModalFooter>
  </CuiModal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import type { ButtonColor } from "./CuiButton.vue";
import CuiModal from "./CuiModal.vue";
import CuiModalBody from "./CuiModalBody.vue";
import CuiModalFooter from "./CuiModalFooter.vue";
import CuiButton from "./CuiButton.vue";
import CuiInput from "./CuiInput.vue";
import CuiIcon from "./CuiIcon.vue";

export type ConfirmDialogVariant = "danger" | "warning" | "info";

export interface CuiConfirmDialogProps {
  /** Control visibility */
  modelValue?: boolean;
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
  /** Hide the component */
  hidden?: boolean;
}

const props = withDefaults(defineProps<CuiConfirmDialogProps>(), {
  modelValue: false,
  title: "Are you sure?",
  variant: "danger",
  confirmText: "Confirm",
  cancelText: "Cancel",
  loading: false,
  hidden: false,
});

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  confirm: [];
  cancel: [];
}>();

const typedWord = ref("");

watch(
  () => props.modelValue,
  (open) => {
    if (open) typedWord.value = "";
  },
);

const variantConfig: Record<ConfirmDialogVariant, { color: ButtonColor; icon: string }> = {
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
  `Please type <strong>${props.confirmWord}</strong> to confirm.`,
);

function close() {
  emit("update:modelValue", false);
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
  <CuiModal v-show="!hidden" :open="modelValue" size="sm" no-close-button @update:open="emit('update:modelValue', $event)">
    <!-- Custom header with icon badge -->
    <div
      :style="{
        padding: '1.25rem 1.5rem 0',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.875rem',
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
            margin: '0.125rem 0 0',
          }"
        >
          {{ title }}
        </h2>

        <!-- Message -->
        <div
          v-if="message || $slots.default"
          :style="{
            fontSize: '0.875rem',
            color: 'var(--cui-text-secondary)',
            lineHeight: '1.55',
            marginTop: '0.375rem',
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
          marginTop: '-0.125rem',
          marginRight: '-0.25rem',
        }"
        aria-label="Close"
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
            marginBottom: '0.5rem',
            lineHeight: '1.4',
            padding: '0.625rem 0.75rem',
            background: `var(--cui-${cfg.color}-bg)`,
            borderRadius: '0.375rem',
            border: `1px solid var(--cui-${cfg.color}-border)`,
          }"
          v-html="confirmPrompt || defaultPrompt"
        />
        <CuiInput
          v-model="typedWord"
          :placeholder="confirmWord"
          size="sm"
          @keydown.enter="onConfirm"
        />
      </div>
    </CuiModalBody>

    <CuiModalFooter>
      <div style="display: flex; gap: 0.5rem; justify-content: flex-end;">
        <CuiButton variant="outline" size="sm" @click="onCancel">
          {{ cancelText }}
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
          {{ confirmText }}
        </CuiButton>
      </div>
    </CuiModalFooter>
  </CuiModal>
</template>

<script setup lang="ts">
import { ref, computed, watch, type Component } from "vue";
import { PhInfo, PhQuestion, PhWarning, PhWarningCircle } from "@phosphor-icons/vue";
import { useCuiId } from "../composables/useCuiId";
import type { CuiColor, HideableProps, TitleAsProps } from "../types/common";
import CuiModal from "./CuiModal.vue";
import CuiModalBody from "./CuiModalBody.vue";
import CuiModalFooter from "./CuiModalFooter.vue";
import CuiButton from "./CuiButton.vue";
import CuiInput from "./CuiInput.vue";
import CuiIcon from "./CuiIcon.vue";
import { useMessages } from "../composables/useMessages";
import { useHeadingLevel } from "../utils/configure";

export type ConfirmDialogVariant = "danger" | "warning" | "info" | "primary";

export interface CuiConfirmDialogProps extends HideableProps, TitleAsProps {
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
}>();

const typedWord = ref("");

watch(
  () => props.visible,
  (open) => {
    if (open) typedWord.value = "";
  },
);

const variantConfig: Record<ConfirmDialogVariant, { color: CuiColor; icon: Component }> = {
  danger: { color: "error", icon: PhWarningCircle },
  warning: { color: "warning", icon: PhWarning },
  info: { color: "info", icon: PhInfo },
  primary: { color: "primary", icon: PhQuestion },
};

const cfg = computed(() => variantConfig[props.variant]);

const confirmColor = computed(() => props.confirmColor ?? cfg.value.color);

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
  <CuiModal class="cui-confirm-dialog" :hidden="hidden" :visible="visible" size="sm" no-close-button :aria-labelledby="titleId" @update:visible="emit('update:visible', $event)">
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
        v-if="tileIcon"
        class="cui-confirm-dialog__icon"
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
        <CuiIcon v-bind="tileIcon" size="1.25rem" />
      </div>

      <div style="flex: 1; min-width: 0;">
        <!-- Title -->
        <component
          :is="headingTag"
          :id="titleId"
          class="cui-confirm-dialog__title"
          :style="{
            fontSize: '1.0625rem',
            fontWeight: '600',
            lineHeight: '1.3',
            color: 'var(--cui-text-emphasis)',
            margin: 'calc(0.125rem * var(--cui-density-scale, 1)) 0 0',
          }"
        >
          {{ resolvedTitle }}
        </component>

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
          :color="confirmColor"
          :disabled="confirmDisabled || loading"
          @click="onConfirm"
        >
          <template v-if="loading" #prefix>
            <span
              class="cui-confirm-dialog__spinner"
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

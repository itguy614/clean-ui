<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import CuiMaskedInput from "./CuiMaskedInput.vue";
import CuiPopover from "./CuiPopover.vue";
import CuiInputStepper from "./CuiInputStepper.vue";
import CuiButton from "./CuiButton.vue";
import CuiIcon from "./CuiIcon.vue";

export type TimePickerFormat = "12" | "24";

export interface CuiTimePickerProps {
  /** Time value as "HH:mm" (24h) or "hh:mm AM/PM" (12h) */
  modelValue?: string;
  /** Clock format */
  format?: TimePickerFormat;
  /** Minute step increment */
  minuteStep?: number;
  /** Minimum time (HH:mm) */
  minTime?: string;
  /** Maximum time (HH:mm) */
  maxTime?: string;
  /** Placeholder */
  placeholder?: string;
  /** Size */
  size?: "sm" | "md" | "lg";
  /** Disabled */
  disabled?: boolean;
  /** Label */
  label?: string;
  /** Hidden */
  hidden?: boolean;
}

const props = withDefaults(defineProps<CuiTimePickerProps>(), {
  modelValue: "",
  format: "12",
  minuteStep: 1,
  size: "md",
  disabled: false,
  hidden: false,
});

const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();

// Internal state in 24h
const hours = ref(12);
const minutes = ref(0);
const period = ref<"AM" | "PM">("AM");
const popoverVisible = ref(false);

// Parse incoming value
function parseTime(val: string) {
  if (!val) return;

  // Try "HH:mm" (24h)
  const m24 = val.match(/^(\d{1,2}):(\d{2})$/);
  if (m24) {
    const h = parseInt(m24[1]);
    const m = parseInt(m24[2]);
    if (props.format === "12") {
      period.value = h >= 12 ? "PM" : "AM";
      hours.value = h === 0 ? 12 : h > 12 ? h - 12 : h;
    } else {
      hours.value = h;
    }
    minutes.value = m;
    return;
  }

  // Try "hh:mm AM/PM"
  const m12 = val.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (m12) {
    hours.value = parseInt(m12[1]);
    minutes.value = parseInt(m12[2]);
    period.value = m12[3].toUpperCase() as "AM" | "PM";
  }
}

watch(() => props.modelValue, parseTime);
onMounted(() => parseTime(props.modelValue));

// Format output
function formatOutput(): string {
  if (props.format === "24") {
    return `${String(hours.value).padStart(2, "0")}:${String(minutes.value).padStart(2, "0")}`;
  }
  return `${String(hours.value).padStart(2, "0")}:${String(minutes.value).padStart(2, "0")} ${period.value}`;
}

function emitValue() {
  emit("update:modelValue", formatOutput());
}

// Display text for input
const displayText = computed(() => {
  if (!props.modelValue) return "";
  return formatOutput();
});

// Mask for input
const mask = computed(() => props.format === "24" ? "##:##" : "##:## AA");

// Input placeholder
const inputPlaceholder = computed(() =>
  props.placeholder ?? (props.format === "24" ? "hh:mm" : "hh:mm AM"),
);

// Raw value for masked input
const inputRaw = computed(() => {
  if (!props.modelValue) return "";
  if (props.format === "24") {
    return `${String(hours.value).padStart(2, "0")}${String(minutes.value).padStart(2, "0")}`;
  }
  return `${String(hours.value).padStart(2, "0")}${String(minutes.value).padStart(2, "0")}${period.value}`;
});

// Hour/minute limits
const hourMin = computed(() => props.format === "12" ? 1 : 0);
const hourMax = computed(() => props.format === "12" ? 12 : 23);

function onHourChange(val: number) {
  hours.value = val;
  emitValue();
}

function onMinuteChange(val: number) {
  minutes.value = val;
  emitValue();
}

function togglePeriod() {
  period.value = period.value === "AM" ? "PM" : "AM";
  emitValue();
}

// Apply and close
function onApply() {
  emitValue();
  popoverVisible.value = false;
}

// Open popover syncs from current value
watch(popoverVisible, (open) => {
  if (open) parseTime(props.modelValue);
});
</script>

<template>
  <div v-show="!hidden">
    <label
      v-if="label"
      :style="{
        display: 'block',
        marginBottom: '0.25rem',
        fontSize: '0.875rem',
        fontWeight: '500',
        color: 'var(--cui-text-secondary)',
      }"
    >{{ label }}</label>

    <CuiPopover
      v-model:visible="popoverVisible"
      placement="bottom"
      :closable="false"
      no-arrow
      width="auto"
      :disabled="disabled"
    >
      <!-- Trigger input -->
      <div
        :style="{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.4375rem 0.625rem',
          border: '1px solid var(--cui-border-strong, var(--cui-border))',
          borderRadius: 'var(--cui-button-radius, 0.375rem)',
          background: 'var(--cui-surface-base, white)',
          cursor: disabled ? 'default' : 'pointer',
          opacity: disabled ? '0.5' : '1',
          fontSize: '0.875rem',
          color: displayText ? 'var(--cui-text-body)' : 'var(--cui-text-tertiary)',
          minWidth: format === '24' ? '6rem' : '8rem',
        }"
      >
        <CuiIcon name="clock" size="0.875rem" :style="{ color: 'var(--cui-text-tertiary)', flexShrink: '0' }" />
        <span>{{ displayText || inputPlaceholder }}</span>
      </div>

      <!-- Time picker popover -->
      <template #content>
        <div :style="{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem' }">
          <!-- Hours -->
          <CuiInputStepper
            :model-value="hours"
            :min="hourMin"
            :max="hourMax"
            :step="1"
            orientation="vertical"
            size="sm"
            :pad="2"
            wrap
            @update:model-value="onHourChange"
          />

          <!-- Separator -->
          <span :style="{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--cui-text-body)', lineHeight: '1' }">:</span>

          <!-- Minutes -->
          <CuiInputStepper
            :model-value="minutes"
            :min="0"
            :max="59"
            :step="minuteStep"
            orientation="vertical"
            size="sm"
            :pad="2"
            wrap
            @update:model-value="onMinuteChange"
          />

          <!-- AM/PM toggle (12h only) -->
          <div v-if="format === '12'" :style="{ display: 'flex', flexDirection: 'column', gap: '0.125rem', marginLeft: '0.25rem' }">
            <CuiButton
              variant="ghost"
              size="xs"
              :style="{
                fontWeight: period === 'AM' ? '700' : '400',
                color: period === 'AM' ? 'var(--cui-primary)' : 'var(--cui-text-tertiary)',
                background: period === 'AM' ? 'var(--cui-primary-bg)' : 'transparent',
                borderRadius: '0.25rem',
                minWidth: '2.5rem',
              }"
              @click="period = 'AM'; emitValue()"
            >AM</CuiButton>
            <CuiButton
              variant="ghost"
              size="xs"
              :style="{
                fontWeight: period === 'PM' ? '700' : '400',
                color: period === 'PM' ? 'var(--cui-primary)' : 'var(--cui-text-tertiary)',
                background: period === 'PM' ? 'var(--cui-primary-bg)' : 'transparent',
                borderRadius: '0.25rem',
                minWidth: '2.5rem',
              }"
              @click="period = 'PM'; emitValue()"
            >PM</CuiButton>
          </div>
        </div>
      </template>
    </CuiPopover>
  </div>
</template>

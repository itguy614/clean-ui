<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import CuiMaskedInput from "./CuiMaskedInput.vue";
import CuiPopover from "./CuiPopover.vue";
import CuiButton from "./CuiButton.vue";
import CuiIcon from "./CuiIcon.vue";
import {
  MONTH_NAMES_SHORT, DAY_NAMES_SHORT,
  daysInMonth, firstDayOfMonth, isSameDay, isToday,
  formatDate, formatToMask, formatToRaw,
  isoToDate, dateToIso, isDateDisabled,
  type DisabledDateRange,
} from "../utils/date";

export type DateRangePickerValueType = "iso" | "date";

export interface DateRangeValue {
  start: string | Date | null;
  end: string | Date | null;
}

export interface CuiDateRangePickerProps {
  /** Current range value */
  modelValue?: DateRangeValue;
  /** Display format pattern */
  format?: string;
  /** v-model output type */
  valueType?: DateRangePickerValueType;
  /** Highlight today */
  highlightToday?: boolean;
  /** Minimum selectable date (ISO) */
  minDate?: string;
  /** Maximum selectable date (ISO) */
  maxDate?: string;
  /** Function to disable specific dates */
  disabledDate?: (date: Date) => boolean;
  /** Array of disabled dates or ranges */
  disabledDates?: (string | DisabledDateRange)[];
  /** Block selecting a range that spans a blackout date */
  blockSpanningBlackout?: boolean;
  /** Separator between start and end in display */
  separator?: string;
  /** Placeholder for start input */
  startPlaceholder?: string;
  /** Placeholder for end input */
  endPlaceholder?: string;
  /** Size */
  size?: "sm" | "md" | "lg";
  /** Disabled */
  disabled?: boolean;
  /** Hidden */
  hidden?: boolean;
  /** Label */
  label?: string;
}

const props = withDefaults(defineProps<CuiDateRangePickerProps>(), {
  format: "MM/DD/YYYY",
  valueType: "iso",
  highlightToday: true,
  blockSpanningBlackout: true,
  separator: "→",
  size: "md",
  disabled: false,
  hidden: false,
});

const emit = defineEmits<{
  "update:modelValue": [value: DateRangeValue];
}>();

// State
const viewYear = ref(new Date().getFullYear());
const viewMonth = ref(new Date().getMonth());
const popoverVisible = ref(false);
const selecting = ref<"start" | "end">("start");
const startDate = ref<Date | null>(null);
const endDate = ref<Date | null>(null);
const hoverDate = ref<Date | null>(null);

// Parse incoming value
function toDate(val: string | Date | null | undefined): Date | null {
  if (!val) return null;
  if (val instanceof Date) return val;
  return isoToDate(val);
}

function syncFromProp() {
  if (props.modelValue) {
    startDate.value = toDate(props.modelValue.start);
    endDate.value = toDate(props.modelValue.end);
    if (startDate.value) {
      viewYear.value = startDate.value.getFullYear();
      viewMonth.value = startDate.value.getMonth();
    }
  }
}

watch(() => props.modelValue, syncFromProp, { deep: true });
onMounted(syncFromProp);

// Mask
const mask = computed(() => formatToMask(props.format));

// Raw digits for inputs
const startRaw = computed(() => {
  if (!startDate.value) return "";
  return formatToRaw(formatDate(startDate.value, props.format));
});

const endRaw = computed(() => {
  if (!endDate.value) return "";
  return formatToRaw(formatDate(endDate.value, props.format));
});

const startDisplay = computed(() => startDate.value ? formatDate(startDate.value, props.format) : "");
const endDisplay = computed(() => endDate.value ? formatDate(endDate.value, props.format) : "");

// Min/max
const minDateObj = computed(() => props.minDate ? isoToDate(props.minDate) : null);
const maxDateObj = computed(() => props.maxDate ? isoToDate(props.maxDate) : null);

function isDisabled(date: Date): boolean {
  return isDateDisabled(date, {
    minDate: minDateObj.value,
    maxDate: maxDateObj.value,
    disabledDate: props.disabledDate,
    disabledDates: props.disabledDates,
  });
}

// Check if a range would span a blackout date
function rangeSpansBlackout(start: Date, end: Date): boolean {
  if (!props.blockSpanningBlackout) return false;
  const d = new Date(start);
  while (d <= end) {
    if (isDisabled(d)) return true;
    d.setDate(d.getDate() + 1);
  }
  return false;
}

// Emit
function emitRange() {
  const toVal = (d: Date | null) => {
    if (!d) return null;
    return props.valueType === "date" ? d : dateToIso(d);
  };
  emit("update:modelValue", { start: toVal(startDate.value), end: toVal(endDate.value) });
}

// Calendar
const calendarDays = computed(() => {
  const days: { date: Date; inMonth: boolean; disabled: boolean }[] = [];
  const totalDays = daysInMonth(viewYear.value, viewMonth.value);
  const startDay = firstDayOfMonth(viewYear.value, viewMonth.value);

  const prevMonth = viewMonth.value === 0 ? 11 : viewMonth.value - 1;
  const prevYear = viewMonth.value === 0 ? viewYear.value - 1 : viewYear.value;
  const prevDays = daysInMonth(prevYear, prevMonth);
  for (let i = startDay - 1; i >= 0; i--) {
    const d = new Date(prevYear, prevMonth, prevDays - i);
    days.push({ date: d, inMonth: false, disabled: isDisabled(d) });
  }

  for (let i = 1; i <= totalDays; i++) {
    const d = new Date(viewYear.value, viewMonth.value, i);
    days.push({ date: d, inMonth: true, disabled: isDisabled(d) });
  }

  const remaining = 42 - days.length;
  const nextMonth = viewMonth.value === 11 ? 0 : viewMonth.value + 1;
  const nextYear = viewMonth.value === 11 ? viewYear.value + 1 : viewYear.value;
  for (let i = 1; i <= remaining; i++) {
    const d = new Date(nextYear, nextMonth, i);
    days.push({ date: d, inMonth: false, disabled: isDisabled(d) });
  }

  return days;
});

// Day click
function selectDay(day: { date: Date; disabled: boolean }) {
  if (day.disabled) return;

  if (selecting.value === "start") {
    startDate.value = day.date;
    endDate.value = null;
    selecting.value = "end";
  } else {
    let s = startDate.value!;
    let e = day.date;
    // Swap if end < start
    if (e < s) { [s, e] = [e, s]; }

    // Check blackout spanning
    if (rangeSpansBlackout(s, e)) return;

    startDate.value = s;
    endDate.value = e;
    selecting.value = "start";
    emitRange();
    popoverVisible.value = false;
  }
}

function onDayHover(date: Date) {
  if (selecting.value === "end") {
    hoverDate.value = date;
  }
}

// Is date in range (or hover preview range)
function isInRange(date: Date): boolean {
  if (!startDate.value) return false;
  const end = selecting.value === "end" && hoverDate.value ? hoverDate.value : endDate.value;
  if (!end) return false;
  const s = startDate.value < end ? startDate.value : end;
  const e = startDate.value < end ? end : startDate.value;
  return date >= s && date <= e;
}

function isRangeStart(date: Date): boolean {
  return !!startDate.value && isSameDay(date, startDate.value);
}

function isRangeEnd(date: Date): boolean {
  const end = selecting.value === "end" && hoverDate.value ? hoverDate.value : endDate.value;
  return !!end && isSameDay(date, end);
}

// Navigation
function prevMonth() {
  if (viewMonth.value === 0) { viewMonth.value = 11; viewYear.value--; }
  else viewMonth.value--;
}
function nextMonth() {
  if (viewMonth.value === 11) { viewMonth.value = 0; viewYear.value++; }
  else viewMonth.value++;
}

const viewMode = ref<"days" | "months" | "years">("days");
const yearRangeStart = computed(() => Math.floor(viewYear.value / 12) * 12);
const yearRange = computed(() => Array.from({ length: 12 }, (_, i) => yearRangeStart.value + i));

function selectMonth(i: number) { viewMonth.value = i; viewMode.value = "days"; }
function selectYear(y: number) { viewYear.value = y; viewMode.value = "months"; }

// Open resets
watch(popoverVisible, (open) => {
  if (open) {
    viewMode.value = "days";
    selecting.value = "start";
    hoverDate.value = null;
    if (startDate.value) {
      viewYear.value = startDate.value.getFullYear();
      viewMonth.value = startDate.value.getMonth();
    }
  }
});

// Day styling
function dayStyle(day: { date: Date; inMonth: boolean; disabled: boolean }) {
  const s: Record<string, string> = {
    width: "2rem",
    height: "2rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "0.8125rem",
    cursor: day.disabled ? "default" : "pointer",
    transition: "background 0.1s ease, color 0.1s ease",
    position: "relative",
  };

  const inRange = isInRange(day.date);
  const rangeStart = isRangeStart(day.date);
  const rangeEnd = isRangeEnd(day.date);
  const today = props.highlightToday && isToday(day.date);

  if (day.disabled) {
    s.color = "var(--cui-text-tertiary)";
    s.opacity = "0.35";
  } else if (rangeStart || rangeEnd) {
    s.background = "var(--cui-primary)";
    s.color = "var(--cui-primary-text, white)";
    s.fontWeight = "600";
    s.borderRadius = rangeStart && !rangeEnd ? "0.375rem 0 0 0.375rem"
      : !rangeStart && rangeEnd ? "0 0.375rem 0.375rem 0"
      : "0.375rem";
  } else if (inRange) {
    s.background = "var(--cui-primary-bg)";
    s.color = "var(--cui-primary)";
    s.borderRadius = "0";
  } else if (today) {
    s.background = "var(--cui-primary-bg)";
    s.color = "var(--cui-primary)";
    s.fontWeight = "600";
    s.borderRadius = "0.375rem";
  } else if (!day.inMonth) {
    s.color = "var(--cui-text-tertiary)";
    s.borderRadius = "0.375rem";
  } else {
    s.color = "var(--cui-text-body)";
    s.borderRadius = "0.375rem";
  }

  return s;
}
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
    >
      {{ label }}
    </label>

    <CuiPopover
      v-model:visible="popoverVisible"
      placement="bottom"
      :closable="false"
      no-arrow
      width="auto"
      :disabled="disabled"
    >
      <!-- Trigger: two masked inputs with separator -->
      <div
        :style="{
          display: 'flex',
          alignItems: 'center',
          gap: '0.375rem',
          border: '1px solid var(--cui-border-strong, var(--cui-border))',
          borderRadius: 'var(--cui-button-radius, 0.375rem)',
          padding: '0 0.5rem',
          background: 'var(--cui-surface-base, white)',
          opacity: disabled ? '0.5' : '1',
          cursor: disabled ? 'default' : 'pointer',
        }"
      >
        <CuiIcon name="calendar-blank" size="0.875rem" style="color: var(--cui-text-tertiary); flex-shrink: 0;" />
        <input
          :value="startDisplay"
          :placeholder="startPlaceholder || props.format.toLowerCase()"
          readonly
          :style="{
            border: 'none',
            background: 'transparent',
            outline: 'none',
            fontSize: '0.875rem',
            color: 'var(--cui-text-body)',
            padding: '0.5rem 0',
            width: `${props.format.length + 1}ch`,
            cursor: 'pointer',
          }"
        />
        <span :style="{ color: 'var(--cui-text-tertiary)', fontSize: '0.75rem', flexShrink: '0' }">{{ separator }}</span>
        <input
          :value="endDisplay"
          :placeholder="endPlaceholder || props.format.toLowerCase()"
          readonly
          :style="{
            border: 'none',
            background: 'transparent',
            outline: 'none',
            fontSize: '0.875rem',
            color: 'var(--cui-text-body)',
            padding: '0.5rem 0',
            width: `${props.format.length + 1}ch`,
            cursor: 'pointer',
          }"
        />
      </div>

      <!-- Calendar popover -->
      <template #content>
        <div :style="{ padding: '0.25rem', minWidth: '260px' }">

          <!-- Status bar -->
          <div :style="{
            fontSize: '0.75rem',
            color: 'var(--cui-text-secondary)',
            textAlign: 'center',
            marginBottom: '0.375rem',
            fontWeight: '500',
          }">
            {{ selecting === 'start' ? 'Select start date' : 'Select end date' }}
          </div>

          <!-- DAYS VIEW -->
          <template v-if="viewMode === 'days'">
            <div :style="{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }">
              <CuiButton variant="ghost" size="xs" @click="prevMonth">
                <CuiIcon name="caret-left" size="0.875rem" />
              </CuiButton>
              <div :style="{ display: 'flex', gap: '0.25rem' }">
                <CuiButton variant="ghost" size="xs" :style="{ fontWeight: '600' }" @click="viewMode = 'months'">
                  {{ MONTH_NAMES_SHORT[viewMonth] }}
                </CuiButton>
                <CuiButton variant="ghost" size="xs" :style="{ fontWeight: '600' }" @click="viewMode = 'years'">
                  {{ viewYear }}
                </CuiButton>
              </div>
              <CuiButton variant="ghost" size="xs" @click="nextMonth">
                <CuiIcon name="caret-right" size="0.875rem" />
              </CuiButton>
            </div>

            <div :style="{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0', marginBottom: '0.25rem' }">
              <div
                v-for="name in DAY_NAMES_SHORT"
                :key="name"
                :style="{ textAlign: 'center', fontSize: '0.6875rem', fontWeight: '600', color: 'var(--cui-text-tertiary)', padding: '0.25rem 0', textTransform: 'uppercase' }"
              >{{ name }}</div>
            </div>

            <div :style="{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px' }">
              <div
                v-for="(day, i) in calendarDays"
                :key="i"
                :style="dayStyle(day)"
                @click="selectDay(day)"
                @mouseenter="onDayHover(day.date)"
              >
                {{ day.date.getDate() }}
              </div>
            </div>
          </template>

          <!-- MONTHS VIEW -->
          <template v-else-if="viewMode === 'months'">
            <div :style="{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }">
              <CuiButton variant="ghost" size="xs" @click="viewYear--"><CuiIcon name="caret-left" size="0.875rem" /></CuiButton>
              <CuiButton variant="ghost" size="xs" :style="{ fontWeight: '600' }" @click="viewMode = 'years'">{{ viewYear }}</CuiButton>
              <CuiButton variant="ghost" size="xs" @click="viewYear++"><CuiIcon name="caret-right" size="0.875rem" /></CuiButton>
            </div>
            <div :style="{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px' }">
              <div
                v-for="(name, i) in MONTH_NAMES_SHORT" :key="i"
                :style="{ padding: '0.5rem', textAlign: 'center', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.8125rem', color: viewMonth === i ? 'var(--cui-primary)' : 'var(--cui-text-body)' }"
                @click="selectMonth(i)"
              >{{ name }}</div>
            </div>
          </template>

          <!-- YEARS VIEW -->
          <template v-else-if="viewMode === 'years'">
            <div :style="{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }">
              <CuiButton variant="ghost" size="xs" @click="viewYear -= 12"><CuiIcon name="caret-left" size="0.875rem" /></CuiButton>
              <span :style="{ fontSize: '0.8125rem', fontWeight: '600', color: 'var(--cui-text-body)' }">{{ yearRangeStart }} – {{ yearRangeStart + 11 }}</span>
              <CuiButton variant="ghost" size="xs" @click="viewYear += 12"><CuiIcon name="caret-right" size="0.875rem" /></CuiButton>
            </div>
            <div :style="{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px' }">
              <div
                v-for="year in yearRange" :key="year"
                :style="{ padding: '0.5rem', textAlign: 'center', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.8125rem', fontWeight: viewYear === year ? '600' : '400', color: viewYear === year ? 'var(--cui-primary)' : 'var(--cui-text-body)' }"
                @click="selectYear(year)"
              >{{ year }}</div>
            </div>
          </template>

        </div>
      </template>
    </CuiPopover>
  </div>
</template>

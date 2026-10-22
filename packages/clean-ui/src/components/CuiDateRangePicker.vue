<script setup lang="ts">
import { ref, computed, watch, onMounted, useTemplateRef } from "vue";
import CuiPopover from "./CuiPopover.vue";
import CuiButton from "./CuiButton.vue";
import CuiIcon from "./CuiIcon.vue";
import { useDatePickerCalendar } from "../composables/useDatePickerCalendar";
import {
  MONTH_NAMES,
  MONTH_NAMES_SHORT, DAY_NAMES_SHORT,
  isSameDay, isToday,
  formatDate,
  toDateValue, dateToIso, addDays,
  type DisabledDateRange,
} from "../utils/date";
import type { HideableProps, DisableableProps, NativeControlProps, SizeableProps } from "../types/common";
import { useMessages } from "../composables/useMessages";
import { INPUT_SIZE_SCALE } from "../utils/sizing";

export type DateRangePickerValueType = "iso" | "date";

export interface DateRangeValue {
  start: string | Date | null;
  end: string | Date | null;
}

export interface CuiDateRangePickerProps extends NativeControlProps, HideableProps, DisableableProps, SizeableProps {
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

// The trigger's box comes from the shared input scale, so a range picker lines up with a
// CuiInput, CuiDatePicker or CuiTimePicker of the same `size` (#349). It ignored `size`.
const triggerDims = computed(() => INPUT_SIZE_SCALE[props.size]);
/** The start and end fields: bare inputs inside the trigger, sized by it. */
const fieldStyle = computed(() => ({
  border: "none",
  background: "transparent",
  outline: "none",
  fontSize: triggerDims.value.fontSize,
  color: "var(--cui-text-body)",
  padding: "0",
  width: `${props.format.length + 1}ch`,
  cursor: "pointer",
}));

const messages = useMessages();

const emit = defineEmits<{
  "update:modelValue": [value: DateRangeValue];
}>();

// State
const selecting = ref<"start" | "end">("start");
const startInputRef = useTemplateRef<HTMLInputElement>("startInput");
const startDate = ref<Date | null>(null);
const endDate = ref<Date | null>(null);
const hoverDate = ref<Date | null>(null);

// The calendar, shared with CuiDatePicker (#219). Selection is the range's own: one press
// sets the start, the next the end.
const {
  viewYear,
  viewMonth,
  viewMode,
  popoverVisible,
  showDate,
  isDisabled,
  calendarDays,
  yearRangeStart,
  yearRangeEnd,
  yearRange,
  yearKeys,
  monthKeys,
  selectYear,
  prevMonth,
  nextMonth,
  prevYearRange,
  nextYearRange,
  gridRef,
  focusedDate,
  cellTabIndex,
  onGridKeydown,
  onFieldKeydown,
} = useDatePickerCalendar({
  minDate: () => props.minDate,
  maxDate: () => props.maxDate,
  disabledDate: () => props.disabledDate,
  disabledDates: () => props.disabledDates,
  disabled: () => props.disabled,
  openView: () => "days",
  anchor: () => startDate.value,
  selectDay: (date) => selectDay({ date, disabled: isDisabled(date) }),
  selectMonth,
  focusTrigger: () => startInputRef.value?.focus({ preventScroll: true }),
  onOpen: () => {
    selecting.value = "start";
    hoverDate.value = null;
  },
});

function syncFromProp() {
  if (props.modelValue) {
    startDate.value = toDateValue(props.modelValue.start);
    endDate.value = toDateValue(props.modelValue.end);
    if (startDate.value) showDate(startDate.value);
  }
}

watch(() => props.modelValue, syncFromProp, { deep: true });
onMounted(syncFromProp);

const startDisplay = computed(() => startDate.value ? formatDate(startDate.value, props.format) : "");
const endDisplay = computed(() => endDate.value ? formatDate(endDate.value, props.format) : "");

// Check if a range would span a blackout date
function rangeSpansBlackout(start: Date, end: Date): boolean {
  if (!props.blockSpanningBlackout) return false;
  for (let d = start; d <= end; d = addDays(d, 1)) if (isDisabled(d)) return true;
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

function selectMonth(i: number) { viewMonth.value = i; viewMode.value = "days"; }

// While picking the end of a range the preview follows the pointer; with the
// keyboard it has to follow the focused cell instead, or the highlight simply
// stops moving for anyone not using a mouse.
watch(focusedDate, (date) => {
  if (selecting.value === "end") hoverDate.value = date;
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
  <div class="cui-date-range-picker" v-show="!hidden">
    <label
      v-if="label"
      :style="{
        display: 'block',
        marginBottom: 'calc(0.25rem * var(--cui-density-scale, 1))',
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
        class="cui-date-range-picker__trigger"
        :style="{
          display: 'flex',
          alignItems: 'center',
          gap: 'calc(0.375rem * var(--cui-density-scale, 1))',
          border: '1px solid var(--cui-border-strong, var(--cui-border))',
          borderRadius: 'var(--cui-button-radius, var(--cui-radius-md, 0.375rem))',
          height: triggerDims.height,
          padding: `0 ${triggerDims.px}`,
          background: 'var(--cui-surface-base, white)',
          opacity: disabled ? '0.5' : '1',
          cursor: disabled ? 'default' : 'pointer',
        }"
      >
        <CuiIcon name="calendar-blank" size="0.875rem" style="color: var(--cui-text-tertiary); flex-shrink: 0;" />
        <input
          ref="startInput"
          @keydown="onFieldKeydown"
          :id="id"
          :name="name"
          :autocomplete="autocomplete"
          :aria-describedby="ariaDescribedby"
          :aria-required="ariaRequired || undefined"
          :aria-labelledby="ariaLabelledby"
          :value="startDisplay"
          :placeholder="startPlaceholder || props.format.toLowerCase()"
          readonly
          :style="fieldStyle"
        />
        <span :style="{ color: 'var(--cui-text-tertiary)', fontSize: '0.75rem', flexShrink: '0' }">{{ separator }}</span>
        <input
          :value="endDisplay"
          :placeholder="endPlaceholder || props.format.toLowerCase()"
          readonly
          :style="fieldStyle"
        />
      </div>

      <!-- Calendar popover -->
      <template #content>
        <div :style="{ padding: 'calc(0.25rem * var(--cui-density-scale, 1))', minWidth: '260px' }">

          <!-- Status bar -->
          <div :style="{
            fontSize: '0.75rem',
            color: 'var(--cui-text-secondary)',
            textAlign: 'center',
            marginBottom: 'calc(0.375rem * var(--cui-density-scale, 1))',
            fontWeight: '500',
          }">
            {{ selecting === 'start' ? messages.dateRangePicker.selectStart : messages.dateRangePicker.selectEnd }}
          </div>

          <!-- DAYS VIEW -->
          <template v-if="viewMode === 'days'">
            <div :style="{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'calc(0.5rem * var(--cui-density-scale, 1))' }">
              <CuiButton variant="ghost" size="xs" @click="prevMonth">
                <CuiIcon name="caret-left" size="0.875rem" />
              </CuiButton>
              <div :style="{ display: 'flex', gap: 'calc(0.25rem * var(--cui-density-scale, 1))' }">
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

            <div :style="{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0', marginBottom: 'calc(0.25rem * var(--cui-density-scale, 1))' }">
              <div
                v-for="name in DAY_NAMES_SHORT"
                :key="name"
                :style="{ textAlign: 'center', fontSize: '0.6875rem', fontWeight: '600', color: 'var(--cui-text-tertiary)', padding: 'calc(0.25rem * var(--cui-density-scale, 1)) 0', textTransform: 'uppercase' }"
              >{{ name }}</div>
            </div>

            <div
              ref="gridRef"
              role="grid"
              :aria-label="MONTH_NAMES[viewMonth] + ' ' + viewYear"
              :style="{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 'calc(1px * var(--cui-density-scale, 1))' }"
              @keydown="onGridKeydown"
            >
              <div
                v-for="(day, i) in calendarDays"
                :key="i"
                role="gridcell"
                :data-cui-cell="day.key"
                :tabindex="cellTabIndex(day.key)"
                :aria-disabled="day.disabled || undefined"
                :aria-label="day.date.toDateString()"
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
            <div :style="{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'calc(0.5rem * var(--cui-density-scale, 1))' }">
              <CuiButton variant="ghost" size="xs" @click="viewYear--"><CuiIcon name="caret-left" size="0.875rem" /></CuiButton>
              <CuiButton variant="ghost" size="xs" :style="{ fontWeight: '600' }" @click="viewMode = 'years'">{{ viewYear }}</CuiButton>
              <CuiButton variant="ghost" size="xs" @click="viewYear++"><CuiIcon name="caret-right" size="0.875rem" /></CuiButton>
            </div>
            <div
              ref="gridRef"
              role="grid"
              :aria-label="String(viewYear)"
              :style="{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'calc(4px * var(--cui-density-scale, 1))' }"
              @keydown="onGridKeydown"
            >
              <div
                v-for="(name, i) in MONTH_NAMES_SHORT" :key="i"
                role="gridcell"
                :data-cui-cell="monthKeys[i]"
                :tabindex="cellTabIndex(monthKeys[i])"
                :aria-label="MONTH_NAMES[i] + ' ' + viewYear"
                :style="{ padding: 'calc(0.5rem * var(--cui-density-scale, 1))', textAlign: 'center', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.8125rem', color: viewMonth === i ? 'var(--cui-primary)' : 'var(--cui-text-body)' }"
                @click="selectMonth(i)"
              >{{ name }}</div>
            </div>
          </template>

          <!-- YEARS VIEW -->
          <template v-else-if="viewMode === 'years'">
            <div :style="{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'calc(0.5rem * var(--cui-density-scale, 1))' }">
              <CuiButton variant="ghost" size="xs" @click="prevYearRange"><CuiIcon name="caret-left" size="0.875rem" /></CuiButton>
              <span :style="{ fontSize: '0.8125rem', fontWeight: '600', color: 'var(--cui-text-body)' }">{{ yearRangeStart }} – {{ yearRangeEnd }}</span>
              <CuiButton variant="ghost" size="xs" @click="nextYearRange"><CuiIcon name="caret-right" size="0.875rem" /></CuiButton>
            </div>
            <div
              ref="gridRef"
              role="grid"
              :aria-label="messages.datePicker.yearRange(yearRangeStart, yearRangeEnd)"
              :style="{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'calc(4px * var(--cui-density-scale, 1))' }"
              @keydown="onGridKeydown"
            >
              <div
                v-for="(year, yi) in yearRange" :key="year"
                role="gridcell"
                :data-cui-cell="yearKeys[yi]"
                :tabindex="cellTabIndex(yearKeys[yi])"
                :aria-label="String(year)"
                :style="{ padding: 'calc(0.5rem * var(--cui-density-scale, 1))', textAlign: 'center', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.8125rem', fontWeight: viewYear === year ? '600' : '400', color: viewYear === year ? 'var(--cui-primary)' : 'var(--cui-text-body)' }"
                @click="selectYear(year)"
              >{{ year }}</div>
            </div>
          </template>

        </div>
      </template>
    </CuiPopover>
  </div>
</template>

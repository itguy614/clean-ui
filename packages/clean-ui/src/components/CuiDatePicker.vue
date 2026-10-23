<script setup lang="ts">
import { ref, computed, watch, onMounted, useTemplateRef } from "vue";
import CuiMaskedInput from "./CuiMaskedInput.vue";
import CuiPopover from "./CuiPopover.vue";
import CuiButton from "./CuiButton.vue";
import CuiIcon from "./CuiIcon.vue";
import { useDatePickerCalendar } from "../composables/useDatePickerCalendar";
import {
  MONTH_NAMES, MONTH_NAMES_SHORT, DAY_NAMES_SHORT,
  daysInMonth, isSameDay, isToday,
  formatDate, parseFormattedDate, formatToMask, formatToRaw, maskedFormat,
  toDateValue, dateToIso,
  type DisabledDateRange,
} from "../utils/date";
import type { HideableProps, DisableableProps, NativeControlProps, SizeableProps } from "../types/common";
import { useMessages } from "../composables/useMessages";
import { useCuiId } from "../composables/useCuiId";

const messages = useMessages();
// The label prop names the control (#391): a <label> with no `for` names nothing, and the
// control's aria-labelledby took only the consumer's own id. Both now, label first.
const labelId = useCuiId("date-picker-label");
const labelledBy = computed(() => [props.label ? labelId : null, props.ariaLabelledby].filter(Boolean).join(" ") || undefined);

export type DatePickerMode = "date" | "month";
export type DatePickerValueType = "iso" | "date";
export type DatePickerFillDay = "first" | "last";

export interface CuiDatePickerProps extends NativeControlProps, HideableProps, DisableableProps, SizeableProps {
  /** Current value */
  modelValue?: string | Date | null;
  /** Display format pattern (MM/DD/YYYY, DD-MMM-YYYY, etc.) */
  format?: string;
  /** v-model output type */
  valueType?: DatePickerValueType;
  /** Picker mode */
  mode?: DatePickerMode;
  /** In month mode, fill day with first or last day of month */
  fillDay?: DatePickerFillDay;
  /** Highlight today */
  highlightToday?: boolean;
  /** Minimum selectable date (ISO string) */
  minDate?: string;
  /** Maximum selectable date (ISO string) */
  maxDate?: string;
  /** Function to disable specific dates */
  disabledDate?: (date: Date) => boolean;
  /** Array of disabled dates (ISO strings or { from, to } ranges) */
  disabledDates?: (string | DisabledDateRange)[];
  /** Placeholder (auto-generated from format if omitted) */
  placeholder?: string;
  /** Label */
  label?: string;
}

const props = withDefaults(defineProps<CuiDatePickerProps>(), {
  format: "MM/DD/YYYY",
  valueType: "iso",
  mode: "date",
  fillDay: "first",
  highlightToday: true,
  size: "md",
  disabled: false,
  hidden: false,
});

const emit = defineEmits<{
  "update:modelValue": [value: string | Date | null];
}>();

const maskedInputRef = useTemplateRef<InstanceType<typeof CuiMaskedInput>>("maskedInput");
const selectedDate = ref<Date | null>(null);

// The calendar, shared with CuiDateRangePicker (#219).
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
  cellTabIndex,
  onGridKeydown,
  onFieldKeydown,
} = useDatePickerCalendar({
  minDate: () => props.minDate,
  maxDate: () => props.maxDate,
  disabledDate: () => props.disabledDate,
  disabledDates: () => props.disabledDates,
  disabled: () => props.disabled,
  openView: () => (props.mode === "month" ? "months" : "days"),
  anchor: () => selectedDate.value,
  selectDay: (date) => selectDay({ date, disabled: isDisabled(date) }),
  selectMonth,
  focusTrigger: () => maskedInputRef.value?.focus({ preventScroll: true }),
});

function syncFromProp() {
  const d = toDateValue(props.modelValue);
  selectedDate.value = d;
  if (d) showDate(d);
}

watch(() => props.modelValue, syncFromProp);
onMounted(syncFromProp);

// Input mask from format
const mask = computed(() => formatToMask(props.format));
const inputPlaceholder = computed(() => props.placeholder ?? props.format.toLowerCase());

// Raw digits for CuiMaskedInput (strips separators from formatted date)
const inputRaw = computed(() => {
  if (!selectedDate.value) return "";
  // Padded as the mask is: a single M or D still takes two digits there.
  return formatToRaw(formatDate(selectedDate.value, maskedFormat(props.format)));
});

// Emit the value
function emitValue(date: Date) {
  selectedDate.value = date;
  if (props.valueType === "date") {
    emit("update:modelValue", date);
  } else {
    emit("update:modelValue", dateToIso(date));
  }
}

// --- Actions ---
function selectDay(day: { date: Date; disabled: boolean }) {
  if (day.disabled) return;
  emitValue(day.date);
  popoverVisible.value = false;
}

function selectMonth(month: number) {
  viewMonth.value = month;
  if (props.mode === "month") {
    const day = props.fillDay === "last" ? daysInMonth(viewYear.value, month) : 1;
    emitValue(new Date(viewYear.value, month, day));
    popoverVisible.value = false;
  } else {
    viewMode.value = "days";
  }
}


// Text input change — receives raw digits from CuiMaskedInput, reconstruct formatted string
function onInputChange(rawVal: string | number) {
  const raw = String(rawVal);
  // Rebuild the formatted string by inserting raw chars into mask token positions
  const slots = mask.value.split("");
  let rawIdx = 0;
  let formatted = "";
  for (const ch of slots) {
    if (ch === "#" || ch === "A") {
      formatted += rawIdx < raw.length ? raw[rawIdx++] : "";
    } else {
      formatted += ch;
    }
  }
  const parsed = parseFormattedDate(formatted, props.format);
  if (parsed && !isNaN(parsed.getTime()) && !isDisabled(parsed)) {
    emitValue(parsed);
    showDate(parsed);
  }
}

// Day cell styling
function dayStyle(day: { date: Date; inMonth: boolean; disabled: boolean }) {
  const s: Record<string, string> = {
    width: "2rem",
    height: "2rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "0.375rem",
    fontSize: "0.8125rem",
    cursor: day.disabled ? "default" : "pointer",
  };

  const selected = selectedDate.value && isSameDay(day.date, selectedDate.value);
  const today = props.highlightToday && isToday(day.date);

  if (day.disabled) {
    s.color = "var(--cui-text-tertiary)";
    s.opacity = "0.35";
  } else if (selected) {
    s.background = "var(--cui-primary)";
    s.color = "var(--cui-primary-text, white)";
    s.fontWeight = "600";
  } else if (today) {
    s.background = "var(--cui-primary-bg)";
    s.color = "var(--cui-primary)";
    s.fontWeight = "600";
  } else if (!day.inMonth) {
    s.color = "var(--cui-text-tertiary)";
  } else {
    s.color = "var(--cui-text-body)";
  }

  return s;
}

function onDayHover(e: MouseEvent) {
  const el = e.target as HTMLElement;
  if (el.dataset.disabled !== "true") {
    el.style.background = el.style.background || "var(--cui-primary-bg)";
  }
}

// Expose imperative handle
const rootEl = useTemplateRef<HTMLElement>("rootEl");
function focus(opts?: FocusOptions) {
  if (maskedInputRef.value) maskedInputRef.value.focus({ preventScroll: true });
  else rootEl.value?.focus(opts);
}

function blur() {
  maskedInputRef.value?.blur();
}

defineExpose({ el: rootEl, focus, blur });
</script>

<template>
  <div class="cui-date-picker" ref="rootEl" v-show="!hidden">
    <label
      v-if="label"
      :id="labelId"
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
      <!-- Trigger: masked input -->
      <CuiMaskedInput
        ref="maskedInput"
        @keydown="onFieldKeydown"
        :id="id"
        :name="name"
        :autocomplete="autocomplete"
        :aria-describedby="ariaDescribedby"
        :aria-required="ariaRequired || undefined"
        :aria-labelledby="labelledBy"
        :model-value="inputRaw"
        :mask="mask"
        :placeholder="inputPlaceholder"
        :size="size"
        :disabled="disabled"
        @update:model-value="onInputChange"
      >
        <template #suffix>
          <CuiIcon name="calendar-blank" size="0.875rem" style="color: var(--cui-text-tertiary);" />
        </template>
      </CuiMaskedInput>

      <!-- Calendar popover -->
      <template #content>
        <div :style="{ padding: 'calc(0.25rem * var(--cui-density-scale, 1))', minWidth: '260px' }">

          <!-- DAYS VIEW -->
          <template v-if="viewMode === 'days'">
            <!-- Header: nav + month/year -->
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

            <!-- Day names -->
            <div :style="{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0', marginBottom: 'calc(0.25rem * var(--cui-density-scale, 1))' }">
              <div
                v-for="name in DAY_NAMES_SHORT"
                :key="name"
                :style="{
                  textAlign: 'center',
                  fontSize: '0.6875rem',
                  fontWeight: '600',
                  color: 'var(--cui-text-tertiary)',
                  padding: 'calc(0.25rem * var(--cui-density-scale, 1)) 0',
                  textTransform: 'uppercase',
                }"
              >
                {{ name }}
              </div>
            </div>

            <!-- Day grid -->
            <div
              ref="gridRef"
              role="grid"
              :aria-label="MONTH_NAMES[viewMonth] + ' ' + viewYear"
              :style="{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 'calc(2px * var(--cui-density-scale, 1))' }"
              @keydown="onGridKeydown"
            >
              <div
                v-for="(day, i) in calendarDays"
                :key="i"
                role="gridcell"
                :data-cui-cell="day.key"
                :tabindex="cellTabIndex(day.key)"
                :aria-selected="selectedDate ? day.date.toDateString() === selectedDate.toDateString() : false"
                :aria-disabled="day.disabled || undefined"
                :aria-label="day.date.toDateString()"
                :style="dayStyle(day)"
                :data-disabled="day.disabled"
                @click="selectDay(day)"
              >
                {{ day.date.getDate() }}
              </div>
            </div>

            <!-- Today button -->
            <div v-if="highlightToday" :style="{ marginTop: 'calc(0.5rem * var(--cui-density-scale, 1))', textAlign: 'center' }">
              <CuiButton variant="ghost" size="xs" @click="selectDay({ date: new Date(), disabled: isDisabled(new Date()) })">
                {{ messages.datePicker.today }}
              </CuiButton>
            </div>
          </template>

          <!-- MONTHS VIEW -->
          <template v-else-if="viewMode === 'months'">
            <div :style="{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'calc(0.5rem * var(--cui-density-scale, 1))' }">
              <CuiButton variant="ghost" size="xs" @click="viewYear--">
                <CuiIcon name="caret-left" size="0.875rem" />
              </CuiButton>
              <CuiButton variant="ghost" size="xs" :style="{ fontWeight: '600' }" @click="viewMode = 'years'">
                {{ viewYear }}
              </CuiButton>
              <CuiButton variant="ghost" size="xs" @click="viewYear++">
                <CuiIcon name="caret-right" size="0.875rem" />
              </CuiButton>
            </div>

            <div
              ref="gridRef"
              role="grid"
              :aria-label="String(viewYear)"
              :style="{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'calc(4px * var(--cui-density-scale, 1))' }"
              @keydown="onGridKeydown"
            >
              <div
                v-for="(name, i) in MONTH_NAMES_SHORT"
                :key="i"
                role="gridcell"
                :data-cui-cell="monthKeys[i]"
                :tabindex="cellTabIndex(monthKeys[i])"
                :aria-label="MONTH_NAMES[i] + ' ' + viewYear"
                :style="{
                  padding: 'calc(0.5rem * var(--cui-density-scale, 1))',
                  textAlign: 'center',
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                  fontSize: '0.8125rem',
                  fontWeight: selectedDate && selectedDate.getMonth() === i && selectedDate.getFullYear() === viewYear ? '600' : '400',
                  background: selectedDate && selectedDate.getMonth() === i && selectedDate.getFullYear() === viewYear ? 'var(--cui-primary)' : 'transparent',
                  color: selectedDate && selectedDate.getMonth() === i && selectedDate.getFullYear() === viewYear ? 'var(--cui-primary-text, white)' : viewMonth === i ? 'var(--cui-primary)' : 'var(--cui-text-body)',
                }"
                @click="selectMonth(i)"
              >
                {{ name }}
              </div>
            </div>
          </template>

          <!-- YEARS VIEW -->
          <template v-else-if="viewMode === 'years'">
            <div :style="{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'calc(0.5rem * var(--cui-density-scale, 1))' }">
              <CuiButton variant="ghost" size="xs" @click="prevYearRange">
                <CuiIcon name="caret-left" size="0.875rem" />
              </CuiButton>
              <span :style="{ fontSize: '0.8125rem', fontWeight: '600', color: 'var(--cui-text-body)' }">
                {{ yearRangeStart }} – {{ yearRangeEnd }}
              </span>
              <CuiButton variant="ghost" size="xs" @click="nextYearRange">
                <CuiIcon name="caret-right" size="0.875rem" />
              </CuiButton>
            </div>

            <div
              ref="gridRef"
              role="grid"
              :aria-label="messages.datePicker.yearRange(yearRangeStart, yearRangeEnd)"
              :style="{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'calc(4px * var(--cui-density-scale, 1))' }"
              @keydown="onGridKeydown"
            >
              <div
                v-for="(year, yi) in yearRange"
                :key="year"
                role="gridcell"
                :data-cui-cell="yearKeys[yi]"
                :tabindex="cellTabIndex(yearKeys[yi])"
                :aria-label="String(year)"
                :style="{
                  padding: 'calc(0.5rem * var(--cui-density-scale, 1))',
                  textAlign: 'center',
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                  fontSize: '0.8125rem',
                  fontWeight: viewYear === year ? '600' : '400',
                  background: selectedDate && selectedDate.getFullYear() === year ? 'var(--cui-primary)' : 'transparent',
                  color: selectedDate && selectedDate.getFullYear() === year ? 'var(--cui-primary-text, white)' : viewYear === year ? 'var(--cui-primary)' : 'var(--cui-text-body)',
                }"
                @click="selectYear(year)"
              >
                {{ year }}
              </div>
            </div>
          </template>

        </div>
      </template>
    </CuiPopover>
  </div>
</template>

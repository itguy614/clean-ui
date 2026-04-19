<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import CuiMaskedInput from "./CuiMaskedInput.vue";
import CuiPopover from "./CuiPopover.vue";
import CuiButton from "./CuiButton.vue";
import CuiIcon from "./CuiIcon.vue";
import {
  MONTH_NAMES, MONTH_NAMES_SHORT, DAY_NAMES_SHORT,
  daysInMonth, firstDayOfMonth, isSameDay, isToday,
  formatDate, parseFormattedDate, formatToMask, formatToRaw,
  isoToDate, dateToIso, isDateDisabled,
  type DisabledDateRange,
} from "../utils/date";

export type DatePickerMode = "date" | "month";
export type DatePickerValueType = "iso" | "date";
export type DatePickerFillDay = "first" | "last";

export interface CuiDatePickerProps {
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
  /** Size */
  size?: "sm" | "md" | "lg";
  /** Disabled */
  disabled?: boolean;
  /** Hidden */
  hidden?: boolean;
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

// Calendar navigation state
const viewYear = ref(new Date().getFullYear());
const viewMonth = ref(new Date().getMonth());
const viewMode = ref<"days" | "months" | "years">(props.mode === "month" ? "months" : "days");
const popoverVisible = ref(false);

// Selected date
const selectedDate = ref<Date | null>(null);

// Parse incoming modelValue
function parseModelValue(): Date | null {
  if (!props.modelValue) return null;
  if (props.modelValue instanceof Date) return props.modelValue;
  return isoToDate(props.modelValue as string);
}

function syncFromProp() {
  const d = parseModelValue();
  selectedDate.value = d;
  if (d) {
    viewYear.value = d.getFullYear();
    viewMonth.value = d.getMonth();
  }
}

watch(() => props.modelValue, syncFromProp);
onMounted(syncFromProp);

// Input mask from format
const mask = computed(() => formatToMask(props.format));
const inputPlaceholder = computed(() => props.placeholder ?? props.format.toLowerCase());

// Raw digits for CuiMaskedInput (strips separators from formatted date)
const inputRaw = computed(() => {
  if (!selectedDate.value) return "";
  return formatToRaw(formatDate(selectedDate.value, props.format));
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

// Min/max as Date objects
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

// --- Day grid ---
const calendarDays = computed(() => {
  const days: { date: Date; inMonth: boolean; disabled: boolean }[] = [];
  const totalDays = daysInMonth(viewYear.value, viewMonth.value);
  const startDay = firstDayOfMonth(viewYear.value, viewMonth.value);

  // Previous month fill
  const prevMonth = viewMonth.value === 0 ? 11 : viewMonth.value - 1;
  const prevYear = viewMonth.value === 0 ? viewYear.value - 1 : viewYear.value;
  const prevDays = daysInMonth(prevYear, prevMonth);
  for (let i = startDay - 1; i >= 0; i--) {
    const d = new Date(prevYear, prevMonth, prevDays - i);
    days.push({ date: d, inMonth: false, disabled: isDisabled(d) });
  }

  // Current month
  for (let i = 1; i <= totalDays; i++) {
    const d = new Date(viewYear.value, viewMonth.value, i);
    days.push({ date: d, inMonth: true, disabled: isDisabled(d) });
  }

  // Next month fill (to complete 6 rows)
  const remaining = 42 - days.length;
  const nextMonth = viewMonth.value === 11 ? 0 : viewMonth.value + 1;
  const nextYear = viewMonth.value === 11 ? viewYear.value + 1 : viewYear.value;
  for (let i = 1; i <= remaining; i++) {
    const d = new Date(nextYear, nextMonth, i);
    days.push({ date: d, inMonth: false, disabled: isDisabled(d) });
  }

  return days;
});

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

function selectYear(year: number) {
  viewYear.value = year;
  viewMode.value = props.mode === "month" ? "months" : "months";
}

function prevMonth() {
  if (viewMonth.value === 0) { viewMonth.value = 11; viewYear.value--; }
  else viewMonth.value--;
}

function nextMonth() {
  if (viewMonth.value === 11) { viewMonth.value = 0; viewYear.value++; }
  else viewMonth.value++;
}

// Year grid range
const yearRangeStart = computed(() => Math.floor(viewYear.value / 12) * 12);
const yearRange = computed(() => Array.from({ length: 12 }, (_, i) => yearRangeStart.value + i));

function prevYearRange() { viewYear.value -= 12; }
function nextYearRange() { viewYear.value += 12; }

// Header click handlers
function onMonthHeaderClick() { viewMode.value = "months"; }
function onYearHeaderClick() { viewMode.value = "years"; }

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
    viewYear.value = parsed.getFullYear();
    viewMonth.value = parsed.getMonth();
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
    transition: "background 0.1s ease, color 0.1s ease",
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

// Open popover resets view mode
watch(popoverVisible, (open) => {
  if (open) {
    viewMode.value = props.mode === "month" ? "months" : "days";
    if (selectedDate.value) {
      viewYear.value = selectedDate.value.getFullYear();
      viewMonth.value = selectedDate.value.getMonth();
    }
  }
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
        <div :style="{ padding: '0.25rem', minWidth: '260px' }">

          <!-- DAYS VIEW -->
          <template v-if="viewMode === 'days'">
            <!-- Header: nav + month/year -->
            <div :style="{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }">
              <CuiButton variant="ghost" size="xs" @click="prevMonth">
                <CuiIcon name="caret-left" size="0.875rem" />
              </CuiButton>
              <div :style="{ display: 'flex', gap: '0.25rem' }">
                <CuiButton variant="ghost" size="xs" :style="{ fontWeight: '600' }" @click="onMonthHeaderClick">
                  {{ MONTH_NAMES_SHORT[viewMonth] }}
                </CuiButton>
                <CuiButton variant="ghost" size="xs" :style="{ fontWeight: '600' }" @click="onYearHeaderClick">
                  {{ viewYear }}
                </CuiButton>
              </div>
              <CuiButton variant="ghost" size="xs" @click="nextMonth">
                <CuiIcon name="caret-right" size="0.875rem" />
              </CuiButton>
            </div>

            <!-- Day names -->
            <div :style="{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0', marginBottom: '0.25rem' }">
              <div
                v-for="name in DAY_NAMES_SHORT"
                :key="name"
                :style="{
                  textAlign: 'center',
                  fontSize: '0.6875rem',
                  fontWeight: '600',
                  color: 'var(--cui-text-tertiary)',
                  padding: '0.25rem 0',
                  textTransform: 'uppercase',
                }"
              >
                {{ name }}
              </div>
            </div>

            <!-- Day grid -->
            <div :style="{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }">
              <div
                v-for="(day, i) in calendarDays"
                :key="i"
                :style="dayStyle(day)"
                :data-disabled="day.disabled"
                @click="selectDay(day)"
              >
                {{ day.date.getDate() }}
              </div>
            </div>

            <!-- Today button -->
            <div v-if="highlightToday" :style="{ marginTop: '0.5rem', textAlign: 'center' }">
              <CuiButton variant="ghost" size="xs" @click="selectDay({ date: new Date(), disabled: isDisabled(new Date()) })">
                Today
              </CuiButton>
            </div>
          </template>

          <!-- MONTHS VIEW -->
          <template v-else-if="viewMode === 'months'">
            <div :style="{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }">
              <CuiButton variant="ghost" size="xs" @click="viewYear--">
                <CuiIcon name="caret-left" size="0.875rem" />
              </CuiButton>
              <CuiButton variant="ghost" size="xs" :style="{ fontWeight: '600' }" @click="onYearHeaderClick">
                {{ viewYear }}
              </CuiButton>
              <CuiButton variant="ghost" size="xs" @click="viewYear++">
                <CuiIcon name="caret-right" size="0.875rem" />
              </CuiButton>
            </div>

            <div :style="{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px' }">
              <div
                v-for="(name, i) in MONTH_NAMES_SHORT"
                :key="i"
                :style="{
                  padding: '0.5rem',
                  textAlign: 'center',
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                  fontSize: '0.8125rem',
                  fontWeight: selectedDate && selectedDate.getMonth() === i && selectedDate.getFullYear() === viewYear ? '600' : '400',
                  background: selectedDate && selectedDate.getMonth() === i && selectedDate.getFullYear() === viewYear ? 'var(--cui-primary)' : 'transparent',
                  color: selectedDate && selectedDate.getMonth() === i && selectedDate.getFullYear() === viewYear ? 'var(--cui-primary-text, white)' : viewMonth === i ? 'var(--cui-primary)' : 'var(--cui-text-body)',
                  transition: 'background 0.1s ease',
                }"
                @click="selectMonth(i)"
              >
                {{ name }}
              </div>
            </div>
          </template>

          <!-- YEARS VIEW -->
          <template v-else-if="viewMode === 'years'">
            <div :style="{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }">
              <CuiButton variant="ghost" size="xs" @click="prevYearRange">
                <CuiIcon name="caret-left" size="0.875rem" />
              </CuiButton>
              <span :style="{ fontSize: '0.8125rem', fontWeight: '600', color: 'var(--cui-text-body)' }">
                {{ yearRangeStart }} – {{ yearRangeStart + 11 }}
              </span>
              <CuiButton variant="ghost" size="xs" @click="nextYearRange">
                <CuiIcon name="caret-right" size="0.875rem" />
              </CuiButton>
            </div>

            <div :style="{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px' }">
              <div
                v-for="year in yearRange"
                :key="year"
                :style="{
                  padding: '0.5rem',
                  textAlign: 'center',
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                  fontSize: '0.8125rem',
                  fontWeight: viewYear === year ? '600' : '400',
                  background: selectedDate && selectedDate.getFullYear() === year ? 'var(--cui-primary)' : 'transparent',
                  color: selectedDate && selectedDate.getFullYear() === year ? 'var(--cui-primary-text, white)' : viewYear === year ? 'var(--cui-primary)' : 'var(--cui-text-body)',
                  transition: 'background 0.1s ease',
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

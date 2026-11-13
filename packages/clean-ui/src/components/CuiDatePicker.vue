<script setup lang="ts">
import { ref, computed, watch, onMounted, useTemplateRef } from "vue";
import CuiMaskedInput from "./CuiMaskedInput.vue";
import CuiPopover from "./CuiPopover.vue";
import CuiButton from "./CuiButton.vue";
import CuiIcon from "./CuiIcon.vue";
import { useDatePickerCalendar } from "../composables/useDatePickerCalendar";
import {
  daysInMonth, isSameDay, isToday,
  formatDate, parseFormattedDate, formatToMask, formatToRaw, maskedFormat,
  toDateValue, dateToIso,
  type DisabledDateRange,
} from "../utils/date";
import type { HideableProps, DisableableProps, NativeControlProps, SizeableProps, FormControlProps } from "../types/common";
import { useMessages } from "../composables/useMessages";
import { useLocale } from "../composables/useLocale";
import { fullDateLabel, monthNames, monthYearLabel, weekdayLabels } from "../utils/locale";
import { useCuiId } from "../composables/useCuiId";
import { useFloatingLabelProvider } from "./form-field-context";

const messages = useMessages();
const locale = useLocale();
// The month and weekday text the calendar draws and announces (#337), in the library's locale.
const monthsShort = computed(() => monthNames(locale.value, "short"));
const weekdays = computed(() => weekdayLabels(locale.value));
// The label prop names the control (#391): a <label> with no `for` names nothing, and the
// control's aria-labelledby took only the consumer's own id. Both now, label first.
const labelId = useCuiId("date-picker-label");
const labelledBy = computed(() => [props.label ? labelId : null, props.ariaLabelledby].filter(Boolean).join(" ") || undefined);

export type DatePickerMode = "date" | "month";
export type DatePickerValueType = "iso" | "date";
export type DatePickerFillDay = "first" | "last";

export interface CuiDatePickerProps
  extends NativeControlProps,
    HideableProps,
    SizeableProps,
    DisableableProps,
    Pick<FormControlProps, "label"> {
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

// Not a floating-label control, though it renders one (#191): see useFloatingLabelProvider.
useFloatingLabelProvider(() => null);

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
const mask = computed(() => formatToMask(props.format, locale.value));
// A month name in the mask takes a letter of any script (and digits, for "10月"), not just
// ASCII: the masked input's own `A` and `*` are ASCII-only (#337).
const maskTokens = { A: { pattern: /\p{L}/u }, "*": { pattern: /[\p{L}\p{N}]/u } };
const inputPlaceholder = computed(() => props.placeholder ?? props.format.toLowerCase());

// Raw digits for CuiMaskedInput (strips separators from formatted date)
const inputRaw = computed(() => {
  if (!selectedDate.value) return "";
  // Padded as the mask is: a single M or D still takes two digits there.
  return formatToRaw(formatDate(selectedDate.value, maskedFormat(props.format), locale.value));
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
    if (ch === "#" || ch === "A" || ch === "*") {
      formatted += rawIdx < raw.length ? raw[rawIdx++] : "";
    } else {
      formatted += ch;
    }
  }
  const parsed = parseFormattedDate(formatted, props.format, locale.value);
  if (parsed && !isNaN(parsed.getTime()) && !isDisabled(parsed)) {
    emitValue(parsed);
    showDate(parsed);
  }
}

// A day cell's state, as the one modifier class the stylesheet paints (#466). One at a time,
// in this order: disabled, selected, today, outside the month.
function dayState(day: { date: Date; inMonth: boolean; disabled: boolean }) {
  if (day.disabled) return "cui-date-picker__day--disabled";
  if (selectedDate.value && isSameDay(day.date, selectedDate.value)) return "cui-date-picker__day--selected";
  if (props.highlightToday && isToday(day.date)) return "cui-date-picker__day--today";
  if (!day.inMonth) return "cui-date-picker__day--outside";
  return undefined;
}

/** A month or year cell's modifiers: selected, the one the view is on, and set in bold. */
function optionState(selected: boolean, current: boolean, strong: boolean) {
  return {
    "cui-date-picker__option--selected": selected,
    "cui-date-picker__option--current": current,
    "cui-date-picker__option--strong": strong,
  };
}

const isSelectedMonth = (i: number) =>
  !!selectedDate.value && selectedDate.value.getMonth() === i && selectedDate.value.getFullYear() === viewYear.value;

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
    <label v-if="label" :id="labelId" class="cui-date-picker__label">
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
        :tokens="maskTokens"
        :placeholder="inputPlaceholder"
        :size="size"
        :disabled="disabled"
        @update:model-value="onInputChange"
      >
        <template #suffix>
          <CuiIcon name="calendar-blank" size="0.875rem" class="cui-date-picker__icon" />
        </template>
      </CuiMaskedInput>

      <!-- Calendar popover -->
      <template #content>
        <div class="cui-date-picker__calendar">

          <!-- DAYS VIEW -->
          <template v-if="viewMode === 'days'">
            <!-- Header: nav + month/year -->
            <div class="cui-date-picker__header">
              <CuiButton variant="ghost" size="xs" @click="prevMonth">
                <CuiIcon name="caret-left" size="0.875rem" />
              </CuiButton>
              <div class="cui-date-picker__header-title">
                <CuiButton variant="ghost" size="xs" class="cui-date-picker__title-btn" @click="viewMode = 'months'">
                  {{ monthsShort[viewMonth] }}
                </CuiButton>
                <CuiButton variant="ghost" size="xs" class="cui-date-picker__title-btn" @click="viewMode = 'years'">
                  {{ viewYear }}
                </CuiButton>
              </div>
              <CuiButton variant="ghost" size="xs" @click="nextMonth">
                <CuiIcon name="caret-right" size="0.875rem" />
              </CuiButton>
            </div>

            <!-- Day names -->
            <div class="cui-date-picker__weekdays">
              <div v-for="(name, i) in weekdays" :key="i" class="cui-date-picker__weekday">
                {{ name }}
              </div>
            </div>

            <!-- Day grid -->
            <div
              ref="gridRef"
              role="grid"
              class="cui-date-picker__days"
              :aria-label="monthYearLabel(new Date(viewYear, viewMonth, 1), locale)"
              @keydown="onGridKeydown"
            >
              <div
                v-for="(day, i) in calendarDays"
                :key="i"
                role="gridcell"
                class="cui-date-picker__day"
                :class="dayState(day)"
                :data-cui-cell="day.key"
                :tabindex="cellTabIndex(day.key)"
                :aria-selected="selectedDate ? day.date.toDateString() === selectedDate.toDateString() : false"
                :aria-disabled="day.disabled || undefined"
                :aria-label="fullDateLabel(day.date, locale)"
                :data-disabled="day.disabled"
                @click="selectDay(day)"
              >
                {{ day.date.getDate() }}
              </div>
            </div>

            <!-- Today button -->
            <div v-if="highlightToday" class="cui-date-picker__today">
              <CuiButton variant="ghost" size="xs" @click="selectDay({ date: new Date(), disabled: isDisabled(new Date()) })">
                {{ messages.datePicker.today }}
              </CuiButton>
            </div>
          </template>

          <!-- MONTHS VIEW -->
          <template v-else-if="viewMode === 'months'">
            <div class="cui-date-picker__header">
              <CuiButton variant="ghost" size="xs" @click="viewYear--">
                <CuiIcon name="caret-left" size="0.875rem" />
              </CuiButton>
              <CuiButton variant="ghost" size="xs" class="cui-date-picker__title-btn" @click="viewMode = 'years'">
                {{ viewYear }}
              </CuiButton>
              <CuiButton variant="ghost" size="xs" @click="viewYear++">
                <CuiIcon name="caret-right" size="0.875rem" />
              </CuiButton>
            </div>

            <div
              ref="gridRef"
              role="grid"
              class="cui-date-picker__options"
              :aria-label="String(viewYear)"
              @keydown="onGridKeydown"
            >
              <div
                v-for="(name, i) in monthsShort"
                :key="i"
                role="gridcell"
                class="cui-date-picker__option"
                :class="optionState(isSelectedMonth(i), viewMonth === i, isSelectedMonth(i))"
                :data-cui-cell="monthKeys[i]"
                :tabindex="cellTabIndex(monthKeys[i])"
                :aria-label="monthYearLabel(new Date(viewYear, i, 1), locale)"
                @click="selectMonth(i)"
              >
                {{ name }}
              </div>
            </div>
          </template>

          <!-- YEARS VIEW -->
          <template v-else-if="viewMode === 'years'">
            <div class="cui-date-picker__header">
              <CuiButton variant="ghost" size="xs" @click="prevYearRange">
                <CuiIcon name="caret-left" size="0.875rem" />
              </CuiButton>
              <span class="cui-date-picker__years-range">
                {{ yearRangeStart }} – {{ yearRangeEnd }}
              </span>
              <CuiButton variant="ghost" size="xs" @click="nextYearRange">
                <CuiIcon name="caret-right" size="0.875rem" />
              </CuiButton>
            </div>

            <div
              ref="gridRef"
              role="grid"
              class="cui-date-picker__options"
              :aria-label="messages.datePicker.yearRange(yearRangeStart, yearRangeEnd)"
              @keydown="onGridKeydown"
            >
              <div
                v-for="(year, yi) in yearRange"
                :key="year"
                role="gridcell"
                class="cui-date-picker__option"
                :class="optionState(!!selectedDate && selectedDate.getFullYear() === year, viewYear === year, viewYear === year)"
                :data-cui-cell="yearKeys[yi]"
                :tabindex="cellTabIndex(yearKeys[yi])"
                :aria-label="String(year)"
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

<style scoped>
/* The calendar's paint (#466). Themeable declarations sit inside :where(), so a consumer's
   plain rule, or a --cui-date-picker-* token on a container, wins; structure stays at normal
   specificity. The panel is teleported, but its content is this component's own, so the scope
   still reaches it. The selected day is the control's "on" state: pressed-bg / pressed-color.
   State rules follow their base rules, since at zero specificity the source order decides. */
/* The scoped base gives every cui-* element line-height 1.5, but these sat inside the popover's
   body and followed its 1.55: each part hands the inherited one on (#466). */
:where(
  .cui-date-picker__label,
  .cui-date-picker__calendar,
  .cui-date-picker__header,
  .cui-date-picker__header-title,
  .cui-date-picker__years-range,
  .cui-date-picker__weekdays,
  .cui-date-picker__weekday,
  .cui-date-picker__days,
  .cui-date-picker__options,
  .cui-date-picker__today,
  .cui-date-picker__day,
  .cui-date-picker__option
) {
  line-height: inherit;
}

:where(.cui-date-picker__label) {
  margin-bottom: calc(0.25rem * var(--cui-density-scale, 1));
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--cui-text-secondary);
}
.cui-date-picker__label {
  display: block;
}

:where(.cui-date-picker__icon) {
  color: var(--cui-text-tertiary);
}

:where(.cui-date-picker__calendar) {
  padding: calc(0.25rem * var(--cui-density-scale, 1));
}
.cui-date-picker__calendar {
  min-width: 260px;
}

.cui-date-picker__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: calc(0.5rem * var(--cui-density-scale, 1));
}
.cui-date-picker__header-title {
  display: flex;
  gap: calc(0.25rem * var(--cui-density-scale, 1));
}
/* Beats CuiButton's own weight, whichever stylesheet loads last. */
.cui-button.cui-date-picker__title-btn {
  font-weight: 600;
}
:where(.cui-date-picker__years-range) {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--cui-text-body);
}

.cui-date-picker__weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0;
  margin-bottom: calc(0.25rem * var(--cui-density-scale, 1));
}
:where(.cui-date-picker__weekday) {
  font-size: 0.6875rem;
  font-weight: 600;
  color: var(--cui-text-tertiary);
  padding: calc(0.25rem * var(--cui-density-scale, 1)) 0;
}
.cui-date-picker__weekday {
  text-align: center;
  text-transform: uppercase;
}

.cui-date-picker__days {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: calc(2px * var(--cui-density-scale, 1));
}
.cui-date-picker__options {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: calc(4px * var(--cui-density-scale, 1));
}
.cui-date-picker__today {
  margin-top: calc(0.5rem * var(--cui-density-scale, 1));
  text-align: center;
}

/* Cells. A day never transitions: the keyboard crosses them (Motion). */
:where(.cui-date-picker__day) {
  width: 2rem;
  height: 2rem;
  border-radius: 0.375rem;
  font-size: 0.8125rem;
  color: var(--cui-text-body);
}
.cui-date-picker__day {
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}
:where(.cui-date-picker__option) {
  padding: calc(0.5rem * var(--cui-density-scale, 1));
  border-radius: 0.375rem;
  font-size: 0.8125rem;
  font-weight: 400;
  color: var(--cui-text-body);
}
.cui-date-picker__option {
  text-align: center;
  cursor: pointer;
}

/* States: outside the month, today, the view's current month or year, selected, disabled. */
:where(.cui-date-picker__day--outside) {
  color: var(--cui-text-tertiary);
}
:where(.cui-date-picker__day--today) {
  background: var(--cui-primary-bg);
  color: var(--cui-primary);
  font-weight: 600;
}
:where(.cui-date-picker__option--current) {
  color: var(--cui-primary);
}
:where(.cui-date-picker__option--strong) {
  font-weight: 600;
}
:where(.cui-date-picker__day--selected, .cui-date-picker__option--selected) {
  background: var(--cui-date-picker-pressed-bg, var(--cui-primary));
  color: var(--cui-date-picker-pressed-color, var(--cui-primary-text, white));
}
:where(.cui-date-picker__day--selected) {
  font-weight: 600;
}
:where(.cui-date-picker__day--disabled) {
  color: var(--cui-text-tertiary);
  opacity: 0.35;
}
.cui-date-picker__day--disabled {
  cursor: default;
}
</style>

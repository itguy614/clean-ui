<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, useTemplateRef } from "vue";
import CuiPopover from "./CuiPopover.vue";
import CuiInputStepper from "./CuiInputStepper.vue";
import CuiButton from "./CuiButton.vue";
import CuiIcon from "./CuiIcon.vue";
import { INPUT_SIZE_SCALE } from "../utils/sizing";
import { __DEV__, warnOnce } from "../utils/devWarn";
import type { HideableProps, DisableableProps, NativeControlProps, SizeableProps } from "../types/common";
import { useMessages } from "../composables/useMessages";
import { useLocale } from "../composables/useLocale";
import { dayPeriodLabels } from "../utils/locale";
import { useCuiId } from "../composables/useCuiId";
import { useFloatingLabelProvider } from "./form-field-context";

// Module-scoped: the bundler replaces `process.env.NODE_ENV`, and Node's types stay out of the build.
declare const process: { env: { NODE_ENV?: string } };

export type TimePickerFormat = "12" | "24";

export interface CuiTimePickerProps extends NativeControlProps, HideableProps, DisableableProps, SizeableProps {
  /** Time value as "HH:mm" (24h) or "hh:mm AM/PM" (12h) */
  modelValue?: string;
  /** Clock format */
  format?: TimePickerFormat;
  /** Minute step increment */
  minuteStep?: number;
  /**
   * Earliest selectable time, in the same forms the model accepts: "HH:mm" or
   * "hh:mm AM/PM". An invalid value, or a range with min after max, warns in
   * development and is ignored.
   */
  minTime?: string;
  /** Latest selectable time. Same form as `minTime`. */
  maxTime?: string;
  /** Placeholder */
  placeholder?: string;
  /** Label */
  label?: string;
}

const props = withDefaults(defineProps<CuiTimePickerProps>(), {
  modelValue: "",
  format: "12",
  minuteStep: 1,
  size: "md",
  disabled: false,
  hidden: false,
});

// Not a floating-label control, though it renders one (#191): see useFloatingLabelProvider.
useFloatingLabelProvider(() => null);

const messages = useMessages();
const locale = useLocale();
// What AM and PM are called here (#337): display only. The model value, and what is parsed
// from it, keep the literal "AM"/"PM", so a value means the same in every locale.
const periodLabels = computed(() => dayPeriodLabels(locale.value));
// The label prop names the trigger (#391): a <label> with no `for` names nothing, and the
// trigger is a div[role=combobox], which a `for` couldn't reach anyway. And the hour and
// minute steppers announced as "spinbutton, 12", with nothing to say which was which.
const labelId = useCuiId("time-picker-label");
const hoursNameId = useCuiId("time-picker-hours");
const minutesNameId = useCuiId("time-picker-minutes");
const labelledBy = computed(() => [props.label ? labelId : null, props.ariaLabelledby].filter(Boolean).join(" ") || undefined);

// The trigger's box comes from the shared input scale, so a time picker lines up with a
// CuiInput, CuiDatePicker or CuiDateRangePicker of the same `size`. Emitted as private
// properties, so `--cui-time-picker-*` on a container wins.
const sizeVars = computed(() => {
  const s = INPUT_SIZE_SCALE[props.size] ?? INPUT_SIZE_SCALE.md;
  return {
    "--_time-picker-height": s.height,
    "--_time-picker-px": s.px,
    "--_time-picker-font-size": s.fontSize,
  };
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
    const h = parseInt(m12[1]);
    const p = m12[3].toUpperCase() as "AM" | "PM";
    // A 24h picker holds the hour on the 24h clock, so "03:00 PM" is 15 there.
    hours.value = props.format === "24" ? (h % 12) + (p === "PM" ? 12 : 0) : h;
    minutes.value = parseInt(m12[2]);
    period.value = p;
  }
}

watch(() => props.modelValue, parseTime);
onMounted(() => parseTime(props.modelValue));

// Format output
function formatOutput(labels?: { AM: string; PM: string }): string {
  if (props.format === "24") {
    return `${String(hours.value).padStart(2, "0")}:${String(minutes.value).padStart(2, "0")}`;
  }
  return `${String(hours.value).padStart(2, "0")}:${String(minutes.value).padStart(2, "0")} ${labels ? labels[period.value] : period.value}`;
}

/** Minutes since midnight for a 24h clock time, or a 12h one with its period. */
function toMinutes(h: number, m: number, p: "AM" | "PM"): number {
  return (props.format === "12" ? (h % 12) + (p === "PM" ? 12 : 0) : h) * 60 + m;
}

/** A "HH:mm" or "hh:mm AM/PM" string as minutes since midnight, or null if it is neither. */
function parseClock(val: string): number | null {
  const m24 = val.match(/^(\d{1,2}):(\d{2})$/);
  if (m24) {
    const h = parseInt(m24[1]);
    const m = parseInt(m24[2]);
    return h <= 23 && m <= 59 ? h * 60 + m : null;
  }
  const m12 = val.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (m12) {
    const h = parseInt(m12[1]);
    const m = parseInt(m12[2]);
    return h >= 1 && h <= 12 && m <= 59 ? (h % 12) * 60 + m + (m12[3].toUpperCase() === "PM" ? 720 : 0) : null;
  }
  return null;
}

/**
 * The selectable range in minutes since midnight, or null when there is none to enforce:
 * neither bound set, or the bounds are unusable. A bad range is ignored whole rather than
 * half-applied, so one typo cannot silently narrow the picker.
 */
const range = computed<{ lo: number; hi: number } | null>(() => {
  if (!props.minTime && !props.maxTime) return null;
  const lo = props.minTime ? parseClock(props.minTime) : 0;
  const hi = props.maxTime ? parseClock(props.maxTime) : 1439;
  if (lo === null || hi === null || lo > hi) {
    if (__DEV__ && process.env.NODE_ENV !== "production") {
      warnOnce(
        `[clean-ui] CuiTimePicker: ignoring minTime="${props.minTime ?? ""}" maxTime="${props.maxTime ?? ""}". ` +
          `Use "HH:mm" or "hh:mm AM/PM", with minTime not after maxTime.`,
      );
    }
    return null;
  }
  return { lo, hi };
});

/** Hold the current time inside the range, moving it to the nearest bound. */
function clampToRange() {
  if (!range.value) return;
  const total = toMinutes(hours.value, minutes.value, period.value);
  const next = Math.min(Math.max(total, range.value.lo), range.value.hi);
  if (next === total) return;
  const h24 = Math.floor(next / 60);
  if (props.format === "12") {
    period.value = h24 >= 12 ? "PM" : "AM";
    hours.value = h24 % 12 || 12;
  } else {
    hours.value = h24;
  }
  minutes.value = next % 60;
}

function emitValue() {
  // Nothing outside the range is ever committed, however it got here: a typed hour, a
  // stepper, the AM/PM buttons, or Enter on a value that arrived out of range.
  clampToRange();
  emit("update:modelValue", formatOutput());
}

// Display text for input
const displayText = computed(() => {
  if (!props.modelValue) return "";
  return formatOutput(periodLabels.value);
});

// Input placeholder
const inputPlaceholder = computed(() =>
  props.placeholder ?? (props.format === "24" ? "hh:mm" : `hh:mm ${periodLabels.value.AM}`),
);

// Hour/minute limits. With a range, the steppers' bounds (and so their aria-valuemin/max)
// are the range's, and they stop there rather than wrapping.
const currentHour24 = computed(() => Math.floor(toMinutes(hours.value, minutes.value, period.value) / 60));

/**
 * The displayed hours that hold a selectable minute, in the current period in 12h, in
 * clock order. Null without a range.
 */
const validHours = computed<number[] | null>(() => {
  if (!range.value) return null;
  const shown: number[] = [];
  for (let h = 0; h < 24; h++) {
    if (h * 60 + 59 < range.value.lo || h * 60 > range.value.hi) continue;
    if (props.format === "12") {
      if ((h >= 12) !== (period.value === "PM")) continue;
      shown.push(h % 12 || 12);
    } else {
      shown.push(h);
    }
  }
  return shown.length ? shown : null;
});

const hourMin = computed(() =>
  validHours.value ? Math.min(...validHours.value) : props.format === "12" ? 1 : 0);
const hourMax = computed(() =>
  validHours.value ? Math.max(...validHours.value) : props.format === "12" ? 12 : 23);

const minuteBounds = computed(() => {
  const r = range.value;
  const h = currentHour24.value;
  // An hour outside the range (a model value that arrived out of range) has no bounds of
  // its own: keep every minute reachable rather than invert the stepper.
  if (!r || h * 60 + 59 < r.lo || h * 60 > r.hi) return { min: 0, max: 59 };
  return { min: Math.max(r.lo - h * 60, 0), max: Math.min(r.hi - h * 60, 59) };
});

/**
 * A 12h range that includes 12 reads 12, 1, 2 ... in clock order, which numeric bounds can
 * only express by wrapping from 12 to 1. Every other range stops at its ends: wrapping
 * past one would jump out of it.
 */
const hoursWrap = computed(() =>
  !range.value || (props.format === "12" && !!validHours.value && validHours.value.length > 1 && validHours.value.includes(12)));
const minutesWrap = computed(() => minuteBounds.value.min === 0 && minuteBounds.value.max === 59);

/** An AM/PM button is disabled when no time in that half of the day is selectable. */
function periodDisabled(p: "AM" | "PM"): boolean {
  if (!range.value) return false;
  return p === "AM" ? range.value.lo >= 720 : range.value.hi < 720;
}

function onHourChange(val: number) {
  const valid = validHours.value;
  if (valid && !valid.includes(val)) {
    // One arrow step onto an hour the range excludes moves on to the next selectable hour
    // in that direction (12h wraps, as the clock does) instead of snapping to a bound.
    const mod = props.format === "12" ? 12 : 24;
    const delta = (val - hours.value + mod) % mod;
    // 24h does not wrap, so a typed hour past an end is clamped rather than skipped over.
    const dir = props.format === "24" ? 0 : delta === 1 ? 1 : delta === mod - 1 ? -1 : 0;
    if (dir) {
      for (let k = 1; k < mod; k++) {
        const raw = (((hours.value + dir * k) % mod) + mod) % mod;
        const cand = props.format === "12" ? raw || 12 : raw;
        if (valid.includes(cand)) {
          val = cand;
          break;
        }
      }
      if (val !== hours.value && !valid.includes(val)) return;
    }
  }
  hours.value = val;
  emitValue();
}

function onMinuteChange(val: number) {
  minutes.value = val;
  emitValue();
}

function onPeriodClick(p: "AM" | "PM") {
  period.value = p;
  emitValue();
}

// Open popover syncs from current value
const panelEl = useTemplateRef<HTMLElement>("panelEl");

/**
 * Frames to keep retrying for. CuiPopover renders its panel `visibility: hidden`
 * until Floating UI positions it (#88), and `focus()` on a hidden element is a
 * silent no-op — the same race the calendar hit.
 */
/**
 * The fields a user moves between: hours, minutes, and AM/PM when shown.
 * Cached while the panel is open — the set only changes when `format` flips
 * between 12 and 24, so re-querying on every arrow keypress is wasted work.
 */
let cachedFields: HTMLElement[] = [];
function panelFields(): HTMLElement[] {
  if (cachedFields.length === 0) {
    cachedFields = [...(panelEl.value?.querySelectorAll<HTMLElement>('[role="spinbutton"], .cui-time-picker__period:not(:disabled)') ?? [])];
  }
  return cachedFields;
}

/**
 * Left/Right move between hour, minute and AM/PM, the way the segments of a
 * native `<input type="time">` do. Tab does it too, but Left/Right is what a
 * user reaches for in a time field — and inside a two-character spinbutton
 * there is nothing useful for the caret to do with them anyway.
 */
function onPanelKeydown(e: KeyboardEvent) {
  if (e.key === "Enter") {
    // Enter commits and closes, matching the calendar.
    //
    // Deferred by a frame, and NOT prevented when the AM/PM buttons have focus:
    // a button's click is the default action of Enter, so preventing it would
    // swallow the AM/PM change, and closing synchronously would tear the button
    // out of the DOM before that click ever ran. Let it happen, then close.
    const onPeriodButton = (document.activeElement as HTMLElement | null)?.classList.contains(
      "cui-time-picker__period",
    );
    if (!onPeriodButton) e.preventDefault();
    requestAnimationFrame(() => {
      emitValue();
      popoverVisible.value = false;
    });
    return;
  }

  if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
  const fields = panelFields();
  const current = fields.indexOf(document.activeElement as HTMLElement);
  if (current === -1) return;

  e.preventDefault();
  const next = current + (e.key === "ArrowRight" ? 1 : -1);
  // Stop at the ends rather than wrapping: hours and minutes read left to
  // right, and jumping from minutes back to hours mid-entry is disorienting.
  fields[Math.min(fields.length - 1, Math.max(0, next))]?.focus({ preventScroll: true });
}

/**
 * Move focus into the panel when it opens. The panel is teleported to <body>,
 * so it is nowhere near the trigger in tab order — without this, opening the
 * picker left focus on the trigger and Tab went off to whatever follows the
 * component in the document, never into the hours field.
 */
function focusPanel() {
  // One attempt: CuiPopover hides its unpositioned panel with `opacity: 0`
  // rather than `visibility: hidden` (#112), so the field is focusable as soon
  // as it is rendered.
  cachedFields = [];
  panelFields()[0]?.focus({ preventScroll: true });
}

/**
 * Hand focus back to the field when the panel closes — but only if it is ours
 * to take.
 *
 * Closing is very often caused by clicking somewhere else, including another
 * picker. Restoring unconditionally yanks focus out of whatever was just
 * clicked: with two pickers on a page, opening the second left the focus ring
 * on the first one's field.
 *
 * Two cases are ours. Focus still inside our own panel — the watcher runs
 * before the DOM updates, so that is what Escape and a commit look like. Or
 * focus already on `<body>`, meaning the close orphaned it and nobody else has
 * claimed it. Anything else belongs to whatever the user just clicked.
 */
function restoreFocusToTrigger() {
  const active = document.activeElement;
  const ours = active === document.body || (!!active && !!panelEl.value?.contains(active));
  if (!ours) return;
  triggerEl.value?.focus({ preventScroll: true });
}

watch(popoverVisible, (open) => {
  // Closing must return focus to the trigger, or it falls to <body>.
  if (!open) {
    cachedFields = [];
    restoreFocusToTrigger();
    return;
  }
  parseTime(props.modelValue);
  nextTick(() => focusPanel());
});

// Expose imperative handle — the trigger is a non-input div, so focus the root
const rootEl = useTemplateRef<HTMLElement>("rootEl");
const triggerEl = useTemplateRef<HTMLElement>("triggerEl");

/**
 * The trigger was a bare `<div>` — no tabindex, no role — so the time picker
 * could not be reached by keyboard at all, and there was nothing for a
 * `<label for>` to resolve to either (#74, and the half of #103 this closes).
 * Enter, Space or Down opens. Escape is the panel's CuiPopover's — a layer on the shared
 * stack, which closes it, and the close watcher hands focus back (#286).
 */
function onTriggerKeydown(e: KeyboardEvent) {
  if (props.disabled) return;

  if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
    e.preventDefault();
    popoverVisible.value = true;
  }
  // Escape is the popover's: it is a layer on the shared stack, which closes it (#286).
}

function focus(opts?: FocusOptions) {
  // The trigger is what is focusable; the root is a plain wrapper.
  (triggerEl.value ?? rootEl.value)?.focus(opts);
}

function blur() {
  (triggerEl.value ?? rootEl.value)?.blur();
}

defineExpose({ el: rootEl, focus, blur });
</script>

<template>
  <div class="cui-time-picker" ref="rootEl" v-show="!hidden" :style="sizeVars">
    <label v-if="label" :id="labelId" class="cui-time-picker__label">{{ label }}</label>

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
        ref="triggerEl"
        class="cui-time-picker__trigger"
        :class="{
          'cui-time-picker__trigger--disabled': disabled,
          'cui-time-picker__trigger--empty': !displayText,
          'cui-time-picker__trigger--24h': format === '24',
        }"
        role="combobox"
        aria-haspopup="dialog"
        :aria-expanded="popoverVisible"
        :aria-disabled="disabled || undefined"
        :id="id"
        :aria-describedby="ariaDescribedby"
        :aria-required="ariaRequired || undefined"
        :aria-labelledby="labelledBy"
        :tabindex="disabled ? -1 : 0"
        @keydown="onTriggerKeydown"
      >
        <CuiIcon class="cui-time-picker__icon" name="clock" size="0.875rem" />
        <span class="cui-time-picker__value">{{ displayText || inputPlaceholder }}</span>
      </div>

      <!-- Time picker popover -->
      <template #content>
        <div ref="panelEl" class="cui-time-picker__panel" @keydown="onPanelKeydown">
          <!-- Hours -->
          <span :id="hoursNameId" hidden>{{ messages.timePicker?.hours }}</span>
          <span :id="minutesNameId" hidden>{{ messages.timePicker?.minutes }}</span>
          <CuiInputStepper
            :aria-labelledby="hoursNameId"
            :model-value="hours"
            :min="hourMin"
            :max="hourMax"
            :step="1"
            orientation="vertical"
            size="sm"
            :pad="2"
            :wrap="hoursWrap"
            @update:model-value="onHourChange"
          />

          <!-- Separator -->
          <span class="cui-time-picker__separator">:</span>

          <!-- Minutes -->
          <CuiInputStepper
            :aria-labelledby="minutesNameId"
            :model-value="minutes"
            :min="minuteBounds.min"
            :max="minuteBounds.max"
            :step="minuteStep"
            orientation="vertical"
            size="sm"
            :pad="2"
            :wrap="minutesWrap"
            @update:model-value="onMinuteChange"
          />

          <!-- AM/PM toggle (12h only) -->
          <div v-if="format === '12'" class="cui-time-picker__periods">
            <CuiButton
              variant="ghost"
              size="xs"
              class="cui-time-picker__period"
              :class="{ 'cui-time-picker__period--on': period === 'AM' }"
              :disabled="periodDisabled('AM')"
              @click="onPeriodClick('AM')"
            >{{ periodLabels.AM }}</CuiButton>
            <CuiButton
              variant="ghost"
              size="xs"
              class="cui-time-picker__period"
              :class="{ 'cui-time-picker__period--on': period === 'PM' }"
              :disabled="periodDisabled('PM')"
              @click="onPeriodClick('PM')"
            >{{ periodLabels.PM }}</CuiButton>
          </div>
        </div>
      </template>
    </CuiPopover>
  </div>
</template>

<style scoped>
/* The time picker's paint. Themeable declarations sit inside :where(), so a consumer's plain
   rule, or a --cui-time-picker-* token on a container, wins; structure stays at normal
   specificity. The panel is teleported, but its content is this component's own, so the scope
   still reaches it, and a token reaches it only from :root or <body>. The selected AM or PM is
   the control's "on" state: pressed-bg / pressed-color. State rules follow their base rules,
   since at zero specificity the source order decides. */
:where(.cui-time-picker__label) {
  margin-bottom: calc(0.25rem * var(--cui-density-scale, 1));
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--cui-text-secondary);
}
.cui-time-picker__label {
  display: block;
}

/* The trigger's box comes from the shared input scale (see sizeVars). */
:where(.cui-time-picker__trigger) {
  gap: calc(0.5rem * var(--cui-density-scale, 1));
  height: var(--cui-time-picker-height, var(--_time-picker-height));
  padding: 0 var(--cui-time-picker-px, var(--_time-picker-px));
  border: 1px solid var(--cui-time-picker-border, var(--cui-border-strong, var(--cui-border)));
  border-radius: var(--cui-time-picker-radius, var(--cui-button-radius, var(--cui-radius-md, 0.375rem)));
  background: var(--cui-time-picker-bg, var(--cui-surface-base, white));
  font-size: var(--cui-time-picker-font-size, var(--_time-picker-font-size));
  color: var(--cui-time-picker-color, var(--cui-text-body));
}
.cui-time-picker__trigger {
  display: inline-flex;
  align-items: center;
  cursor: pointer;
  min-width: 8rem;
}
.cui-time-picker__trigger--24h {
  min-width: 6rem;
}
:where(.cui-time-picker__trigger--empty) {
  color: var(--cui-text-tertiary);
}
:where(.cui-time-picker__trigger--disabled) {
  opacity: 0.5;
}
.cui-time-picker__trigger--disabled {
  cursor: default;
}

:where(.cui-time-picker__icon) {
  color: var(--cui-text-tertiary);
}
.cui-time-picker__icon {
  flex-shrink: 0;
}

.cui-time-picker__panel {
  display: flex;
  align-items: center;
}
:where(.cui-time-picker__panel) {
  gap: calc(0.5rem * var(--cui-density-scale, 1));
  padding: calc(0.5rem * var(--cui-density-scale, 1));
}

:where(.cui-time-picker__separator) {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--cui-text-body);
  line-height: 1;
}

.cui-time-picker__periods {
  display: flex;
  flex-direction: column;
  gap: calc(0.125rem * var(--cui-density-scale, 1));
  margin-left: calc(0.25rem * var(--cui-density-scale, 1));
}

/* The AM and PM buttons are ghost CuiButtons, restyled through the button's own tokens. Hover
   and active hold the resting look, as the inline style they replace did. */
:where(.cui-time-picker__period) {
  --cui-button-radius: 0.25rem;
  --cui-button-bg: transparent;
  --cui-button-color: var(--cui-text-tertiary);
  --cui-button-hover-bg: var(--cui-button-bg);
  --cui-button-hover-color: var(--cui-button-color);
  --cui-button-active-bg: var(--cui-button-bg);
}
:where(.cui-time-picker__period--on) {
  --cui-button-bg: var(--cui-time-picker-pressed-bg, var(--cui-primary-bg));
  --cui-button-color: var(--cui-time-picker-pressed-color, var(--cui-primary));
}
.cui-time-picker__period {
  min-width: 2.5rem;
}
/* Beats CuiButton's own weight, whichever stylesheet loads last. */
.cui-button.cui-time-picker__period {
  font-weight: 400;
}
.cui-button.cui-time-picker__period--on {
  font-weight: 700;
}
</style>

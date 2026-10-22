<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, useTemplateRef, type CSSProperties, type Ref } from "vue";
import type { CuiSize, HideableProps, SizeableProps, DisableableProps, NativeControlProps } from "../types/common";
import { clampSize } from "../utils/sizing";
import CuiButton from "./CuiButton.vue";
import { useMessages } from "../composables/useMessages";
import { useRovingFocus } from "../composables/useRovingFocus";
import { usePointerDrag } from "../composables/usePointerDrag";
import {
  hsvToRgb, rgbToHsv, rgbToHex, parseColor, formatColor,
  PALETTE_BASIC, PALETTE_MATERIAL, PALETTE_TAILWIND, getThemePalette,
  type ColorFormat,
} from "../utils/color";

export type PresetPalette = "theme" | "basic" | "material" | "tailwind";

const SUPPORTED_SIZES = ["sm", "md", "lg"] as const;

export interface CuiColorPickerProps extends NativeControlProps, HideableProps, SizeableProps, DisableableProps {
  /** Color value (any supported format) */
  modelValue?: string;
  /** Output format */
  format?: ColorFormat;
  /** Custom swatch palette (array of hex colors) */
  palette?: string[];
  /** Built-in preset palette */
  presetPalette?: PresetPalette;
  /** Show alpha/opacity slider */
  showAlpha?: boolean;
  /** Show text input */
  showInput?: boolean;
  /** Show format toggle (HEX/RGB/HSL) */
  showFormatToggle?: boolean;
  /** Only show swatches, no gradient picker */
  swatchOnly?: boolean;
}

const props = withDefaults(defineProps<CuiColorPickerProps>(), {
  modelValue: "#000000",
  format: "hex",
  showAlpha: false,
  showInput: true,
  showFormatToggle: true,
  swatchOnly: false,
  size: "md",
  disabled: false,
  hidden: false,
});

const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();

// Internal HSV + alpha state
const hue = ref(0);
const sat = ref(1);
const val = ref(1);
const alpha = ref(1);
const activeFormat = ref<ColorFormat>(props.format);
const textInput = ref("");

// Size config
const sizeConfig: Record<(typeof SUPPORTED_SIZES)[number], { width: string; gradientHeight: string; sliderHeight: string; thumbSize: string; swatchSize: string; fontSize: string }> = {
  sm: { width: "220px", gradientHeight: "130px", sliderHeight: "10px", thumbSize: "14px", swatchSize: "20px", fontSize: "0.75rem" },
  md: { width: "280px", gradientHeight: "160px", sliderHeight: "12px", thumbSize: "16px", swatchSize: "24px", fontSize: "0.8125rem" },
  lg: { width: "340px", gradientHeight: "200px", sliderHeight: "14px", thumbSize: "18px", swatchSize: "28px", fontSize: "0.875rem" },
};
const cfg = computed(() => sizeConfig[clampSize(props.size, SUPPORTED_SIZES)]);

// Computed RGB from HSV
const currentRgb = computed(() => hsvToRgb(hue.value, sat.value, val.value));
const currentHex = computed(() => rgbToHex(currentRgb.value.r, currentRgb.value.g, currentRgb.value.b));
const displayColor = computed(() => {
  const { r, g, b } = currentRgb.value;
  return alpha.value < 1 ? `rgba(${r}, ${g}, ${b}, ${alpha.value.toFixed(2)})` : currentHex.value;
});
const outputValue = computed(() => {
  const { r, g, b } = currentRgb.value;
  return formatColor(r, g, b, alpha.value, activeFormat.value);
});

/** Set the HSV + alpha state from any supported colour string; false if it doesn't parse. */
function applyColor(color: string): boolean {
  const parsed = parseColor(color);
  if (!parsed) return false;
  const hsv = rgbToHsv(parsed.r, parsed.g, parsed.b);
  hue.value = hsv.h;
  sat.value = hsv.s;
  val.value = hsv.v;
  alpha.value = parsed.a;
  return true;
}

// Sync from modelValue prop — except for the echo of a value this picker just emitted. That
// string is quantized (hex has 256 steps a channel), and parsing it back would rewrite the
// HSV state the user is moving: 1% keyboard steps would skip and rewind, the hue would be
// lost whenever the colour reached grey or black, and 360° would come back as 0°.
let lastEmitted: string | null = null;
function syncFromProp() {
  // Once: a later change back to the same string, after something else moved the colour,
  // is the parent's, not an echo.
  const echo = props.modelValue === lastEmitted;
  lastEmitted = null;
  if (echo) return;
  if (applyColor(props.modelValue)) textInput.value = outputValue.value;
}

watch(() => props.modelValue, syncFromProp);
onMounted(syncFromProp);

// Watch for theme class changes on <html> to refresh the theme palette
const themeVersion = ref(0);
let observer: MutationObserver | null = null;
onMounted(() => {
  if (props.presetPalette === "theme" && typeof MutationObserver !== "undefined") {
    observer = new MutationObserver(() => { themeVersion.value++; });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  }
});
onUnmounted(() => {
  observer?.disconnect();
});

function emitColor() {
  textInput.value = outputValue.value;
  lastEmitted = outputValue.value;
  emit("update:modelValue", outputValue.value);
}

// Resolve palette — theme palette reads live CSS so it reflects the active theme
const resolvedPalette = computed(() => {
  if (props.palette) return props.palette;
  if (props.presetPalette === "theme") { themeVersion.value; return getThemePalette(); }
  if (props.presetPalette === "basic") return PALETTE_BASIC;
  if (props.presetPalette === "material") return PALETTE_MATERIAL;
  if (props.presetPalette === "tailwind") return PALETTE_TAILWIND;
  return [];
});

// --- Drag on the gradient, hue and alpha surfaces ---
// One drag at a time, following the pointer that pressed until it is released or cancelled,
// and ended on unmount (#246) — e.g. inside a popover closed with Escape.
const drag = usePointerDrag();

// Disabling mid-drag ends the drag, so a held pointer cannot keep changing the value.
watch(() => props.disabled, (disabled) => { if (disabled) drag.end(); });

// --- Keyboard (#177) ---
// Every visual control is a slider. The gradient is two — saturation across, brightness
// up — sharing one tab stop: Left/Right move saturation and Up/Down brightness, and focus
// follows to the slider whose value changed, so a screen reader announces that axis.
// Hue and alpha are plain sliders. Shift+arrow or PageUp/PageDown take ten steps; Home and
// End reach the ends. The surfaces are painted left-to-right whatever the page direction,
// so the arrows are physical, not mirrored.
const messages = useMessages();
const gradientRef = useTemplateRef<HTMLElement>("gradientRef");
const hueRef = useTemplateRef<HTMLElement>("hueRef");
const alphaRef = useTemplateRef<HTMLElement>("alphaRef");
const satSliderRef = useTemplateRef<HTMLElement>("satSliderRef");
const valSliderRef = useTemplateRef<HTMLElement>("valSliderRef");
const hueSliderRef = useTemplateRef<HTMLElement>("hueSliderRef");
const alphaSliderRef = useTemplateRef<HTMLElement>("alphaSliderRef");

// A press also focuses the surface's slider, so the keys carry on from where the pointer
// left it (the surfaces prevent the press's default, which would otherwise focus nothing).
function pressFor(slider: Readonly<Ref<HTMLElement | null>>, update: (e: PointerEvent) => void) {
  return (e: PointerEvent) => {
    slider.value?.focus({ preventScroll: true });
    if (!props.disabled && drag.start(e, update)) update(e);
  };
}

/** Fraction of the way across `el` the pointer is, horizontally and vertically, in [0, 1]. */
function fractionIn(el: HTMLElement, e: PointerEvent) {
  const rect = el.getBoundingClientRect();
  const clamp = (n: number) => Math.max(0, Math.min(1, n));
  return { x: clamp((e.clientX - rect.left) / rect.width), y: clamp((e.clientY - rect.top) / rect.height) };
}

function updateGradient(e: PointerEvent) {
  if (!gradientRef.value) return;
  const { x, y } = fractionIn(gradientRef.value, e);
  sat.value = x;
  val.value = 1 - y;
  emitColor();
}

function updateHue(e: PointerEvent) {
  if (!hueRef.value) return;
  hue.value = fractionIn(hueRef.value, e).x * 360;
  emitColor();
}

function updateAlpha(e: PointerEvent) {
  if (!alphaRef.value) return;
  alpha.value = Math.round(fractionIn(alphaRef.value, e).x * 100) / 100;
  emitColor();
}

const onGradientPointerDown = pressFor(satSliderRef, updateGradient);
const onHuePointerDown = pressFor(hueSliderRef, updateHue);
const onAlphaPointerDown = pressFor(alphaSliderRef, updateAlpha);

/** A slider: its model, the scale to whole steps (100 for a fraction), and its range. */
interface Slider {
  model: Ref<number>;
  scale: number;
  max: number;
  label: () => string;
  text: (n: number) => string;
}

const sliders = {
  sat: { model: sat, scale: 100, max: 100, label: () => messages.value.colorPicker.saturation, text: (n) => messages.value.colorPicker.percent(n) },
  val: { model: val, scale: 100, max: 100, label: () => messages.value.colorPicker.brightness, text: (n) => messages.value.colorPicker.percent(n) },
  hue: { model: hue, scale: 1, max: 360, label: () => messages.value.colorPicker.hue, text: (n) => messages.value.colorPicker.degrees(n) },
  alpha: { model: alpha, scale: 100, max: 100, label: () => messages.value.colorPicker.alpha, text: (n) => messages.value.colorPicker.percent(n) },
} satisfies Record<string, Slider>;

const stepsOf = (s: Slider) => Math.round(s.model.value * s.scale);

/**
 * Apply a slider key to `s`: `up`/`down` are the arrows that step it. Returns whether the
 * key was a slider key (handled), so the caller can tell.
 */
function stepSlider(e: KeyboardEvent, s: Slider, up: string[], down: string[]): boolean {
  if (props.disabled || e.altKey || e.ctrlKey || e.metaKey) return false;
  const v = stepsOf(s);
  const big = e.shiftKey ? 10 : 1;
  let next: number;
  if (up.includes(e.key)) next = v + big;
  else if (down.includes(e.key)) next = v - big;
  else if (e.key === "PageUp") next = v + 10;
  else if (e.key === "PageDown") next = v - 10;
  else if (e.key === "Home") next = 0;
  else if (e.key === "End") next = s.max;
  else return false;
  e.preventDefault();
  s.model.value = Math.min(s.max, Math.max(0, next)) / s.scale;
  emitColor();
  return true;
}

const ARROWS_UP = ["ArrowRight", "ArrowUp"];
const ARROWS_DOWN = ["ArrowLeft", "ArrowDown"];

function onGradientKeydown(e: KeyboardEvent) {
  // Left/Right are saturation's and Up/Down brightness's; Home, End and the page keys belong
  // to whichever has focus.
  const across = e.key === "ArrowLeft" || e.key === "ArrowRight";
  const upDown = e.key === "ArrowUp" || e.key === "ArrowDown";
  const onVal = !across && (upDown || e.target === valSliderRef.value);
  const handled = onVal
    ? stepSlider(e, sliders.val, ["ArrowUp"], ["ArrowDown"])
    : stepSlider(e, sliders.sat, ["ArrowRight"], ["ArrowLeft"]);
  if (handled) (onVal ? valSliderRef : satSliderRef).value?.focus();
}

const onHueKeydown = (e: KeyboardEvent) => stepSlider(e, sliders.hue, ARROWS_UP, ARROWS_DOWN);
const onAlphaKeydown = (e: KeyboardEvent) => stepSlider(e, sliders.alpha, ARROWS_UP, ARROWS_DOWN);

/** A slider's ARIA attributes. `tabStop: false` for brightness: the pair is one stop. */
function sliderAttrs(s: Slider, tabStop = true) {
  const n = stepsOf(s);
  return {
    role: "slider",
    tabindex: props.disabled ? undefined : tabStop ? 0 : -1,
    "aria-label": s.label(),
    "aria-valuemin": 0,
    "aria-valuemax": s.max,
    "aria-valuenow": n,
    "aria-valuetext": s.text(n),
    "aria-disabled": props.disabled || undefined,
  };
}

const satAttrs = computed(() => sliderAttrs(sliders.sat));
const valAttrs = computed(() => sliderAttrs(sliders.val, false));
const hueAttrs = computed(() => sliderAttrs(sliders.hue));
const alphaAttrs = computed(() => sliderAttrs(sliders.alpha));

// The gradient's thumb, where both of its sliders sit.
const gradientThumbPos = computed<CSSProperties>(() => ({
  position: "absolute",
  left: `${sat.value * 100}%`,
  top: `${(1 - val.value) * 100}%`,
  width: cfg.value.thumbSize,
  height: cfg.value.thumbSize,
  borderRadius: "50%",
  transform: "translate(-50%, -50%)",
  pointerEvents: "none",
}));

// --- Text input ---
function onTextSubmit() {
  if (applyColor(textInput.value)) emitColor();
  else textInput.value = outputValue.value;
}

// --- Format toggle ---
function toggleFormat() {
  const formats: ColorFormat[] = ["hex", "rgb", "hsl"];
  const idx = formats.indexOf(activeFormat.value);
  activeFormat.value = formats[(idx + 1) % formats.length];
  textInput.value = outputValue.value;
}

// --- Swatches ---
function onSwatchClick(color: string) {
  if (!props.disabled && applyColor(color)) emitColor();
}

// A radiogroup with one tab stop. The arrows move and select, as radios do; focus alone (a
// Tab into the group, a click's focus) selects nothing.
const swatchesRef = useTemplateRef<HTMLElement>("swatchesRef");
// Each swatch as the hex currentHex is written in, so "#f00" or "rgb(…)" in a palette
// still reads as selected.
const paletteHex = computed(() =>
  resolvedPalette.value.map((c) => {
    const p = parseColor(c);
    return p ? rgbToHex(p.r, p.g, p.b) : c.toLowerCase();
  }),
);
const isSelected = (i: number) => paletteHex.value[i] === currentHex.value;
const selectedSwatch = computed(() => paletteHex.value.indexOf(currentHex.value));
const swatchIndex = ref(0);
// The tab stop follows the selection — unless it is already on a swatch of that colour (a
// palette can repeat one), which would move it out from under focus.
watch(selectedSwatch, (i) => { if (i !== -1 && !isSelected(swatchIndex.value)) swatchIndex.value = i; }, { immediate: true });
const roving = useRovingFocus({
  container: swatchesRef,
  itemSelector: ".cui-color-picker__swatch",
  orientation: "both",
  wrap: true,
  activeIndex: swatchIndex,
});

/**
 * The swatches wrap into rows, so Up/Down move a row, the way they look — not one step, as
 * Left/Right do. The row length is measured from the layout, which follows the picker's width.
 * At the top or bottom row they stay put. Left/Right, Home/End and type-ahead stay with roving.
 */
function swatchesPerRow(): number {
  const items = swatchesRef.value?.querySelectorAll<HTMLElement>(".cui-color-picker__swatch");
  if (!items || items.length === 0) return 1;
  const top = items[0].offsetTop;
  let n = 0;
  while (n < items.length && items[n].offsetTop === top) n++;
  return Math.max(1, n);
}

function onSwatchKeydown(e: KeyboardEvent) {
  if (e.key === "ArrowUp" || e.key === "ArrowDown") {
    e.preventDefault();
    const target = swatchIndex.value + (e.key === "ArrowDown" ? 1 : -1) * swatchesPerRow();
    if (target < 0 || target >= resolvedPalette.value.length) return;
    roving.focusItem(target);
  } else {
    roving.onKeydown(e);
  }
  const i = swatchIndex.value;
  if (e.defaultPrevented && !isSelected(i)) onSwatchClick(resolvedPalette.value[i]);
}

// Gradient hue color for background
const hueColor = computed(() => {
  const rgb = hsvToRgb(hue.value, 1, 1);
  return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
});

// Checkerboard for alpha
const checkerboard = "repeating-conic-gradient(#d0d0d0 0% 25%, transparent 0% 50%) 0 0 / 12px 12px";

// Expose imperative handle — the text input if shown, else the first control that takes
// focus: the gradient's slider pair, or the swatches' tab stop when swatchOnly.
const rootEl = useTemplateRef<HTMLElement>("rootEl");
const inputRef = useTemplateRef<HTMLInputElement>("inputEl");

function focus(opts?: FocusOptions) {
  if (inputRef.value) inputRef.value.focus(opts);
  else if (satSliderRef.value) satSliderRef.value.focus(opts);
  else roving.focusItem(swatchIndex.value);
}

// Whichever of its controls has focus.
function blur() {
  const active = document.activeElement;
  if (active instanceof HTMLElement && rootEl.value?.contains(active)) active.blur();
}

defineExpose({ el: rootEl, focus, blur });
</script>

<template>
  <div
    class="cui-color-picker"
    ref="rootEl"
    v-show="!hidden"
    :style="{
      width: cfg.width,
      // One frame around the gradient and the controls together.
      border: '1px solid var(--cui-border)',
      borderRadius: '0.5rem',
      background: 'var(--cui-surface-base, white)',
      opacity: disabled ? '0.5' : '1',
      pointerEvents: disabled ? 'none' : undefined,
      userSelect: 'none',
    }"
  >
    <!-- Saturation/brightness gradient -->
    <div
      v-if="!swatchOnly"
      ref="gradientRef"
      class="cui-color-picker__gradient"
      :style="{
        position: 'relative',
        width: '100%',
        height: cfg.gradientHeight,
        // Inside the frame's 1px border, so its corners follow the frame's.
        borderRadius: 'calc(0.5rem - 1px) calc(0.5rem - 1px) 0 0',
        cursor: 'crosshair',
        touchAction: 'none',
        overflow: 'hidden',
        background: hueColor,
      }"
      @pointerdown.prevent="onGradientPointerDown"
      @keydown="onGradientKeydown"
    >
      <!-- White overlay (left to right) -->
      <div :style="{ position: 'absolute', inset: '0', background: 'linear-gradient(to right, white, transparent)' }" />
      <!-- Black overlay (top to bottom) -->
      <div :style="{ position: 'absolute', inset: '0', background: 'linear-gradient(to bottom, transparent, black)' }" />
      <!-- Thumb: the saturation slider, with the brightness slider laid over it — two
           sliders in one place, one tab stop (see onGradientKeydown) -->
      <div
        ref="satSliderRef"
        class="cui-color-picker__thumb"
        v-bind="satAttrs"
        :style="{ ...gradientThumbPos, border: '2px solid white', boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }"
      />
      <div
        ref="valSliderRef"
        class="cui-color-picker__thumb"
        v-bind="valAttrs"
        :style="gradientThumbPos"
      />
    </div>

    <!-- Sliders + controls area -->
    <div
      :style="{
        padding: 'calc(0.75rem * var(--cui-density-scale, 1))',
        display: 'flex',
        flexDirection: 'column',
        gap: 'calc(0.625rem * var(--cui-density-scale, 1))',
      }"
    >
      <!-- Preview + sliders row -->
      <div v-if="!swatchOnly" :style="{ display: 'flex', gap: 'calc(0.625rem * var(--cui-density-scale, 1))', alignItems: 'center' }">
        <!-- Color preview circle -->
        <div
          :style="{
            width: '2rem',
            height: '2rem',
            borderRadius: '50%',
            border: '1px solid var(--cui-border)',
            flexShrink: '0',
            background: checkerboard,
            position: 'relative',
            overflow: 'hidden',
          }"
        >
          <div :style="{ position: 'absolute', inset: '0', borderRadius: '50%', background: displayColor }" />
        </div>

        <!-- Sliders -->
        <div :style="{ flex: '1', display: 'flex', flexDirection: 'column', gap: 'calc(0.5rem * var(--cui-density-scale, 1))' }">
          <!-- Hue slider -->
          <div
            ref="hueRef"
            class="cui-color-picker__hue"
            :style="{
              position: 'relative',
              height: cfg.sliderHeight,
              borderRadius: '9999px',
              cursor: 'pointer',
              touchAction: 'none',
              background: 'linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)',
            }"
            @pointerdown.prevent="onHuePointerDown"
            @keydown="onHueKeydown"
          >
            <div
              ref="hueSliderRef"
              class="cui-color-picker__thumb"
              v-bind="hueAttrs"
              :style="{
                position: 'absolute',
                left: `${(hue / 360) * 100}%`,
                top: '50%',
                width: cfg.thumbSize,
                height: cfg.thumbSize,
                borderRadius: '50%',
                border: '2px solid white',
                boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                transform: 'translate(-50%, -50%)',
                pointerEvents: 'none',
                background: hueColor,
              }"
            />
          </div>

          <!-- Alpha slider -->
          <div
            v-if="showAlpha"
            ref="alphaRef"
            class="cui-color-picker__alpha"
            :style="{
              position: 'relative',
              height: cfg.sliderHeight,
              borderRadius: '9999px',
              cursor: 'pointer',
              touchAction: 'none',
              background: checkerboard,
              overflow: 'hidden',
            }"
            @pointerdown.prevent="onAlphaPointerDown"
            @keydown="onAlphaKeydown"
          >
            <div :style="{ position: 'absolute', inset: '0', borderRadius: '9999px', background: `linear-gradient(to right, transparent, ${currentHex})` }" />
            <div
              ref="alphaSliderRef"
              class="cui-color-picker__thumb"
              v-bind="alphaAttrs"
              :style="{
                position: 'absolute',
                left: `${alpha * 100}%`,
                top: '50%',
                width: cfg.thumbSize,
                height: cfg.thumbSize,
                borderRadius: '50%',
                border: '2px solid white',
                boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                transform: 'translate(-50%, -50%)',
                pointerEvents: 'none',
                background: currentHex,
              }"
            />
          </div>
        </div>
      </div>

      <!-- Input + format toggle -->
      <div v-if="showInput" :style="{ display: 'flex', gap: 'calc(0.375rem * var(--cui-density-scale, 1))', alignItems: 'center' }">
        <!-- Swatch-only preview -->
        <div
          v-if="swatchOnly"
          :style="{
            width: '1.5rem',
            height: '1.5rem',
            borderRadius: '0.25rem',
            border: '1px solid var(--cui-border)',
            flexShrink: '0',
            background: displayColor,
          }"
        />
        <input
          ref="inputEl"
          :id="id"
          :name="name"
          :autocomplete="autocomplete"
          :aria-describedby="ariaDescribedby"
          :aria-required="ariaRequired || undefined"
          :aria-labelledby="ariaLabelledby"
          v-model="textInput"
          :disabled="disabled"
          :style="{
            flex: '1',
            padding: 'calc(0.3125rem * var(--cui-density-scale, 1)) calc(0.5rem * var(--cui-density-scale, 1))',
            fontSize: cfg.fontSize,
            fontFamily: 'var(--cui-font-mono, monospace)',
            border: '1px solid var(--cui-border-strong, var(--cui-border))',
            borderRadius: '0.25rem',
            background: 'var(--cui-surface-base, white)',
            color: 'var(--cui-text-body)',
            outline: 'none',
            minWidth: '0',
          }"
          @keydown.enter="onTextSubmit"
          @blur="onTextSubmit"
        />
        <CuiButton
          v-if="showFormatToggle"
          variant="ghost"
          :disabled="disabled"
          size="xs"
          :style="{ flexShrink: '0', fontFamily: 'var(--cui-font-mono, monospace)', fontSize: cfg.fontSize, fontWeight: '600', minWidth: '2.5rem' }"
          @click="toggleFormat"
        >
          {{ activeFormat.toUpperCase() }}
        </CuiButton>
      </div>

      <!-- Palette swatches -->
      <div
        v-if="resolvedPalette.length > 0"
        ref="swatchesRef"
        role="radiogroup"
        :aria-label="messages.colorPicker.swatches"
        :aria-disabled="disabled || undefined"
        :style="{ display: 'flex', flexWrap: 'wrap', gap: 'calc(0.3125rem * var(--cui-density-scale, 1))' }"
        @keydown="onSwatchKeydown"
        @focusin="roving.onFocusin"
      >
        <!-- Named by the hex value: colour alone is not a name (WCAG 1.4.1) -->
        <button
          v-for="(color, i) in resolvedPalette"
          :key="i"
          type="button"
          class="cui-color-picker__swatch"
          role="radio"
          :aria-checked="isSelected(i) ? 'true' : 'false'"
          :aria-label="color"
          :disabled="disabled"
          :tabindex="roving.tabIndex(i)"
          :style="{
            width: cfg.swatchSize,
            height: cfg.swatchSize,
            borderRadius: '0.25rem',
            background: color,
            cursor: 'pointer',
            border: isSelected(i) ? '2px solid var(--cui-primary)' : '1px solid var(--cui-border)',
            boxShadow: isSelected(i) ? '0 0 0 1px var(--cui-primary)' : 'none',
            transition: 'transform var(--cui-duration-press) var(--cui-ease-out)',
          }"
          @click="onSwatchClick(color)"
          @mouseenter="($event.target as HTMLElement).style.transform = 'scale(1.15)'"
          @mouseleave="($event.target as HTMLElement).style.transform = 'scale(1)'"
        ></button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* --- Themeable: zero specificity, so a consumer's own rule wins (see CuiButton.vue) --- */
/* The gradient's ring goes on the visible thumb whichever of its two sliders has focus. */
/* A thumb sits on any colour at all, where the theme's translucent ring can vanish, so its
   default is black beside the thumb's white border: one of the two always contrasts. No
   offset: the gradient clips at its edges, and an offset ring would be cut off there first.
   (The gradient's brightness slider is a borderless twin laid over its thumb, so its ring
   lands in the same place.) The swatches sit on the surface, and take the theme's ring. */
:where(.cui-color-picker__thumb:focus-visible) {
  outline: 2px solid var(--cui-color-picker-focus-ring, #000);
  outline-offset: 0;
}

:where(.cui-color-picker__swatch:focus-visible) {
  outline: 2px solid var(--cui-color-picker-focus-ring, var(--cui-primary-focus-ring));
  outline-offset: 2px;
}

/* --- Structural --- */
.cui-color-picker__swatch {
  padding: 0;
}
</style>

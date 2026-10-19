<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, useTemplateRef } from "vue";
import type { CuiSize, HideableProps, SizeableProps, DisableableProps, NativeControlProps } from "../types/common";
import { clampSize } from "../utils/sizing";
import CuiButton from "./CuiButton.vue";
import CuiIcon from "./CuiIcon.vue";
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

// Sync from modelValue prop
function syncFromProp() {
  const parsed = parseColor(props.modelValue);
  if (parsed) {
    const hsv = rgbToHsv(parsed.r, parsed.g, parsed.b);
    hue.value = hsv.h;
    sat.value = hsv.s;
    val.value = hsv.v;
    alpha.value = parsed.a;
    textInput.value = outputValue.value;
  }
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
  // A drag in progress at unmount (e.g. inside a popover closed with Escape) would
  // otherwise leave its document listeners firing against a dead instance (#246).
  endDrag?.();
});

function emitColor() {
  textInput.value = outputValue.value;
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
// One drag at a time: pointerdown calls `update` and follows that pointer on the
// document until its pointerup or pointercancel (a touch the browser takes over ends a
// pointer without a pointerup). Ending removes all three listeners together, so no
// surface can forget one. Explicit removal rather than an AbortSignal, which Safari
// before 15 ignores — within the default build target.
let endDrag: (() => void) | null = null;

function startDrag(e: PointerEvent, update: (e: PointerEvent) => void) {
  if (props.disabled) return;
  endDrag?.();
  update(e);
  // Follow only the pointer that started the drag: a second finger or a stray
  // mouse must neither move the thumb nor end the drag.
  const own = (ev: PointerEvent) => ev.pointerId === e.pointerId;
  const onMove = (ev: PointerEvent) => { if (own(ev)) update(ev); };
  const onEnd = (ev: PointerEvent) => { if (own(ev)) end(); };
  const end = () => {
    document.removeEventListener("pointermove", onMove);
    document.removeEventListener("pointerup", onEnd);
    document.removeEventListener("pointercancel", onEnd);
    if (endDrag === end) endDrag = null;
  };
  endDrag = end;
  document.addEventListener("pointermove", onMove);
  document.addEventListener("pointerup", onEnd);
  document.addEventListener("pointercancel", onEnd);
}

// Disabling mid-drag ends the drag, so a held pointer cannot keep changing the value.
watch(() => props.disabled, (disabled) => { if (disabled) endDrag?.(); });

const gradientRef = ref<HTMLElement | null>(null);
const onGradientPointerDown = (e: PointerEvent) => startDrag(e, updateGradient);

function updateGradient(e: PointerEvent) {
  if (!gradientRef.value) return;
  const rect = gradientRef.value.getBoundingClientRect();
  sat.value = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
  val.value = Math.max(0, Math.min(1, 1 - (e.clientY - rect.top) / rect.height));
  emitColor();
}

const hueRef = ref<HTMLElement | null>(null);
const onHuePointerDown = (e: PointerEvent) => startDrag(e, updateHue);

function updateHue(e: PointerEvent) {
  if (!hueRef.value) return;
  const rect = hueRef.value.getBoundingClientRect();
  hue.value = Math.max(0, Math.min(360, ((e.clientX - rect.left) / rect.width) * 360));
  emitColor();
}

const alphaRef = ref<HTMLElement | null>(null);
const onAlphaPointerDown = (e: PointerEvent) => startDrag(e, updateAlpha);

function updateAlpha(e: PointerEvent) {
  if (!alphaRef.value) return;
  const rect = alphaRef.value.getBoundingClientRect();
  alpha.value = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
  alpha.value = Math.round(alpha.value * 100) / 100;
  emitColor();
}

// --- Text input ---
function onTextSubmit() {
  const parsed = parseColor(textInput.value);
  if (parsed) {
    const hsv = rgbToHsv(parsed.r, parsed.g, parsed.b);
    hue.value = hsv.h;
    sat.value = hsv.s;
    val.value = hsv.v;
    alpha.value = parsed.a;
    emitColor();
  } else {
    textInput.value = outputValue.value;
  }
}

// --- Format toggle ---
function toggleFormat() {
  const formats: ColorFormat[] = ["hex", "rgb", "hsl"];
  const idx = formats.indexOf(activeFormat.value);
  activeFormat.value = formats[(idx + 1) % formats.length];
  textInput.value = outputValue.value;
}

// --- Swatch click ---
function onSwatchClick(color: string) {
  if (props.disabled) return;
  const parsed = parseColor(color);
  if (parsed) {
    const hsv = rgbToHsv(parsed.r, parsed.g, parsed.b);
    hue.value = hsv.h;
    sat.value = hsv.s;
    val.value = hsv.v;
    alpha.value = parsed.a;
    emitColor();
  }
}

// Gradient hue color for background
const hueColor = computed(() => {
  const rgb = hsvToRgb(hue.value, 1, 1);
  return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
});

// Checkerboard for alpha
const checkerboard = "repeating-conic-gradient(#d0d0d0 0% 25%, transparent 0% 50%) 0 0 / 12px 12px";

// Expose imperative handle — focus the text input if shown, else the root
const rootEl = useTemplateRef<HTMLElement>("rootEl");
const inputRef = useTemplateRef<HTMLInputElement>("inputEl");

function focus(opts?: FocusOptions) {
  if (inputRef.value) inputRef.value.focus(opts);
  else rootEl.value?.focus(opts);
}

function blur() {
  if (inputRef.value) inputRef.value.blur();
  else rootEl.value?.blur();
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
        borderRadius: '0.5rem 0.5rem 0 0',
        cursor: 'crosshair',
        touchAction: 'none',
        overflow: 'hidden',
        background: hueColor,
      }"
      @pointerdown.prevent="onGradientPointerDown"
    >
      <!-- White overlay (left to right) -->
      <div :style="{ position: 'absolute', inset: '0', background: 'linear-gradient(to right, white, transparent)' }" />
      <!-- Black overlay (top to bottom) -->
      <div :style="{ position: 'absolute', inset: '0', background: 'linear-gradient(to bottom, transparent, black)' }" />
      <!-- Thumb -->
      <div
        :style="{
          position: 'absolute',
          left: `${sat * 100}%`,
          top: `${(1 - val) * 100}%`,
          width: cfg.thumbSize,
          height: cfg.thumbSize,
          borderRadius: '50%',
          border: '2px solid white',
          boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
        }"
      />
    </div>

    <!-- Sliders + controls area -->
    <div
      :style="{
        padding: 'calc(0.75rem * var(--cui-density-scale, 1))',
        background: 'var(--cui-surface-base, white)',
        border: '1px solid var(--cui-border)',
        borderTop: swatchOnly ? undefined : 'none',
        borderRadius: swatchOnly ? '0.5rem' : '0 0 0.5rem 0.5rem',
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
          >
            <div
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
          >
            <div :style="{ position: 'absolute', inset: '0', borderRadius: '9999px', background: `linear-gradient(to right, transparent, ${currentHex})` }" />
            <div
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
          size="xs"
          :style="{ flexShrink: '0', fontFamily: 'var(--cui-font-mono, monospace)', fontSize: cfg.fontSize, fontWeight: '600', minWidth: '2.5rem' }"
          @click="toggleFormat"
        >
          {{ activeFormat.toUpperCase() }}
        </CuiButton>
      </div>

      <!-- Palette swatches -->
      <div v-if="resolvedPalette.length > 0" :style="{ display: 'flex', flexWrap: 'wrap', gap: 'calc(0.3125rem * var(--cui-density-scale, 1))' }">
        <div
          v-for="color in resolvedPalette"
          :key="color"
          :style="{
            width: cfg.swatchSize,
            height: cfg.swatchSize,
            borderRadius: '0.25rem',
            background: color,
            cursor: 'pointer',
            border: currentHex.toLowerCase() === color.toLowerCase() ? '2px solid var(--cui-primary)' : '1px solid var(--cui-border)',
            boxShadow: currentHex.toLowerCase() === color.toLowerCase() ? '0 0 0 1px var(--cui-primary)' : 'none',
            transition: 'transform 0.1s ease',
          }"
          @click="onSwatchClick(color)"
          @mouseenter="($event.target as HTMLElement).style.transform = 'scale(1.15)'"
          @mouseleave="($event.target as HTMLElement).style.transform = 'scale(1)'"
        />
      </div>
    </div>
  </div>
</template>

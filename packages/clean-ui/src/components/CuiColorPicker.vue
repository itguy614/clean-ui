<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from "vue";
import CuiButton from "./CuiButton.vue";
import CuiIcon from "./CuiIcon.vue";
import {
  hsvToRgb, rgbToHsv, rgbToHex, parseColor, formatColor,
  PALETTE_BASIC, PALETTE_MATERIAL, PALETTE_TAILWIND, getThemePalette,
  type ColorFormat,
} from "../utils/color";

export type ColorPickerSize = "sm" | "md" | "lg";
export type PresetPalette = "theme" | "basic" | "material" | "tailwind";

export interface CuiColorPickerProps {
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
  /** Size */
  size?: ColorPickerSize;
  /** Disabled */
  disabled?: boolean;
  /** Hidden */
  hidden?: boolean;
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
const sizeConfig: Record<ColorPickerSize, { width: string; gradientHeight: string; sliderHeight: string; thumbSize: string; swatchSize: string; fontSize: string }> = {
  sm: { width: "220px", gradientHeight: "130px", sliderHeight: "10px", thumbSize: "14px", swatchSize: "20px", fontSize: "0.75rem" },
  md: { width: "280px", gradientHeight: "160px", sliderHeight: "12px", thumbSize: "16px", swatchSize: "24px", fontSize: "0.8125rem" },
  lg: { width: "340px", gradientHeight: "200px", sliderHeight: "14px", thumbSize: "18px", swatchSize: "28px", fontSize: "0.875rem" },
};
const cfg = computed(() => sizeConfig[props.size]);

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
onUnmounted(() => { observer?.disconnect(); });

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

// --- Gradient area interaction ---
const gradientRef = ref<HTMLElement | null>(null);
let gradientDragging = false;

function onGradientPointerDown(e: PointerEvent) {
  if (props.disabled) return;
  gradientDragging = true;
  updateGradient(e);
  document.addEventListener("pointermove", onGradientPointerMove);
  document.addEventListener("pointerup", onGradientPointerUp);
}

function onGradientPointerMove(e: PointerEvent) {
  if (gradientDragging) updateGradient(e);
}

function onGradientPointerUp() {
  gradientDragging = false;
  document.removeEventListener("pointermove", onGradientPointerMove);
  document.removeEventListener("pointerup", onGradientPointerUp);
}

function updateGradient(e: PointerEvent) {
  if (!gradientRef.value) return;
  const rect = gradientRef.value.getBoundingClientRect();
  sat.value = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
  val.value = Math.max(0, Math.min(1, 1 - (e.clientY - rect.top) / rect.height));
  emitColor();
}

// --- Hue slider interaction ---
const hueRef = ref<HTMLElement | null>(null);
let hueDragging = false;

function onHuePointerDown(e: PointerEvent) {
  if (props.disabled) return;
  hueDragging = true;
  updateHue(e);
  document.addEventListener("pointermove", onHuePointerMove);
  document.addEventListener("pointerup", onHuePointerUp);
}

function onHuePointerMove(e: PointerEvent) {
  if (hueDragging) updateHue(e);
}

function onHuePointerUp() {
  hueDragging = false;
  document.removeEventListener("pointermove", onHuePointerMove);
  document.removeEventListener("pointerup", onHuePointerUp);
}

function updateHue(e: PointerEvent) {
  if (!hueRef.value) return;
  const rect = hueRef.value.getBoundingClientRect();
  hue.value = Math.max(0, Math.min(360, ((e.clientX - rect.left) / rect.width) * 360));
  emitColor();
}

// --- Alpha slider interaction ---
const alphaRef = ref<HTMLElement | null>(null);
let alphaDragging = false;

function onAlphaPointerDown(e: PointerEvent) {
  if (props.disabled) return;
  alphaDragging = true;
  updateAlpha(e);
  document.addEventListener("pointermove", onAlphaPointerMove);
  document.addEventListener("pointerup", onAlphaPointerUp);
}

function onAlphaPointerMove(e: PointerEvent) {
  if (alphaDragging) updateAlpha(e);
}

function onAlphaPointerUp() {
  alphaDragging = false;
  document.removeEventListener("pointermove", onAlphaPointerMove);
  document.removeEventListener("pointerup", onAlphaPointerUp);
}

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
</script>

<template>
  <div
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
      :style="{
        position: 'relative',
        width: '100%',
        height: cfg.gradientHeight,
        borderRadius: '0.5rem 0.5rem 0 0',
        cursor: 'crosshair',
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
        padding: '0.75rem',
        background: 'var(--cui-surface-base, white)',
        border: '1px solid var(--cui-border)',
        borderTop: swatchOnly ? undefined : 'none',
        borderRadius: swatchOnly ? '0.5rem' : '0 0 0.5rem 0.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.625rem',
      }"
    >
      <!-- Preview + sliders row -->
      <div v-if="!swatchOnly" :style="{ display: 'flex', gap: '0.625rem', alignItems: 'center' }">
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
        <div :style="{ flex: '1', display: 'flex', flexDirection: 'column', gap: '0.5rem' }">
          <!-- Hue slider -->
          <div
            ref="hueRef"
            :style="{
              position: 'relative',
              height: cfg.sliderHeight,
              borderRadius: '9999px',
              cursor: 'pointer',
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
            :style="{
              position: 'relative',
              height: cfg.sliderHeight,
              borderRadius: '9999px',
              cursor: 'pointer',
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
      <div v-if="showInput" :style="{ display: 'flex', gap: '0.375rem', alignItems: 'center' }">
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
          v-model="textInput"
          :style="{
            flex: '1',
            padding: '0.3125rem 0.5rem',
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
      <div v-if="resolvedPalette.length > 0" :style="{ display: 'flex', flexWrap: 'wrap', gap: '0.3125rem' }">
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

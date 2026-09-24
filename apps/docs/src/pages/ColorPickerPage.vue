<script setup lang="ts">
import { ref } from "vue";
import { CuiButton, CuiColorPicker, CuiFlex, CuiIcon, CuiInput, CuiPopover } from "@itguy614/clean-ui";
import DocPage from "../components/DocPage.vue";
import Example from "../components/Example.vue";
import meta from "../meta/color-picker";

const color1 = ref("#3b82f6");
const color2 = ref("#22c55e");
const color3 = ref("#ef4444");
const color4 = ref("rgba(99, 102, 241, 0.75)");
const color5 = ref("#8b5cf6");
const color6 = ref("#f97316");

// Complex example state
const inputColor = ref("#6366f1");
const popoverVisible = ref(false);

function onPickerChange(val: string) {
  inputColor.value = val;
  // Keep the popover open while picking — it closes on click-outside or Escape.
}

function onHexInput(val: string | number) {
  let hex = String(val).replace(/[^#a-fA-F0-9]/g, "");
  if (!hex.startsWith("#")) hex = "#" + hex;
  if (/^#[a-fA-F0-9]{6}$/i.test(hex)) {
    inputColor.value = hex;
  }
}
</script>

<template>
  <DocPage :meta="meta">
    <template #usage>
      <Example
        code-open
        :code="`<CuiColorPicker v-model=&quot;color&quot; />`"
      >
        <CuiFlex gap="4" class="items-start">
          <CuiColorPicker v-model="color1" />
          <div>
            <div class="text-sm font-medium" style="margin-bottom: 0.5rem;">Selected:</div>
            <div :style="{ width: '4rem', height: '4rem', borderRadius: '0.5rem', background: color1, border: '1px solid var(--cui-border)' }" />
            <code class="text-xs" style="display: block; margin-top: 0.375rem; color: var(--cui-text-secondary);">{{ color1 }}</code>
          </div>
        </CuiFlex>
      </Example>
    </template>

    <template #accessibility>
      <p class="text-surface-700 dark:text-surface-300">
        The text field is the component's keyboard path. It is a real
        <code>&lt;input&gt;</code> carrying <code>id</code>, <code>name</code> and the
        <code>aria-*</code> props, it accepts any format <code>parseColor</code>
        understands, and it commits on <code>Enter</code> or on blur — an unparseable
        value is reverted rather than emitted. Keep <code>showInput</code> on: it is what
        makes the component operable without a pointer, and colour is exactly the kind of
        value people want to paste rather than hunt for.
      </p>
      <ul class="list-disc pl-5 text-surface-700 dark:text-surface-300">
        <li>
          The gradient area, the hue slider and the alpha slider are pointer-driven. They
          carry no <code>role="slider"</code> and are not in the tab order, so what they
          express has to be reachable through the text field.
        </li>
        <li>
          Swatches are decorative <code>div</code>s with a click handler. Where a fixed
          set of named colours is the real choice — a label colour, a calendar colour —
          a <code>CuiRadioGroup</code> or <code>CuiSelect</code> of named options is the
          better control, and it will announce the name rather than a hex string.
        </li>
        <li>
          Selection is shown by a ring on the active swatch and nothing else, so the
          swatch row alone does not distinguish two similar colours for anyone who cannot
          see them. The text field beside it always reads the current value.
        </li>
        <li>
          The component has no <code>label</code> prop. Wrap it in a
          <code>CuiFormField</code>, which points <code>aria-labelledby</code> and
          <code>aria-describedby</code> at its own label and help text.
        </li>
      </ul>
      <p class="text-surface-700 dark:text-surface-300">
        <strong>Known gaps.</strong> <code>disabled</code> dims the panel and sets
        <code>pointer-events: none</code>, but does not reach the text field — it stays
        focusable and typing into it still emits. If you disable the picker inside a form,
        disable or hide your own wrapper too rather than relying on the prop alone.
      </p>
    </template>

    <template #examples>
      <!-- With alpha -->
      <Example title="With Alpha Slider" :code="`<CuiColorPicker v-model=&quot;color&quot; show-alpha />`">
        <CuiFlex gap="4" class="items-start">
          <CuiColorPicker v-model="color4" show-alpha format="rgb" />
          <div>
            <div class="text-sm font-medium" style="margin-bottom: 0.5rem;">Selected:</div>
            <div :style="{ width: '4rem', height: '4rem', borderRadius: '0.5rem', background: color4, border: '1px solid var(--cui-border)' }" />
            <code class="text-xs" style="display: block; margin-top: 0.375rem; color: var(--cui-text-secondary); max-width: 12rem; word-break: break-all;">{{ color4 }}</code>
          </div>
        </CuiFlex>
      </Example>

      <!-- Theme palette -->
      <Example title="Theme Palette" :code="`<CuiColorPicker preset-palette=&quot;theme&quot; />`">
        <CuiColorPicker v-model="color5" preset-palette="theme" />
      </Example>

      <!-- Basic palette -->
      <Example title="Basic Palette" :code="`<CuiColorPicker v-model=&quot;color&quot; preset-palette=&quot;basic&quot; />`">
        <CuiColorPicker v-model="color2" preset-palette="basic" />
      </Example>

      <!-- Material palette -->
      <Example title="Material Palette" :code="`<CuiColorPicker v-model=&quot;color&quot; preset-palette=&quot;material&quot; />`">
        <CuiColorPicker v-model="color3" preset-palette="material" />
      </Example>

      <!-- Swatch only -->
      <Example title="Swatch Only Mode" :code="`<CuiColorPicker swatch-only preset-palette=&quot;tailwind&quot; />`">
        <CuiColorPicker v-model="color6" swatch-only preset-palette="tailwind" />
      </Example>

      <!-- Custom palette -->
      <Example title="Custom Palette" :code="`<CuiColorPicker :palette=&quot;['#ff0000', '#00ff00', '#0000ff']&quot; />`">
        <CuiColorPicker
          v-model="color2"
          :palette="['#1a1a2e', '#16213e', '#0f3460', '#533483', '#e94560', '#f5f5f5', '#2d3436', '#636e72', '#b2bec3', '#dfe6e9']"
        />
      </Example>

      <!-- Complex: Input + Popover -->
      <Example title="Real-World: Input with Color Popover" :code="`<CuiInput :model-value=&quot;color&quot; placeholder=&quot;#000000&quot;>
  <template #prefix>
    <div :style=&quot;{ background: color, ... }&quot; />
  </template>
  <template #suffix-button>
    <CuiPopover v-model:visible=&quot;open&quot;>
      <CuiButton ...><CuiIcon name=&quot;eyedropper&quot; /></CuiButton>
      <template #content>
        <CuiColorPicker @update:modelValue=&quot;onPick&quot; />
      </template>
    </CuiPopover>
  </template>
</CuiInput>`">
        <div style="max-width: 20rem;">
          <label style="display: block; margin-bottom: 0.375rem; font-size: 0.875rem; font-weight: 500; color: var(--cui-text-secondary);">Brand Color</label>
          <CuiInput
            :model-value="inputColor"
            placeholder="#000000"
            @update:model-value="onHexInput"
          >
            <template #prefix>
              <div
                :style="{
                  width: '1.25rem',
                  height: '1.25rem',
                  borderRadius: '0.25rem',
                  border: '1px solid var(--cui-border)',
                  background: inputColor,
                  flexShrink: '0',
                }"
              />
            </template>
            <template #suffix-button>
              <CuiPopover
                v-model:visible="popoverVisible"
                placement="bottom"
                :closable="false"
                no-arrow
                width="296px"
              >
                <CuiButton variant="outline" size="md">
                  <CuiIcon name="eyedropper" size="0.875rem" />
                </CuiButton>
                <template #content>
                  <CuiColorPicker
                    :model-value="inputColor"
                    preset-palette="theme"
                    show-alpha
                    @update:model-value="onPickerChange"
                  />
                </template>
              </CuiPopover>
            </template>
          </CuiInput>
          <div style="margin-top: 0.5rem; display: flex; align-items: center; gap: 0.5rem;">
            <div
              :style="{
                width: '2.5rem',
                height: '2.5rem',
                borderRadius: '0.375rem',
                background: inputColor,
                border: '1px solid var(--cui-border)',
              }"
            />
            <div>
              <div class="text-sm font-semibold">Preview</div>
              <code class="text-xs" style="color: var(--cui-text-secondary);">{{ inputColor }}</code>
            </div>
          </div>
        </div>
      </Example>

      <!-- Sizes -->
      <Example title="Sizes" :code="`<CuiColorPicker size=&quot;sm&quot; />
<CuiColorPicker size=&quot;md&quot; />
<CuiColorPicker size=&quot;lg&quot; />`">
        <CuiFlex gap="4" class="items-start flex-wrap">
          <div>
            <div class="text-xs font-medium mb-2" style="color: var(--cui-text-secondary);">Small:</div>
            <CuiColorPicker :model-value="'#3b82f6'" size="sm" preset-palette="basic" />
          </div>
          <div>
            <div class="text-xs font-medium mb-2" style="color: var(--cui-text-secondary);">Medium:</div>
            <CuiColorPicker :model-value="'#22c55e'" size="md" preset-palette="basic" />
          </div>
          <div>
            <div class="text-xs font-medium mb-2" style="color: var(--cui-text-secondary);">Large:</div>
            <CuiColorPicker :model-value="'#ef4444'" size="lg" preset-palette="basic" />
          </div>
        </CuiFlex>
      </Example>
    </template>
  </DocPage>
</template>

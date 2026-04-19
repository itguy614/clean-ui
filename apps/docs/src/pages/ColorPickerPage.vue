<script setup lang="ts">
import { ref, watch } from "vue";
import { CuiButton, CuiColorPicker, CuiFlex, CuiGrid, CuiIcon, CuiInput, CuiPopover, CuiStack } from "@itguy614/clean-ui";
import PropTable from "../components/PropTable.vue";
import Example from "../components/Example.vue";

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
  popoverVisible.value = false;
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
  <CuiStack spacing="8">
    <div>
      <h1 class="text-4xl font-bold">Color Picker</h1>
      <p class="mt-2 text-lg text-surface-600 dark:text-surface-400">
        A rich color selector with gradient area, hue slider, alpha slider,
        text input with format toggle, and preset palettes including the current theme.
      </p>
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">Props</h2>
      <PropTable
        :props="[
          { name: 'modelValue', type: 'string', default: '#000000', description: 'Color value (v-model, any supported format)' },
          { name: 'format', type: 'hex | rgb | hsl', default: 'hex', description: 'Output format' },
          { name: 'palette', type: 'string[]', default: '—', description: 'Custom swatch palette (array of hex colors)' },
          { name: 'presetPalette', type: 'theme | basic | material | tailwind', default: '—', description: 'Built-in preset palette' },
          { name: 'showAlpha', type: 'boolean', default: 'false', description: 'Show alpha/opacity slider' },
          { name: 'showInput', type: 'boolean', default: 'true', description: 'Show text input' },
          { name: 'showFormatToggle', type: 'boolean', default: 'true', description: 'Allow toggling between HEX/RGB/HSL' },
          { name: 'swatchOnly', type: 'boolean', default: 'false', description: 'Only show swatches, no gradient picker' },
          { name: 'size', type: 'sm | md | lg', default: 'md', description: 'Size' },
          { name: 'disabled', type: 'boolean', default: 'false', description: 'Disabled state' },
        ]"
      />
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">Examples</h2>
      <CuiStack spacing="6">

        <!-- Basic -->
        <Example title="Basic Color Picker" :code="`<CuiColorPicker v-model=&quot;color&quot; />`">
          <CuiFlex gap="4" class="items-start">
            <CuiColorPicker v-model="color1" />
            <div>
              <div class="text-sm font-medium" style="margin-bottom: 0.5rem;">Selected:</div>
              <div :style="{ width: '4rem', height: '4rem', borderRadius: '0.5rem', background: color1, border: '1px solid var(--cui-border)' }" />
              <code class="text-xs" style="display: block; margin-top: 0.375rem; color: var(--cui-text-secondary);">{{ color1 }}</code>
            </div>
          </CuiFlex>
        </Example>

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
        <Example title="Basic Palette">
          <CuiColorPicker v-model="color2" preset-palette="basic" />
        </Example>

        <!-- Material palette -->
        <Example title="Material Palette">
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
                  <CuiButton variant="outline" size="md" style="height: 100%; border-left: none; border-radius: 0;">
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
        <Example title="Sizes">
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

      </CuiStack>
    </div>
  </CuiStack>
</template>

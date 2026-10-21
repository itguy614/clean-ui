<script setup lang="ts">
import { computed, ref } from "vue";
import {
  CuiButton,
  CuiCard,
  CuiCardBody,
  CuiColorPicker,
  CuiFlex,
  CuiIcon,
  CuiInput,
  CuiPopover,
  CuiStack,
  CuiTable,
  CuiTableBody,
  CuiTableCell,
  CuiTableHead,
  CuiTableRow,
  formatColor,
  parseColor,
  PALETTE_BASIC,
  PALETTE_MATERIAL,
  PALETTE_TAILWIND,
} from "@itguy614/clean-ui";
import DocPage from "../components/DocPage.vue";
import Example from "../components/Example.vue";
import meta from "../meta/color-picker";

const color1 = ref("#3b82f6");
const color2 = ref("#22c55e");
const color3 = ref("#ef4444");
const color4 = ref("rgba(99, 102, 241, 0.75)");
const color5 = ref("#8b5cf6");
const color6 = ref("#f97316");

// Color utilities demo
const utilInput = ref("hsla(160, 84%, 39%, 0.8)");
const utilParsed = computed(() => parseColor(utilInput.value));
const utilFormats = computed(() => {
  const c = utilParsed.value;
  if (!c) return null;
  return {
    hex: formatColor(c.r, c.g, c.b, c.a, "hex"),
    rgb: formatColor(c.r, c.g, c.b, c.a, "rgb"),
    hsl: formatColor(c.r, c.g, c.b, c.a, "hsl"),
  };
});

const conversions = [
  { fn: "parseColor(input: string)", returns: "RGBA | null", notes: "Hex (#rgb, #rrggbb, #rrggbbaa), rgb()/rgba() and hsl()/hsla() in comma syntax. Alpha defaults to 1; a hex alpha byte is ignored. Anything else — named colours, space-separated syntax — is null." },
  { fn: "formatColor(r, g, b, a, format: ColorFormat)", returns: "string", notes: "format is \"hex\" | \"rgb\" | \"hsl\". Hex drops alpha; rgb and hsl switch to rgba()/hsla() when a < 1, alpha to two decimals." },
  { fn: "rgbToHex(r, g, b)", returns: "string", notes: "Lowercase #rrggbb; channels are rounded." },
  { fn: "hexToRgb(hex: string)", returns: "RGB | null", notes: "3, 6 or 8 digits, leading # optional; an 8-digit alpha is discarded. Any other length is null." },
  { fn: "rgbToHsl(r, g, b)", returns: "HSL", notes: "h 0–360, s and l 0–100 (percent), all rounded to integers." },
  { fn: "hslToRgb(h, s, l)", returns: "RGB", notes: "s and l are percentages (0–100), not fractions." },
  { fn: "rgbToHsv(r, g, b)", returns: "HSV", notes: "h 0–360, s and v 0–1, unrounded — the picker's gradient coordinates." },
  { fn: "hsvToRgb(h, s, v)", returns: "RGB", notes: "h wraps around 360; s and v are clamped to 0–1." },
];

const palettes = [
  { name: "PALETTE_BASIC", preset: "basic", colors: PALETTE_BASIC },
  { name: "PALETTE_MATERIAL", preset: "material", colors: PALETTE_MATERIAL },
  { name: "PALETTE_TAILWIND", preset: "tailwind", colors: PALETTE_TAILWIND },
];

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

    <template #extra>
      <div>
        <h2 id="color-utilities" class="mb-4 text-2xl font-semibold">Color utilities</h2>
        <CuiStack spacing="4">
          <CuiCard variant="outline">
            <CuiCardBody>
              <p class="mb-3 text-surface-600 dark:text-surface-400">
                The picker's colour maths is exported for use on its own — to normalise a value
                before storing it, to show it in another format, or to build a palette. Every
                channel is 0–255; <code class="cui-code">RGB</code>, <code class="cui-code">RGBA</code>, <code class="cui-code">HSL</code>,
                <code class="cui-code">HSV</code> and <code class="cui-code">ColorFormat</code> are exported as types.
              </p>
              <pre class="cui-pre"><code class="cui-code">import { parseColor, formatColor, rgbToHex, hexToRgb, rgbToHsl, hslToRgb, hsvToRgb, rgbToHsv } from "@itguy614/clean-ui";

const c = parseColor("rgba(59, 130, 246, 0.5)");  // { r: 59, g: 130, b: 246, a: 0.5 }
formatColor(c!.r, c!.g, c!.b, c!.a, "hsl");       // "hsla(217, 91%, 60%, 0.50)"

rgbToHex(59, 130, 246);                            // "#3b82f6"
hexToRgb("#3b82f6");                               // { r: 59, g: 130, b: 246 }
rgbToHsl(59, 130, 246);                            // { h: 217, s: 91, l: 60 }
hslToRgb(217, 91, 60);                             // { r: 60, g: 131, b: 246 }
rgbToHsv(255, 0, 0);                               // { h: 0, s: 1, v: 1 }
hsvToRgb(120, 1, 0.5);                             // { r: 0, g: 128, b: 0 }</code></pre>
            </CuiCardBody>
          </CuiCard>

          <CuiCard variant="outline">
            <CuiCardBody no-padding>
              <CuiTable size="sm">
                <CuiTableHead>
                  <CuiTableRow>
                    <CuiTableCell>Function</CuiTableCell>
                    <CuiTableCell>Returns</CuiTableCell>
                    <CuiTableCell>Notes</CuiTableCell>
                  </CuiTableRow>
                </CuiTableHead>
                <CuiTableBody>
                  <CuiTableRow v-for="row in conversions" :key="row.fn">
                    <CuiTableCell><code class="cui-code">{{ row.fn }}</code></CuiTableCell>
                    <CuiTableCell><code class="cui-code">{{ row.returns }}</code></CuiTableCell>
                    <CuiTableCell>{{ row.notes }}</CuiTableCell>
                  </CuiTableRow>
                </CuiTableBody>
              </CuiTable>
            </CuiCardBody>
          </CuiCard>

          <Example title="Parse and reformat" :code="`const c = parseColor(input);
formatColor(c.r, c.g, c.b, c.a, &quot;hex&quot;);
formatColor(c.r, c.g, c.b, c.a, &quot;rgb&quot;);
formatColor(c.r, c.g, c.b, c.a, &quot;hsl&quot;);`">
            <CuiFlex gap="4" class="items-start flex-wrap">
              <div style="width: 18rem;">
                <CuiInput v-model="utilInput" label="Any colour string" />
              </div>
              <div class="text-sm" style="color: var(--cui-text-secondary); padding-top: 1.5rem;">
                <template v-if="utilFormats">
                  <div>hex: <code class="cui-code">{{ utilFormats.hex }}</code></div>
                  <div>rgb: <code class="cui-code">{{ utilFormats.rgb }}</code></div>
                  <div>hsl: <code class="cui-code">{{ utilFormats.hsl }}</code></div>
                </template>
                <div v-else>parseColor returned <code class="cui-code">null</code></div>
              </div>
            </CuiFlex>
          </Example>

          <CuiCard variant="outline">
            <CuiCardBody>
              <p class="mb-3 text-surface-600 dark:text-surface-400">
                <strong>Palettes.</strong> The arrays behind <code>preset-palette</code> are
                exported as plain hex-string arrays, so you can extend one and pass it to
                <code>palette</code>, or reuse it elsewhere.
              </p>
              <CuiStack spacing="3" class="mb-3">
                <div v-for="p in palettes" :key="p.name">
                  <div class="mb-1 text-sm">
                    <code class="cui-code">{{ p.name }}</code>
                    <span style="color: var(--cui-text-secondary);"> — preset-palette="{{ p.preset }}", {{ p.colors.length }} colours</span>
                  </div>
                  <div style="display: flex; flex-wrap: wrap; gap: 0.25rem;">
                    <div
                      v-for="c in p.colors"
                      :key="c"
                      :title="c"
                      :style="{ width: '1.25rem', height: '1.25rem', borderRadius: '0.25rem', background: c, border: '1px solid var(--cui-border)' }"
                    />
                  </div>
                </div>
              </CuiStack>
              <p class="mb-3 text-surface-600 dark:text-surface-400">
                <code>getThemePalette(): string[]</code> is what <code>preset-palette="theme"</code>
                uses. It reads the live <code>--cui-{role}</code>, <code>-bg</code>,
                <code>-border</code>, <code>-hover</code> and <code>-active</code> tokens of the six
                colour roles, plus six steps of the surface scale, resolves each to hex through a
                hidden element, and returns them de-duplicated. Because it reads computed style,
                the result reflects the theme and mode in force when you call it — call it again
                after a theme switch — and it returns <code>[]</code> during server rendering.
              </p>
              <pre class="cui-pre"><code class="cui-code">import { PALETTE_BASIC, PALETTE_MATERIAL, PALETTE_TAILWIND, getThemePalette } from "@itguy614/clean-ui";

const brand = [...PALETTE_TAILWIND, "#0f3460", "#e94560"];
// &lt;CuiColorPicker v-model="color" :palette="brand" /&gt;

const themed = getThemePalette();  // e.g. ["#eef2ff", "#a5b4fc", "#4f46e5", ...]</code></pre>
            </CuiCardBody>
          </CuiCard>
        </CuiStack>
      </div>
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

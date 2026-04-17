<script setup lang="ts">
import {
  CuiAlert,
  CuiBadge,
  CuiButton,
  CuiCard,
  CuiCardBody,
  CuiCardHeader,
  CuiCheckbox,
  CuiFlex,
  CuiFormField,
  CuiGrid,
  CuiIcon,
  CuiInput,
  CuiRadio,
  CuiRadioGroup,
  CuiSelect,
  CuiStack,
  CuiToggle,
  useTheme,
} from "@itguy614/clean-ui";
import PropTable from "../components/PropTable.vue";
import Example from "../components/Example.vue";
import { ref } from "vue";

const { theme, presets, setTheme } = useTheme();
const demoRadio = ref("option1");
const demoCheck = ref(true);
const demoToggle = ref(true);
const demoSelect = ref<string | null>(null);
</script>

<template>
  <CuiStack spacing="8">
    <div>
      <h1 class="text-4xl font-bold">Themes</h1>
      <p class="mt-2 text-lg text-surface-600 dark:text-surface-400">
        Switch the entire color palette by applying a theme class to any ancestor.
        Themes override the primary and surface CSS custom properties — all
        components update automatically. Persists to localStorage.
      </p>
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">useTheme() API</h2>
      <CuiCard>
        <CuiCardBody>
          <pre class="cui-pre"><code>import { useTheme } from '@itguy614/clean-ui'

const { theme, presets, setTheme } = useTheme()

// Switch theme
setTheme('navy')
setTheme('forest')
setTheme('default') // back to indigo

// Reactive — components update instantly
// Persists to localStorage automatically</code></pre>
        </CuiCardBody>
      </CuiCard>
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">Available Themes</h2>
      <PropTable
        :props="presets.map(p => ({
          name: p.id,
          type: `cui-theme-${p.id}`,
          default: p.id === 'default' ? 'yes' : '-',
          description: p.description,
        }))"
      />
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">Live Preview</h2>
      <p class="mb-4 text-surface-600 dark:text-surface-400">
        Click a theme below or use the palette icon in the header. All components on this page update instantly.
      </p>

      <!-- Theme selector buttons -->
      <Example title="Theme Selector">
        <CuiFlex gap="2" class="flex-wrap">
          <CuiButton
            v-for="preset in presets"
            :key="preset.id"
            :variant="theme === preset.id ? 'solid' : 'outline'"
            size="sm"
            @click="setTheme(preset.id)"
          >
            {{ preset.label }}
          </CuiButton>
        </CuiFlex>
      </Example>

      <!-- Component preview -->
      <CuiStack spacing="6" class="mt-6">
        <Example title="Buttons">
          <CuiFlex gap="3" class="flex-wrap">
            <CuiButton variant="solid">Solid</CuiButton>
            <CuiButton variant="outline">Outline</CuiButton>
            <CuiButton variant="dash">Dash</CuiButton>
            <CuiButton variant="ghost">Ghost</CuiButton>
          </CuiFlex>
        </Example>

        <Example title="Badges">
          <CuiFlex gap="3" class="flex-wrap items-center">
            <CuiBadge variant="subtle">Subtle</CuiBadge>
            <CuiBadge variant="solid">Solid</CuiBadge>
            <CuiBadge variant="outline">Outline</CuiBadge>
            <CuiBadge dot animation="ping" />
          </CuiFlex>
        </Example>

        <Example title="Form Controls">
          <CuiStack spacing="4" class="max-w-md">
            <CuiFormField label="Input">
              <CuiInput placeholder="Focus to see theme color..." />
            </CuiFormField>
            <CuiFormField label="Select">
              <CuiSelect
                v-model="demoSelect"
                :options="['Option A', 'Option B', 'Option C']"
                placeholder="Select..."
              />
            </CuiFormField>
            <CuiRadioGroup v-model="demoRadio" variant="buttons" label="Radio buttons">
              <CuiRadio value="option1" label="One" />
              <CuiRadio value="option2" label="Two" />
              <CuiRadio value="option3" label="Three" />
            </CuiRadioGroup>
            <CuiFlex gap="6">
              <CuiCheckbox v-model="demoCheck" label="Checkbox" />
              <CuiToggle v-model="demoToggle" label="Toggle" />
            </CuiFlex>
          </CuiStack>
        </Example>

        <Example title="Alerts">
          <CuiStack spacing="3">
            <CuiAlert color="primary" title="Primary alert" entrance="none">
              This adapts to the current theme's primary color.
            </CuiAlert>
            <CuiAlert color="success" title="Success alert" entrance="none">
              Semantic colors stay consistent across themes.
            </CuiAlert>
          </CuiStack>
        </Example>

        <Example title="Color Scale">
          <div class="flex gap-1 overflow-x-auto">
            <div
              v-for="shade in [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]"
              :key="shade"
              class="flex h-12 w-12 shrink-0 items-end rounded p-1"
              :style="{ background: `var(--color-primary-${shade})` }"
            >
              <span class="text-xs font-medium" :class="shade <= 300 ? 'text-surface-900' : 'text-white'">
                {{ shade }}
              </span>
            </div>
          </div>
        </Example>
      </CuiStack>
    </div>

    <!-- CSS Usage -->
    <div>
      <h2 class="mb-4 text-2xl font-semibold">CSS Usage</h2>
      <CuiCard>
        <CuiCardBody>
          <p class="mb-3 text-surface-600 dark:text-surface-400">
            Themes are CSS classes. Apply them anywhere in the DOM tree:
          </p>
          <pre class="cui-pre"><code>&lt;!-- Global: apply to html or body --&gt;
&lt;html class="cui-theme-navy"&gt;

&lt;!-- Scoped: apply to a section --&gt;
&lt;div class="cui-theme-forest"&gt;
  &lt;!-- Everything inside uses forest green --&gt;
&lt;/div&gt;

&lt;!-- Programmatic --&gt;
&lt;script setup&gt;
import { useTheme } from '@itguy614/clean-ui'
const { setTheme } = useTheme()
setTheme('teal')
&lt;/script&gt;</code></pre>
        </CuiCardBody>
      </CuiCard>
    </div>

    <!-- Custom Themes -->
    <div>
      <h2 class="mb-4 text-2xl font-semibold">Custom Themes</h2>
      <CuiCard>
        <CuiCardBody>
          <p class="mb-3 text-surface-600 dark:text-surface-400">
            Create your own theme by defining a CSS class that overrides the color variables:
          </p>
          <pre class="cui-pre"><code>.cui-theme-brand {
  --color-primary-50:  #fef2f2;
  --color-primary-100: #fee2e2;
  --color-primary-200: #fecaca;
  --color-primary-300: #fca5a5;
  --color-primary-400: #f87171;
  --color-primary-500: #ef4444;
  --color-primary-600: #dc2626;
  --color-primary-700: #b91c1c;
  --color-primary-800: #991b1b;
  --color-primary-900: #7f1d1d;
  --color-primary-950: #450a0a;

  /* Optionally override surface for a different neutral feel */
  --color-surface-50: #fafaf9;
  /* ... */
}</code></pre>
        </CuiCardBody>
      </CuiCard>
    </div>
  </CuiStack>
</template>

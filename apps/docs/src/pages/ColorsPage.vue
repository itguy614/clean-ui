<script setup lang="ts">
import { CuiButton, CuiCard, CuiCardBody, CuiFlex, CuiStack } from "@itguy614/clean-ui";

const roles = [
  { name: 'primary', label: 'Primary', desc: 'Brand color, CTAs, links, active states' },
  { name: 'secondary', label: 'Secondary', desc: 'Muted brand variant, less prominent UI' },
  { name: 'success', label: 'Success', desc: 'Positive actions, confirmations, valid states' },
  { name: 'error', label: 'Error', desc: 'Destructive actions, validation errors' },
  { name: 'warning', label: 'Warning', desc: 'Caution states, important notices' },
  { name: 'info', label: 'Info', desc: 'Informational messages, neutral highlights' },
];

const shades = [100, 300, 500, 700, 900];

const slots = [
  { name: 'default', token: '--cui-{role}', desc: 'Hero shade — buttons, links' },
  { name: 'hover', token: '--cui-{role}-hover', desc: 'Hover state' },
  { name: 'active', token: '--cui-{role}-active', desc: 'Pressed/active state' },
  { name: 'bg', token: '--cui-{role}-bg', desc: 'Light background tint — alerts, badges' },
  { name: 'border', token: '--cui-{role}-border', desc: 'Border color' },
  { name: 'text', token: '--cui-{role}-text', desc: 'Text ON the hero background' },
  { name: 'focus-ring', token: '--cui-{role}-focus-ring', desc: 'Focus outline (semi-transparent)' },
  { name: 'subtle', token: '--cui-{role}-subtle', desc: 'Barely-there tint — cards, sections' },
  { name: 'muted', token: '--cui-{role}-muted', desc: 'Desaturated — disabled, inactive' },
];
</script>

<template>
  <CuiStack spacing="10">
    <div>
      <h1 class="text-4xl font-bold">Colors</h1>
      <p class="mt-2 text-lg text-surface-600 dark:text-surface-400">
        WCAG AA accessible color system with 6 semantic roles, surface neutrals,
        condensed scales, and 9 semantic slots per role. All overridable via
        <code class="cui-code">--cui-*</code> custom properties.
      </p>
    </div>

    <!-- Palette swatches -->
    <div>
      <h2 class="mb-4 text-2xl font-semibold">Color Roles</h2>
      <CuiStack spacing="6">
        <div v-for="role in roles" :key="role.name">
          <div class="mb-2 flex items-baseline gap-2">
            <h3 class="text-lg font-semibold capitalize">{{ role.label }}</h3>
            <span class="text-sm text-surface-500 dark:text-surface-400">{{ role.desc }}</span>
          </div>
          <div class="flex gap-2 overflow-x-auto">
            <div
              v-for="shade in shades"
              :key="shade"
              class="flex h-16 w-24 shrink-0 items-end rounded-lg p-2"
              :style="{ background: `var(--color-${role.name}-${shade})` }"
            >
              <span
                class="text-xs font-medium"
                :class="shade <= 300 ? 'text-surface-900' : 'text-white'"
              >
                {{ shade }}
              </span>
            </div>
          </div>
        </div>

        <!-- Surface -->
        <div>
          <div class="mb-2 flex items-baseline gap-2">
            <h3 class="text-lg font-semibold">Surface</h3>
            <span class="text-sm text-surface-500 dark:text-surface-400">Neutral — backgrounds, borders, text</span>
          </div>
          <div class="flex gap-2 overflow-x-auto">
            <div
              v-for="shade in [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]"
              :key="shade"
              class="flex h-16 w-16 shrink-0 items-end rounded-lg border border-surface-200 p-1.5 dark:border-surface-700"
              :style="{ background: `var(--color-surface-${shade})` }"
            >
              <span
                class="text-xs font-medium"
                :class="shade <= 300 ? 'text-surface-900' : 'text-white'"
              >
                {{ shade }}
              </span>
            </div>
          </div>
        </div>
      </CuiStack>
    </div>

    <!-- Semantic Slots -->
    <div>
      <h2 class="mb-4 text-2xl font-semibold">Semantic Slots</h2>
      <p class="mb-4 text-surface-600 dark:text-surface-400">
        Each role provides 9 named tokens that map to the condensed scale.
        Use these in components instead of referencing shades directly.
      </p>

      <div class="overflow-x-auto">
        <table class="w-full border-collapse text-sm">
          <thead>
            <tr class="border-b border-surface-200 dark:border-surface-700">
              <th class="py-2 pr-4 text-left font-semibold">Slot</th>
              <th class="py-2 pr-4 text-left font-semibold">Token</th>
              <th class="py-2 text-left font-semibold">Purpose</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="slot in slots"
              :key="slot.name"
              class="border-b border-surface-100 dark:border-surface-800"
            >
              <td class="py-2 pr-4 font-medium">{{ slot.name }}</td>
              <td class="py-2 pr-4">
                <code class="cui-code">{{ slot.token }}</code>
              </td>
              <td class="py-2 text-surface-600 dark:text-surface-400">{{ slot.desc }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Semantic Slot Previews -->
    <div>
      <h2 class="mb-4 text-2xl font-semibold">Slot Previews</h2>
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div
          v-for="role in roles"
          :key="role.name"
          class="rounded-lg border p-4"
          :style="{
            background: `var(--cui-${role.name}-bg)`,
            borderColor: `var(--cui-${role.name}-border)`,
          }"
        >
          <div
            class="mb-3 text-sm font-semibold"
            :style="{ color: `var(--cui-${role.name})` }"
          >
            {{ role.label }}
          </div>
          <CuiFlex gap="2" class="flex-wrap">
            <CuiButton :color="(role.name as any)" variant="solid" size="sm">Solid</CuiButton>
            <CuiButton :color="(role.name as any)" variant="outline" size="sm">Outline</CuiButton>
            <CuiButton :color="(role.name as any)" variant="dash" size="sm">Dash</CuiButton>
            <CuiButton :color="(role.name as any)" variant="ghost" size="sm">Ghost</CuiButton>
          </CuiFlex>
        </div>
      </div>
    </div>

    <!-- Dark Mode -->
    <div>
      <h2 class="mb-4 text-2xl font-semibold">Dark Mode</h2>
      <CuiCard>
        <CuiCardBody>
          <p class="mb-3 text-surface-600 dark:text-surface-400">
            Dark mode keeps the same hue and saturation but adjusts lightness so
            colors pop against dark backgrounds. Toggle the Dark button in the
            header to preview. All semantic slots remap automatically — no
            additional code needed.
          </p>
          <pre class="cui-pre"><code>/* Automatic — just add the .dark class to an ancestor */
&lt;html class="dark"&gt;
  &lt;!-- All --cui-* tokens adapt automatically --&gt;
&lt;/html&gt;</code></pre>
        </CuiCardBody>
      </CuiCard>
    </div>

    <!-- Customization -->
    <div>
      <h2 class="mb-4 text-2xl font-semibold">Customization</h2>
      <CuiCard>
        <CuiCardBody>
          <p class="mb-3 text-surface-600 dark:text-surface-400">
            Override any token at any level. Swap the entire palette or just
            one semantic slot:
          </p>
          <pre class="cui-pre"><code>/* Override the entire primary scale */
:root {
  --color-primary-100: oklch(0.93 0.05 200);
  --color-primary-300: oklch(0.74 0.14 200);
  --color-primary-500: oklch(0.45 0.20 200);
  --color-primary-700: oklch(0.35 0.16 200);
  --color-primary-900: oklch(0.22 0.10 200);
}

/* Or just override a specific semantic slot */
:root {
  --cui-primary-hover: oklch(0.38 0.18 200);
}

/* Scope overrides to a container */
.my-section {
  --cui-primary: oklch(0.50 0.20 320);
}</code></pre>
        </CuiCardBody>
      </CuiCard>
    </div>

    <!-- WCAG AA -->
    <div>
      <h2 class="mb-4 text-2xl font-semibold">Accessibility</h2>
      <CuiCard>
        <CuiCardBody>
          <p class="text-surface-600 dark:text-surface-400">
            All color combinations are designed to meet
            <strong class="text-surface-900 dark:text-surface-100">WCAG 2.1 AA</strong>
            contrast requirements: <strong>4.5:1</strong> for normal text,
            <strong>3:1</strong> for large text and UI components. The
            <code class="cui-code">-text</code> slot for each role is pre-checked
            against the default (500) background. Warning uses dark text on its
            bright amber background to maintain contrast.
          </p>
        </CuiCardBody>
      </CuiCard>
    </div>
  </CuiStack>
</template>

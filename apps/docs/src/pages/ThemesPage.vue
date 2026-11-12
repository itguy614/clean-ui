<script setup lang="ts">
import {
  CuiAlert,
  CuiBadge,
  CuiButton,
  CuiCard,
  CuiCardBody,
  CuiCheckbox,
  CuiDropdown,
  CuiDropdownItem,
  CuiDropdownMenu,
  CuiDropdownTrigger,
  CuiFlex,
  CuiFormField,
  CuiGrid,
  CuiInput,
  CuiModal,
  CuiRadio,
  CuiRadioGroup,
  CuiSelect,
  CuiStack,
  CuiToggle,
  CuiTooltip,
  useTheme,
} from "@itguy614/clean-ui";
import PropTable from "../components/PropTable.vue";
import Example from "../components/Example.vue";
import { computed, ref } from "vue";

const { theme, presets, setTheme } = useTheme();
const themeImports = computed(() =>
  [
    "import '@itguy614/clean-ui/styles'            // Navy, the default: always",
    ...presets.filter((p) => p.id !== "default").map((p) => `import '@itguy614/clean-ui/themes/${p.id}.css'`),
  ].join("\n"),
);
const demoRadio = ref("option1");
const demoCheck = ref(true);
const demoToggle = ref(true);
const demoSelect = ref<string | null>(null);
const scopedThemes = ["forest", "ruby", "violet"] as const;
const scopedCode = `<div class="cui-theme-forest">
  <CuiButton variant="solid">Solid</CuiButton>
  <CuiBadge variant="subtle">Badge</CuiBadge>
</div>`;
const backToNavyCode = `<div class="cui-theme-forest">
  <CuiButton variant="solid">Forest</CuiButton>
  <div class="cui-theme-default">
    <CuiButton variant="solid">Navy again</CuiButton>
  </div>
</div>`;

// Panels in a scoped theme (#418): teleported, yet they keep the scope they open from.
const panelTheme = ref<(typeof scopedThemes)[number]>("ruby");
const panelDark = ref(false);
const panelModal = ref(false);
const panelSelect = ref<string | null>(null);
const panelScopeClass = computed(() => [`cui-theme-${panelTheme.value}`, { dark: panelDark.value }]);
const panelsCode = `<div class="cui-theme-ruby dark">
  <CuiButton @click="open = true">Modal</CuiButton>
  <CuiModal v-model:visible="open" title="Ruby, dark">…</CuiModal>
  <CuiDropdown>…</CuiDropdown>
  <CuiSelect :options="options" />
  <CuiTooltip text="Ruby too"><CuiButton>Tooltip</CuiButton></CuiTooltip>
</div>`;
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
setTheme('forest')
setTheme('default') // back to Navy, the default (no class on &lt;html&gt;)

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
      <h2 id="loading-theme-css" class="mb-4 text-2xl font-semibold">Loading a Theme's CSS</h2>
      <CuiCard>
        <CuiCardBody>
          <p class="mb-3 text-surface-600 dark:text-surface-400">
            <code class="cui-code">@itguy614/clean-ui/styles</code> holds the default Navy theme only. Every other
            theme is its own opt-in stylesheet of about 2 kB: import the ones your app uses, in any order, after
            <code class="cui-code">styles</code>. Each works on <code class="cui-code">&lt;html&gt;</code> and on a scoped
            subtree, in light and dark. This site imports all of them.
          </p>
          <pre class="cui-pre"><code class="cui-code">{{ themeImports }}</code></pre>
          <p class="mb-3 mt-4 text-surface-600 dark:text-surface-400">
            With no bundler (a plain <code class="cui-code">&lt;link&gt;</code>), or to offer every theme without listing
            them, load the all-in-one stylesheet <em>instead of</em> <code class="cui-code">styles</code>:
          </p>
          <pre class="cui-pre"><code class="cui-code">import '@itguy614/clean-ui/styles/all.css'</code></pre>
          <p class="mt-4 text-surface-600 dark:text-surface-400">
            A theme class whose file was not imported styles nothing, and the page stays Navy. In development,
            <code class="cui-code">setTheme()</code> warns once and names the file to import. Upgrading from 1.x, where
            <code class="cui-code">styles</code> held every theme: import each theme you use, or switch to
            <code class="cui-code">styles/all.css</code>.
          </p>
        </CuiCardBody>
      </CuiCard>
    </div>

    <div>
      <h2 id="theme-presets"class="mb-4 text-2xl font-semibold">THEME_PRESETS</h2>
      <CuiCard>
        <CuiCardBody>
          <p class="mb-3 text-surface-600 dark:text-surface-400">
            The table above is built from <code class="cui-code">THEME_PRESETS</code> — a
            <code class="cui-code">ThemePreset[]</code> of <code class="cui-code">{ id, label, description }</code>,
            the same array <code class="cui-code">useTheme()</code> returns as
            <code class="cui-code">presets</code>. Import it directly to build a theme picker outside
            a component, e.g. in a settings schema.
          </p>
          <pre class="cui-pre"><code class="cui-code">import { THEME_PRESETS, type ThemePreset } from "@itguy614/clean-ui";

// [{ id: "mono", label: "Mono", description: "Monochrome" },
//  { id: "default", label: "Navy", description: "Navy blue (base scale)" }, ...]
const options = THEME_PRESETS.map((p: ThemePreset) => ({ value: p.id, label: p.label }));</code></pre>
        </CuiCardBody>
      </CuiCard>
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
&lt;html class="cui-theme-forest"&gt;

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

    <!-- Scoped themes -->
    <div>
      <h2 class="mb-4 text-2xl font-semibold">Scoped Themes</h2>
      <Example title="A theme class on part of the page" :code="scopedCode">
        <CuiGrid :cols="{ sm: 1, md: 3 }" gap="4">
          <div v-for="t in scopedThemes" :key="t" :class="`cui-theme-${t}`">
            <CuiStack spacing="3">
              <CuiBadge variant="subtle">{{ t }}</CuiBadge>
              <CuiFlex gap="2" class="flex-wrap">
                <CuiButton variant="solid">Solid</CuiButton>
                <CuiButton variant="outline">Outline</CuiButton>
              </CuiFlex>
              <CuiToggle :model-value="true" label="Toggle" />
              <CuiAlert color="primary" title="Primary alert">Follows the scoped theme.</CuiAlert>
            </CuiStack>
          </div>
        </CuiGrid>
      </Example>
      <Example title="Back to Navy inside another theme" :code="backToNavyCode" class="mt-6">
        <CuiStack spacing="3">
          <p class="text-sm text-surface-500">
            Navy is the default, so it has no class on the page root. Inside another theme, a
            <code class="cui-code">cui-theme-default</code> (or
            <code class="cui-code">cui-theme-navy</code>) element switches its part of the page
            back.
          </p>
          <div class="cui-theme-forest">
            <CuiFlex gap="3" align="center">
              <CuiButton variant="solid">Forest</CuiButton>
              <div class="cui-theme-default">
                <CuiFlex gap="3" align="center">
                  <CuiButton variant="solid">Navy again</CuiButton>
                  <CuiBadge variant="subtle">default</CuiBadge>
                </CuiFlex>
              </div>
            </CuiFlex>
          </div>
        </CuiStack>
      </Example>
      <Example title="Panels opened from a scoped theme" :code="panelsCode" class="mt-6">
        <CuiStack spacing="4">
          <p class="text-sm text-surface-500">
            A modal, menu, select or tooltip renders at the end of
            <code class="cui-code">&lt;body&gt;</code>, outside the box it opens from, yet it
            keeps that box's theme and a scoped <code class="cui-code">dark</code> class. Change
            either while a panel is open and it follows.
          </p>
          <CuiFlex gap="4" align="center">
            <CuiRadioGroup v-model="panelTheme" variant="buttons" label="Box theme">
              <CuiRadio v-for="t in scopedThemes" :key="t" :value="t" :label="t" />
            </CuiRadioGroup>
            <CuiToggle v-model="panelDark" label="Dark inside the box" />
          </CuiFlex>
          <div :class="panelScopeClass">
            <CuiCard>
              <CuiCardBody>
                <CuiFlex gap="3" align="center">
                  <CuiButton variant="solid" @click="panelModal = true">Open modal</CuiButton>
                  <CuiDropdown>
                    <CuiDropdownTrigger>
                      <CuiButton>Dropdown</CuiButton>
                    </CuiDropdownTrigger>
                    <CuiDropdownMenu>
                      <CuiDropdownItem>Rename</CuiDropdownItem>
                      <CuiDropdownItem>Duplicate</CuiDropdownItem>
                      <CuiDropdownItem>Archive</CuiDropdownItem>
                    </CuiDropdownMenu>
                  </CuiDropdown>
                  <div class="w-48">
                    <CuiSelect
                      v-model="panelSelect"
                      :options="['Option A', 'Option B', 'Option C']"
                      placeholder="Select..."
                    />
                  </div>
                  <CuiTooltip :text="`The ${panelTheme} theme, here too`">
                    <CuiButton variant="ghost">Tooltip</CuiButton>
                  </CuiTooltip>
                </CuiFlex>
              </CuiCardBody>
            </CuiCard>
            <CuiModal v-model:visible="panelModal" :title="`Opened from the ${panelTheme} box`">
              <CuiStack spacing="4">
                <p>The modal and the select inside it both keep the box's scope.</p>
                <CuiSelect
                  v-model="panelSelect"
                  :options="['Option A', 'Option B', 'Option C']"
                  placeholder="Select..."
                />
                <CuiToggle v-model="panelDark" label="Dark inside the box" />
              </CuiStack>
            </CuiModal>
          </div>
          <CuiCard>
            <CuiCardBody>
              <p class="text-sm">
                <strong>Only the theme and <code class="cui-code">dark</code> classes
                carry.</strong> A teleported panel takes the nearest
                <code class="cui-code">cui-theme-*</code> class and a scoped
                <code class="cui-code">dark</code> class around the component that opened it. A
                token you override on a container
                (<code class="cui-code">.brand { --cui-primary: … }</code>) and a scoped density
                setting stay behind: the panel isn't inside that container. Set those on
                <code class="cui-code">:root</code>, or put the same class on the panel itself (a
                CuiModal or CuiSlideover forwards its <code class="cui-code">class</code> to its
                panel). An app mounted with <code class="cui-code">createApp()</code> gets the
                scope of the component that called
                <code class="cui-code">useCleanUIContext()</code>, once it calls
                <code class="cui-code">provideTo(app)</code>.
              </p>
            </CuiCardBody>
          </CuiCard>
        </CuiStack>
      </Example>
    </div>

    <!-- Custom Themes -->
    <div>
      <h2 class="mb-4 text-2xl font-semibold">Custom Themes</h2>
      <CuiCard>
        <CuiCardBody>
          <p class="mb-3 text-surface-600 dark:text-surface-400">
            Create your own theme by defining a CSS class that overrides the color variables.
            Name it <code>cui-theme-*</code>: the library recognises a theme scope by that
            prefix, and re-resolves its semantic colours there, so a theme class on part of a
            page re-themes that part.
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

    <!-- SSR -->
    <div>
      <h2 id="ssr-theme-init" class="mb-4 text-2xl font-semibold">Server-rendered pages</h2>
      <CuiCard>
        <CuiCardBody>
          <p class="mb-3 text-surface-600 dark:text-surface-400">
            <code class="cui-code">useTheme()</code> persists the choice to localStorage, which the
            server can't read — so a server-rendered page first paints in the default theme and
            switches once the app hydrates. <code class="cui-code">ssrThemeInitScript</code> is a
            small inline script string that reads the stored theme and adds its
            <code class="cui-code">cui-theme-*</code> class to <code class="cui-code">&lt;html&gt;</code>
            before the first paint. Put it in the <code class="cui-code">&lt;head&gt;</code>, before
            any stylesheets. It only covers the theme preset. Density has a matching
            <code class="cui-code">ssrDensityInitScript</code> and dark mode
            <code class="cui-code">ssrColorModeInitScript</code>; use all three, and give each inline
            script your own nonce or hash under a strict CSP:
          </p>
          <pre class="cui-pre"><code class="cui-code">// nuxt.config.ts
import { ssrThemeInitScript, ssrDensityInitScript, ssrColorModeInitScript } from "@itguy614/clean-ui";

export default defineNuxtConfig({
  app: {
    head: {
      script: [
        { children: ssrThemeInitScript, type: "text/javascript" },
        { children: ssrDensityInitScript, type: "text/javascript" },
        { children: ssrColorModeInitScript, type: "text/javascript" },
      ],
    },
  },
});</code></pre>
          <p class="mt-3 mb-3 text-surface-600 dark:text-surface-400">
            <strong>The stored theme is restored on first use, not at import.</strong> Importing the
            library reads and writes no <code class="cui-code">cui-theme</code> setting and leaves the
            classes on <code class="cui-code">&lt;html&gt;</code> alone. The first
            <code class="cui-code">useTheme()</code> call restores it. An app that doesn't call
            <code class="cui-code">useTheme()</code> before first paint and doesn't use the init script
            should call <code class="cui-code">restoreTheme()</code> at startup. It is safe to call more
            than once.
          </p>
          <pre class="cui-pre"><code class="cui-code">import { restoreTheme } from "@itguy614/clean-ui";
restoreTheme(); // before app.mount()</code></pre>
        </CuiCardBody>
      </CuiCard>
    </div>
  </CuiStack>
</template>

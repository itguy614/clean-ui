<script setup lang="ts">
import { ref, computed } from "vue";
import {
  CuiStack,
  CuiCard,
  CuiCardHeader,
  CuiCardBody,
  CuiRadioGroup,
  CuiRadio,
  CuiButton,
  CuiInput,
  CuiSelect,
  CuiBadge,
  type DensityId,
} from "@itguy614/clean-ui";
import PropTable from "../components/PropTable.vue";
import Example from "../components/Example.vue";

// Scoped demo: density applied as a class on a wrapper, independent of the
// global header switcher — proving density is overridable at any ancestor.
const demoDensity = ref<DensityId>("default");
const demoClass = computed(() => `cui-density-${demoDensity.value}`);

const selectValue = ref<string | number | null>("a");
const selectOptions = [
  { value: "a", label: "Option A" },
  { value: "b", label: "Option B" },
];
</script>

<template>
  <CuiStack spacing="8" class="cui-typography">
    <div>
      <h1>Density</h1>
      <p class="cui-lead">
        A global comfort setting — <code class="cui-code">compact</code> /
        <code class="cui-code">default</code> / <code class="cui-code">comfortable</code> — that
        scales spacing across the UI. Applied as a class on any ancestor, just like a theme.
      </p>
    </div>

    <CuiCard variant="outline">
      <CuiCardHeader title="How it works" />
      <CuiCardBody>
        <p class="text-sm" style="color: var(--cui-text-secondary);">
          Density is two CSS custom properties — <code class="cui-code">--cui-density-scale</code>
          (control padding &amp; heights) and <code class="cui-code">--cui-density-gap-scale</code>
          (layout gaps) — that components multiply their spatial values by via
          <code class="cui-code">calc()</code>. Set them by applying a class:
        </p>
        <pre class="cui-pre" style="margin-top: 0.75rem;"><code class="cui-code">&lt;!-- whole app --&gt;
&lt;body class="cui-density-compact"&gt; … &lt;/body&gt;

&lt;!-- or just a subtree --&gt;
&lt;div class="cui-density-comfortable"&gt; … &lt;/div&gt;</code></pre>
        <p class="text-sm" style="color: var(--cui-text-secondary); margin-top: 0.75rem;">
          Or drive it reactively (persists to <code class="cui-code">localStorage</code>, mirrors
          <code class="cui-code">useTheme</code>):
        </p>
        <pre class="cui-pre" style="margin-top: 0.5rem;"><code class="cui-code">import { useDensity } from "@itguy614/clean-ui";
const { density, setDensity, presets } = useDensity();
setDensity("compact");</code></pre>
        <p class="text-sm" style="margin-top: 0.75rem;">
          <strong>Density moves whitespace, not type.</strong> Padding, gaps, and control heights
          scale; <strong>font sizes never do</strong> (text stays equally readable). Interactive
          control heights clamp to a 24px minimum (WCAG 2.5.8 target size), so
          <code class="cui-code">compact</code> never makes anything untappable. It's orthogonal to
          each component's <code class="cui-code">size</code> prop — they multiply.
        </p>
        <p class="text-sm" style="color: var(--cui-text-secondary); margin-top: 0.75rem;">
          The <code class="cui-code">.cui-typography</code> prose layer participates too: heading,
          paragraph, list, and blockquote spacing, code/pre padding, and native
          <code class="cui-code">&lt;table&gt;</code> cell padding all respond to density — while
          font sizes stay put.
        </p>
      </CuiCardBody>
    </CuiCard>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">Try it (scoped)</h2>
      <Example title="Density applied to a single subtree" :code="`<div :class=&quot;'cui-density-' + density&quot;>
  <!-- everything inside inherits this density -->
  <CuiButton>Save</CuiButton>
  <CuiInput placeholder=&quot;Search…&quot; />
</div>`">
        <CuiStack spacing="4">
          <CuiRadioGroup v-model="demoDensity" variant="buttons" label="Demo density">
            <CuiRadio value="compact" label="Compact" />
            <CuiRadio value="default" label="Default" />
            <CuiRadio value="comfortable" label="Comfortable" />
          </CuiRadioGroup>

          <div :class="demoClass" style="border: 1px solid var(--cui-border); border-radius: var(--cui-button-radius); padding: 1rem;">
            <CuiStack spacing="4">
              <div style="display: flex; gap: 0.5rem; align-items: center;">
                <CuiButton variant="solid" color="primary">Save</CuiButton>
                <CuiButton variant="outline">Cancel</CuiButton>
                <CuiBadge color="success">Active</CuiBadge>
              </div>
              <CuiInput placeholder="Search…" clearable />
              <CuiSelect v-model="selectValue" :options="selectOptions" />
            </CuiStack>
          </div>
          <p class="text-xs" style="color: var(--cui-text-secondary);">
            Note the padding/height/gap tighten or loosen — but the text size never changes. (The
            header switcher does the same thing globally on <code class="cui-code">&lt;html&gt;</code>.)
          </p>
        </CuiStack>
      </Example>
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">useDensity()</h2>
      <PropTable
        :props="[
          { name: 'density', type: 'Ref<DensityId>', default: '\'default\'', description: 'Current density (reactive). DensityId = compact | default | comfortable.' },
          { name: 'setDensity', type: '(id: DensityId) => void', default: '—', description: 'Set the active density; applies the class to <html> and persists to localStorage.' },
          { name: 'getDensity', type: '() => DensityId', default: '—', description: 'Read the current density.' },
          { name: 'presets', type: 'DensityPreset[]', default: '—', description: 'The three presets (id, label, description) for building a switcher.' },
        ]"
      />
      <p class="mt-3 text-sm" style="color: var(--cui-text-secondary);">
        Tokens: <code class="cui-code">--cui-density-scale</code> (0.8 / 1 / 1.2) and
        <code class="cui-code">--cui-density-gap-scale</code> (0.88 / 1 / 1.12). Override them
        yourself on any element for a custom density.
      </p>
    </div>
  </CuiStack>
</template>

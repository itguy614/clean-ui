<script setup lang="ts">
import { CuiAlert, CuiCard, CuiCardBody, CuiGrid, CuiPanel, CuiStack } from "@itguy614/clean-ui";
import DocPage from "../components/DocPage.vue";
import Example from "../components/Example.vue";
import meta from "../meta/panel";

// A small inline SVG stands in for a photo, so the page needs no asset.
const image =
  "data:image/svg+xml," +
  encodeURIComponent(
    "<svg xmlns='http://www.w3.org/2000/svg' width='80' height='80'><circle cx='40' cy='40' r='28' fill='none' stroke='#888' stroke-opacity='.35' stroke-width='6'/></svg>",
  );

const pad = { padding: "2rem", minHeight: "8rem", color: "white" };
</script>

<template>
  <DocPage :meta="meta">
    <template #intro>
      <CuiAlert color="info" title="Text over a gradient is outside the contrast audit">
        <code>pnpm check:contrast</code> checks the library's own foreground and background token pairs.
        A gradient changes the color behind your text from one point to the next, so choose stops that
        keep your text at WCAG AA contrast across the whole fill, and check the dark theme as well.
      </CuiAlert>
    </template>

    <template #usage>
      <Example
        code-open
        :code="`<CuiPanel from=&quot;primary&quot; to=&quot;info&quot; rounded=&quot;lg&quot;>
  Two stops, interpolated in oklch
</CuiPanel>`"
      >
        <CuiPanel from="primary" to="info" rounded="lg" :style="pad">Two stops, interpolated in oklch</CuiPanel>
      </Example>
    </template>

    <template #customization>
      <CuiCard variant="outline" class="mt-4">
        <CuiCardBody>
          <pre class="cui-pre"><code>/* replace the whole background for one region */
.hero { --cui-panel-bg: linear-gradient(135deg, tomato, gold); }

/* a hue pairing that misbehaves under oklch: interpolate in oklab instead */
.hero { --cui-panel-bg: linear-gradient(in oklab 90deg, var(--cui-primary), var(--cui-success)); }</code></pre>
          <p class="mt-4 text-sm text-surface-600 dark:text-surface-400">
            <strong>How it works:</strong> the panel emits a plain sRGB gradient first and the
            <code>in oklch shorter hue</code> form after it, behind an <code>@supports</code> check, so
            an older browser still paints a gradient. Roles resolve to <code>var(--cui-{role})</code>,
            so a theme or dark mode changes the stops with no extra work. <code>CuiBackdrop</code>
            takes the same <code>from</code> / <code>via</code> / <code>to</code> / <code>angle</code> /
            <code>smooth</code> props, and its raw <code>gradient</code> string still works.
          </p>
        </CuiCardBody>
      </CuiCard>
    </template>

    <template #examples>
      <Example
        title="Three stops, with roles"
        :code="`<CuiPanel from=&quot;primary&quot; via=&quot;success&quot; to=&quot;warning&quot; :angle=&quot;90&quot; rounded=&quot;lg&quot;>…</CuiPanel>`"
      >
        <CuiPanel from="primary" via="success" to="warning" :angle="90" rounded="lg" :style="pad">
          Primary, success, warning
        </CuiPanel>
      </Example>

      <Example
        title="Smooth: grain off and on"
        :code="`<CuiPanel from=&quot;surface-light&quot; to=&quot;surface-dark&quot; />
<CuiPanel from=&quot;surface-light&quot; to=&quot;surface-dark&quot; smooth />`"
      >
        <CuiGrid :columns="2" gap="4">
          <CuiPanel from="surface-light" to="surface-dark" rounded="lg" :style="{ ...pad, color: 'inherit' }">Banding visible</CuiPanel>
          <CuiPanel from="surface-light" to="surface-dark" smooth rounded="lg" :style="{ ...pad, color: 'inherit' }">smooth</CuiPanel>
        </CuiGrid>
      </Example>

      <Example
        title="Raw CSS stops and a raw gradient"
        :code="`<CuiPanel from=&quot;#ff0066&quot; to=&quot;#00c2ff&quot; :angle=&quot;45&quot; />
<CuiPanel gradient=&quot;radial-gradient(circle at top left, red, blue)&quot; smooth />`"
      >
        <CuiGrid :columns="2" gap="4">
          <CuiPanel from="#ff0066" to="#00c2ff" :angle="45" rounded="lg" :style="pad">Hex stops</CuiPanel>
          <CuiPanel gradient="radial-gradient(circle at top left, #ff0066, #1d4ed8)" smooth rounded="lg" :style="pad">
            Radial, with grain
          </CuiPanel>
        </CuiGrid>
      </Example>

      <Example
        title="Image and color layers"
        :code="`<CuiPanel color=&quot;primary&quot; :image=&quot;url&quot; />
<CuiPanel color=&quot;surface-light&quot; :image=&quot;url&quot; from=&quot;primary&quot; to=&quot;info&quot; />`"
      >
        <CuiGrid :columns="2" gap="4">
          <CuiPanel color="primary" :image="image" rounded="lg" :style="pad">Image over a color</CuiPanel>
          <CuiPanel from="transparent" to="info" :image="image" color="surface-light" rounded="lg" :style="{ ...pad, color: 'inherit' }">
            Gradient over an image
          </CuiPanel>
        </CuiGrid>
      </Example>

      <Example title="As another element" :code="`<CuiPanel as=&quot;section&quot; color=&quot;surface-light&quot; />`">
        <CuiStack spacing="2">
          <CuiPanel as="section" color="surface-light" rounded="md" :style="{ padding: '1rem' }">A section element</CuiPanel>
        </CuiStack>
      </Example>
    </template>
  </DocPage>
</template>

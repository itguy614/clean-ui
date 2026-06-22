<script setup lang="ts">
import { CuiStack, CuiCard, CuiCardBody, CuiCardHeader } from "@itguy614/clean-ui";
import PropTable from "../components/PropTable.vue";
import Example from "../components/Example.vue";
</script>

<template>
  <CuiStack spacing="8" class="cui-typography">
    <div>
      <h1>Utilities</h1>
      <p class="cui-lead">
        Opt-in CSS utility classes that aren't components — add them to any element.
        They're token-driven, so they follow the active theme and density.
      </p>
    </div>

    <!-- Scrollbar -->
    <div>
      <h2 class="mb-4 text-2xl font-semibold">Scrollbar</h2>
      <p class="mb-4" style="color: var(--cui-text-secondary);">
        Add <code class="cui-code">cui-scrollbar</code> to any scroll container to render a
        persistent, themed scrollbar instead of the operating system's overlay scrollbar (which on
        macOS hides until you scroll). Add <code class="cui-code">cui-scrollbar-thin</code> for a
        slimmer bar. It's <strong>not applied by default</strong> — add it where you want it.
      </p>

      <PropTable
        :props="[
          { name: 'cui-scrollbar', type: 'class', default: '—', description: 'Persistent, themed scrollbar on a scroll container (overflow: auto/scroll).' },
          { name: 'cui-scrollbar-thin', type: 'class', default: '—', description: 'Modifier for a slimmer bar (combine with cui-scrollbar).' },
        ]"
      />

      <CuiStack spacing="6" class="mt-6">
        <Example title="Default" :code="`<div class=&quot;cui-scrollbar&quot; style=&quot;max-height: 8rem; overflow-y: auto&quot;>
  …content…
</div>`">
          <div
            class="cui-scrollbar"
            style="max-height: 8rem; overflow-y: auto; border: 1px solid var(--cui-border); border-radius: var(--cui-button-radius); padding: 0.75rem;"
          >
            <p v-for="n in 14" :key="n" style="font-size: 0.875rem; margin: 0 0 0.5rem;">
              Scrollable row {{ n }} — the scrollbar stays visible while this box overflows.
            </p>
          </div>
        </Example>

        <Example title="Thin" :code="`<div class=&quot;cui-scrollbar cui-scrollbar-thin&quot; style=&quot;max-height: 8rem; overflow-y: auto&quot;>
  …content…
</div>`">
          <div
            class="cui-scrollbar cui-scrollbar-thin"
            style="max-height: 8rem; overflow-y: auto; border: 1px solid var(--cui-border); border-radius: var(--cui-button-radius); padding: 0.75rem;"
          >
            <p v-for="n in 14" :key="n" style="font-size: 0.875rem; margin: 0 0 0.5rem;">
              Scrollable row {{ n }} — slimmer bar.
            </p>
          </div>
        </Example>
      </CuiStack>

      <CuiCard variant="outline" class="mt-6">
        <CuiCardHeader title="Customizing" />
        <CuiCardBody>
          <p class="text-sm" style="color: var(--cui-text-secondary);">
            Override the private custom properties on the element (or a scope) to retheme it:
          </p>
          <pre class="cui-pre" style="margin-top: 0.75rem;"><code class="cui-code">.my-panel {
  --_cui-scrollbar-size: 14px;
  --_cui-scrollbar-thumb: var(--cui-primary);
  --_cui-scrollbar-thumb-hover: var(--cui-primary-hover);
  --_cui-scrollbar-track: var(--cui-surface-bg);
}</code></pre>
          <p class="text-sm" style="color: var(--cui-text-secondary); margin-top: 0.75rem;">
            <strong>How it works:</strong> WebKit/Chromium engines (Chrome, Safari, Edge) get a
            styled <code class="cui-code">::-webkit-scrollbar</code> — which forces a persistent,
            non-overlay bar even on macOS. Firefox uses the standard
            <code class="cui-code">scrollbar-width</code> / <code class="cui-code">scrollbar-color</code>
            properties. (The two are scoped apart on purpose: setting
            <code class="cui-code">scrollbar-width</code> makes recent Chromium ignore the
            <code class="cui-code">::-webkit-scrollbar</code> rules.)
          </p>
        </CuiCardBody>
      </CuiCard>
    </div>

    <!-- Related -->
    <CuiCard variant="ghost">
      <CuiCardBody>
        <p class="text-sm" style="color: var(--cui-text-secondary);">
          Looking for text and list helpers (<code class="cui-code">cui-display-1</code>,
          <code class="cui-code">cui-lead</code>, <code class="cui-code">cui-list-unstyled</code>,
          <code class="cui-code">cui-list-inline</code>)? Those live on the
          <RouterLink to="/foundations/typography" style="color: var(--cui-primary); font-weight: 500;">Typography</RouterLink>
          page.
        </p>
      </CuiCardBody>
    </CuiCard>
  </CuiStack>
</template>

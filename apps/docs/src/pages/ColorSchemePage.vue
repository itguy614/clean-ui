<script setup lang="ts">
import { ref, useTemplateRef } from "vue";
import { CuiStack, CuiCard, CuiCardBody, CuiBadge, CuiToggle, useColorScheme } from "@itguy614/clean-ui";
import Example from "../components/Example.vue";
import PropTable, { type PropRow } from "../components/PropTable.vue";

// Two call sites in one component: one outside the scoped panel, one inside it.
const { isDark: pageIsDark } = useColorScheme(useTemplateRef<HTMLElement>("pageProbe"));
const { isDark: panelIsDark } = useColorScheme(useTemplateRef<HTMLElement>("panelProbe"));

const scopedDark = ref(false);

const code = `<script setup>
import { useTemplateRef } from "vue";
import { useColorScheme } from "@itguy614/clean-ui";

const { isDark } = useColorScheme(useTemplateRef("root"));
<\/script>

<template>
  <div ref="root">
    <p>This element is {{ isDark ? "dark" : "light" }}.</p>
  </div>
</template>

<!-- usage: a scoped dark subtree -->
<MyComponent />                 <!-- follows the page -->
<div :class="{ dark: scopedDark }">
  <MyComponent />               <!-- dark whenever scopedDark is on -->
</div>`;

const highlighterCode = `<script setup>
import { computed, useTemplateRef } from "vue";
import { useColorScheme } from "@itguy614/clean-ui";

const { isDark } = useColorScheme(useTemplateRef("root"));
// A highlighter themed in JS, not CSS, needs the scheme as a value.
const highlighterTheme = computed(() => (isDark.value ? "github-dark" : "github-light"));
<\/script>`;

const params: PropRow[] = [
  {
    name: "target",
    type: "Ref<HTMLElement | null | undefined>",
    description:
      "The element to resolve from — normally the calling component's root template ref. Its ancestors are walked for a dark class.",
  },
];

const returns: PropRow[] = [
  {
    name: "isDark",
    type: "Ref<boolean>",
    default: "false",
    description:
      "True when the target or any ancestor carries the dark class. Set on mount and updated whenever any class attribute in the document changes; false before mount and during server rendering.",
  },
];
</script>

<template>
  <CuiStack spacing="8" class="cui-typography">
    <div>
      <h1>Color Scheme</h1>
      <p class="cui-lead">
        <code class="cui-code">useColorScheme()</code> turns clean-ui's dark mode into a reactive
        boolean, resolved for one element and its ancestors.
      </p>
      <p>
        Dark mode in clean-ui is a CSS class: <code class="cui-code">dark</code> on
        <code class="cui-code">&lt;html&gt;</code> darkens the whole page, and
        <code class="cui-code">dark</code> on any other element darkens just that subtree. Components
        style themselves from the cascade and never need to know. This composable is for the rare code
        that needs the answer as a JavaScript value — a syntax highlighter or chart library whose theme is
        fixed when it is configured, not read from CSS.
      </p>
    </div>

    <Example title="Page and scoped dark mode" :code="code">
      <CuiStack spacing="4">
        <CuiToggle v-model="scopedDark" label="Dark class on the panel below" />

        <div ref="pageProbe">
          <p style="margin: 0">
            Outside the panel: <CuiBadge :color="pageIsDark ? 'primary' : 'surface'">{{ pageIsDark ? "dark" : "light" }}</CuiBadge>
          </p>
        </div>

        <div
          :class="{ dark: scopedDark }"
          style="padding: 1rem; border: 1px solid var(--cui-border); border-radius: var(--cui-radius-lg, 0.5rem); background: var(--cui-surface-base); color: var(--cui-text-body)"
        >
          <div ref="panelProbe">
            <p style="margin: 0">
              Inside the panel: <CuiBadge :color="panelIsDark ? 'primary' : 'surface'">{{ panelIsDark ? "dark" : "light" }}</CuiBadge>
            </p>
          </div>
        </div>
      </CuiStack>
    </Example>

    <CuiCard variant="outline">
      <CuiCardBody>
        <p><strong>Try:</strong></p>
        <ul>
          <li>Turn on <em>Dark class on the panel</em>: the panel and the reading inside it go dark; the reading outside stays light.</li>
          <li>Switch the whole site to dark with the dark-mode button in the header, which toggles <code class="cui-code">dark</code> on <code class="cui-code">&lt;html&gt;</code>: both readings go dark, because every element is now beneath a <code class="cui-code">dark</code> ancestor.</li>
          <li>With the page dark, the panel switch does nothing visible — a <code class="cui-code">dark</code> class can only darken a subtree, never lighten one.</li>
        </ul>
      </CuiCardBody>
    </CuiCard>

    <Example title="Feeding a JavaScript theme" :code="highlighterCode">
      <p style="margin: 0">
        The typical use: pick a theme for a library configured in JavaScript. clean-ui's own markdown
        editor does exactly this for its CodeMirror theme.
      </p>
    </Example>

    <div>
      <h2>API</h2>
      <p><code class="cui-code">useColorScheme(target)</code></p>
      <PropTable :props="params" />
      <h3>Returns</h3>
      <PropTable :props="returns" />
      <p>
        The answer is per call site, not global: two components in differently themed subtrees can
        disagree, and both are right. All call sites share one <code class="cui-code">MutationObserver</code>
        on the document, added with the first mounted caller and disconnected when the last one unmounts.
        It reacts to class changes — not to the target ref pointing at a different element, and not to the
        operating system's <code class="cui-code">prefers-color-scheme</code>, which clean-ui does not read
        by itself.
      </p>
    </div>

    <div>
      <h2>How it relates to useTheme</h2>
      <p>
        They are independent. <code class="cui-code">useTheme()</code> chooses the <em>palette</em> — it
        writes a <code class="cui-code">cui-theme-*</code> class to <code class="cui-code">&lt;html&gt;</code>
        and remembers the choice — and has nothing to do with light or dark. Every theme has a light and a
        dark form, selected by the <code class="cui-code">dark</code> class.
      </p>
      <p>
        clean-ui does not add or remove <code class="cui-code">dark</code> itself; your app does, from a
        toggle, a stored preference or a <code class="cui-code">prefers-color-scheme</code> media query (this
        site's header toggles it on <code class="cui-code">&lt;html&gt;</code>).
        <code class="cui-code">useColorScheme()</code> only reads it.
      </p>
    </div>

    <div>
      <h2>When to use it</h2>
      <ul>
        <li>A third-party library themed in JavaScript: syntax highlighters, charts, maps, canvas drawing.</li>
        <li>Choosing between two assets — a light and a dark logo or illustration — when a CSS rule can't do it.</li>
        <li>
          Not for styling. If CSS can express it, use the <code class="cui-code">--cui-*</code> tokens (which
          already swap in dark mode) or a <code class="cui-code">.dark</code> selector; that works before
          hydration and in subtrees without any JavaScript.
        </li>
      </ul>
    </div>
  </CuiStack>
</template>

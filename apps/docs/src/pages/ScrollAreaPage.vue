<script setup lang="ts">
import { CuiButton, CuiCard, CuiCardBody, CuiScrollArea, CuiStack } from "@itguy614/clean-ui";
import DocPage from "../components/DocPage.vue";
import Example from "../components/Example.vue";
import meta from "../meta/scroll-area";

const MENU = ["File", "Edit", "View", "Insert", "Format", "Tools", "Table", "Window", "Help", "Extensions", "Account", "Settings"];
const ITEMS = Array.from({ length: 24 }, (_, i) => `Notification ${i + 1}`);

const frame =
  "border: 1px solid var(--cui-border); border-radius: var(--cui-button-radius, 0.375rem); background: var(--cui-surface-base);";
</script>

<template>
  <DocPage :meta="meta">
    <template #usage>
      <Example
        code-open
        :code="`<CuiScrollArea style=&quot;height: 200px&quot;>
  <p v-for=&quot;item in items&quot; :key=&quot;item&quot;>{{ item }}</p>
</CuiScrollArea>`"
      >
        <div :style="frame">
          <CuiScrollArea style="height: 200px" aria-label="Notifications">
            <div style="padding: 0.5rem 1rem">
              <p v-for="item in ITEMS" :key="item" class="text-sm" style="padding: 0.25rem 0">{{ item }}</p>
            </div>
          </CuiScrollArea>
        </div>
      </Example>
    </template>

    <template #accessibility>
      <p class="text-sm text-surface-700 dark:text-surface-300">
        While its content overflows, the scroller is <code>role="region"</code> with
        <code>tabindex="0"</code> and a name (<code>ariaLabel</code>,
        <code>ariaLabelledby</code>, or the <code>scrollArea.region</code> message), so a
        keyboard user can Tab to it and scroll with the arrow keys, Page Up/Down, Home and End —
        even when nothing inside it is focusable (WCAG 2.1.1). When the content fits it is none
        of those, and adds no tab stop.
      </p>
      <p class="text-sm text-surface-700 dark:text-surface-300">
        Set <code>:region="false"</code> when the content is itself keyboard-navigable — a
        toolbar's buttons, a list of links — or the scroller becomes a second, redundant tab
        stop. Focusing an item scrolls it into view clear of the fade and the indicator.
      </p>
      <p class="text-sm text-surface-700 dark:text-surface-300">
        The indicators are pointer affordances: they sit beside the scroller (never inside, so
        they neither scroll away nor break a parent's <code>role</code> rules), are
        <code>aria-hidden</code> and not focusable. Button scrolling is smooth unless the user
        asks for reduced motion. Edges are logical: in a right-to-left page the start of a
        horizontal scroll area is on the right, and the default carets point that way.
      </p>
    </template>

    <template #extra>
      <div>
        <h2 id="use-scroll-area" class="mb-4 text-2xl font-semibold">useScrollArea</h2>
        <CuiCard variant="outline">
          <CuiCardBody>
            <p class="mb-3 text-surface-600 dark:text-surface-400">
              The arrangement behind <code>CuiScrollArea</code>, for a scroller you render
              yourself — <code>CuiTable</code> uses it on its own wrapper. It measures the
              edges, follows the content as it changes, builds the fade, and supplies the
              region attributes.
            </p>
            <pre class="cui-pre"><code>import { useScrollArea } from "@itguy614/clean-ui";

const area = useScrollArea({
  orientation: "both",      // "vertical" (default) | "horizontal" | "both"
  fade: "overlay",          // "mask" (default) | "overlay" | "none"
  fadeEdges: ["inline-end", "bottom"], // not the top: a sticky header covers it
  ariaLabel: "Order lines",
});

&lt;div :style="area.wrapperStyle"&gt;
  &lt;div :ref="area.setScroller" v-bind="area.scrollerAttrs.value" style="overflow: auto"&gt;
    &lt;slot /&gt;
  &lt;/div&gt;
  &lt;div v-for="f in area.overlayFades.value" :key="f.edge" :style="f.style" /&gt;
&lt;/div&gt;</code></pre>
            <p class="mt-3 text-surface-600 dark:text-surface-400">
              A <code>mask</code> fade works on any background but creates a stacking context,
              which breaks a <code>position: sticky</code> header inside the scroller. Use
              <code>overlay</code> there: it returns one gradient per edge to render as a
              sibling, painted in <code>--cui-scroll-area-fade-color</code>. It also returns
              <code>edges</code>, <code>canScrollStart</code> / <code>canScrollEnd</code>,
              <code>overflowing</code>, <code>rtl</code>, <code>update()</code> and
              <code>scrollByPage(edge)</code>; <code>fadeEdges</code> limits the fades and
              their scroll padding to the edges named (<code>top</code>, <code>left</code>, …,
              or <code>inline-start</code> / <code>inline-end</code>, which follow the page's
              direction), and <code>onUpdate</code> runs after
              each measurement.
            </p>
          </CuiCardBody>
        </CuiCard>
      </div>
    </template>

    <template #examples>
      <Example
        title="Horizontal Bar with Buttons"
        :code="`<CuiScrollArea orientation=&quot;horizontal&quot; indicator=&quot;button&quot; :region=&quot;false&quot;>
  <CuiButton v-for=&quot;item in menu&quot; :key=&quot;item&quot; variant=&quot;ghost&quot; size=&quot;sm&quot;>{{ item }}</CuiButton>
</CuiScrollArea>`"
      >
        <div :style="frame + 'max-width: 420px;'">
          <CuiScrollArea orientation="horizontal" indicator="button" :region="false">
            <div style="display: flex; gap: 0.25rem; padding: 0.375rem; width: max-content">
              <CuiButton v-for="item in MENU" :key="item" variant="ghost" size="sm">{{ item }}</CuiButton>
            </div>
          </CuiScrollArea>
        </div>
      </Example>

      <Example
        title="Decorative Arrows, Always Shown"
        :code="`<CuiScrollArea orientation=&quot;horizontal&quot; indicator=&quot;arrow&quot; indicator-visibility=&quot;always&quot; :fade=&quot;false&quot;>
  …
</CuiScrollArea>`"
      >
        <div :style="frame + 'max-width: 420px;'">
          <CuiScrollArea orientation="horizontal" indicator="arrow" indicator-visibility="always" :fade="false" aria-label="Menu">
            <div style="display: flex; gap: 1.5rem; padding: 0.625rem 0.5rem; width: max-content" class="text-sm">
              <span v-for="item in MENU" :key="item">{{ item }}</span>
            </div>
          </CuiScrollArea>
        </div>
      </Example>

      <Example
        title="Vertical List with Scroll Buttons"
        :code="`<CuiScrollArea indicator=&quot;button&quot; style=&quot;height: 220px&quot; aria-label=&quot;Notifications&quot;>
  …
</CuiScrollArea>`"
      >
        <div :style="frame + 'max-width: 320px;'">
          <CuiScrollArea indicator="button" style="height: 220px" aria-label="Notifications">
            <CuiStack spacing="1" style="padding: 0.5rem 1rem">
              <p v-for="item in ITEMS" :key="item" class="text-sm">{{ item }}</p>
            </CuiStack>
          </CuiScrollArea>
        </div>
      </Example>

      <Example
        title="Custom Indicator"
        :code="`<CuiScrollArea orientation=&quot;horizontal&quot; indicator=&quot;button&quot;>
  <template #indicator-end=&quot;{ hasMore, scroll }&quot;>
    <CuiButton size=&quot;xs&quot; tabindex=&quot;-1&quot; :disabled=&quot;!hasMore&quot; @click=&quot;scroll&quot;>More</CuiButton>
  </template>
  …
</CuiScrollArea>`"
      >
        <div :style="frame + 'max-width: 420px;'">
          <CuiScrollArea orientation="horizontal" indicator="button" :region="false">
            <div style="display: flex; gap: 0.25rem; padding: 0.375rem; width: max-content">
              <CuiButton v-for="item in MENU" :key="item" variant="ghost" size="sm">{{ item }}</CuiButton>
            </div>
            <template #indicator-end="{ hasMore, scroll }">
              <CuiButton size="xs" tabindex="-1" :disabled="!hasMore" @click="scroll">More</CuiButton>
            </template>
          </CuiScrollArea>
        </div>
      </Example>
    </template>
  </DocPage>
</template>

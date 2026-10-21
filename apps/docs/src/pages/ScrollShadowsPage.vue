<script setup lang="ts">
import { nextTick, onMounted, ref, useTemplateRef } from "vue";
import {
  CuiStack,
  CuiCard,
  CuiCardBody,
  CuiButton,
  CuiBadge,
  CuiFlex,
  useScrollShadows,
  scrollShadowTopStyle,
  scrollShadowBottomStyle,
  scrollShadowRightStyle,
} from "@itguy614/clean-ui";
import Example from "../components/Example.vue";
import PropTable from "../components/PropTable.vue";

// --- Vertical: top and bottom fades ---
const allItems = Array.from({ length: 24 }, (_, i) => `Notification ${i + 1}`);
const itemCount = ref(24);
const vertical = useScrollShadows();
const verticalEl = useTemplateRef<HTMLElement>("verticalEl");
onMounted(() => vertical.onMount(verticalEl.value));

// Only scrolling or onMount re-measures. Content that changes size needs an explicit update().
async function setCount(n: number) {
  itemCount.value = n;
  await nextTick();
  if (verticalEl.value) vertical.update(verticalEl.value);
}

// --- Horizontal: the right fade, plus a left one derived from it ---
const chips = ["Design", "Engineering", "Marketing", "Sales", "Support", "Finance", "Legal", "Operations", "Research", "People"];
const horizontal = useScrollShadows();
const horizontalEl = useTemplateRef<HTMLElement>("horizontalEl");
onMounted(() => horizontal.onMount(horizontalEl.value));
const scrollShadowLeftStyle = {
  ...scrollShadowRightStyle,
  right: undefined,
  left: "0",
  background: "linear-gradient(to right, var(--cui-surface-base, white), transparent)",
};

const verticalCode = `<script setup>
import { onMounted, useTemplateRef } from "vue";
import { useScrollShadows, scrollShadowTopStyle, scrollShadowBottomStyle } from "@itguy614/clean-ui";

const { canScrollUp, canScrollDown, onScroll, onMount } = useScrollShadows();
const scroller = useTemplateRef("scroller");
onMounted(() => onMount(scroller.value));
<\/script>

<template>
  <!-- The wrapper is the positioning context; the fades are its children,
       siblings of the scroller — never inside it. -->
  <div style="position: relative; border-radius: 0.5rem; background: var(--cui-surface-base)">
    <div ref="scroller" style="max-height: 16rem; overflow-y: auto" @scroll="onScroll">
      <!-- long content -->
    </div>
    <div v-if="canScrollUp" :style="scrollShadowTopStyle" />
    <div v-if="canScrollDown" :style="scrollShadowBottomStyle" />
  </div>
</template>`;

const horizontalCode = `const { canScrollLeft, canScrollRight, onScroll, onMount } = useScrollShadows();

// There is no exported left fade: mirror the right one.
const scrollShadowLeftStyle = {
  ...scrollShadowRightStyle,
  right: undefined,
  left: "0",
  background: "linear-gradient(to right, var(--cui-surface-base, white), transparent)",
};`;

const returns = [
  { name: "canScrollUp", type: "Ref<boolean>", description: "There is content above the visible area (more than 4px of it)." },
  { name: "canScrollDown", type: "Ref<boolean>", description: "There is content below the visible area." },
  { name: "canScrollLeft", type: "Ref<boolean>", description: "There is content to the left." },
  { name: "canScrollRight", type: "Ref<boolean>", description: "There is content to the right." },
  {
    name: "onScroll",
    type: "(e: Event) => void",
    description: "Bind as @scroll on the scroll container. Scroll events don't bubble, so it has to be the scroller itself.",
  },
  {
    name: "onMount",
    type: "(el: unknown) => void",
    description: "Call in onMounted with the scroller. Measures once on the next animation frame, so the initial fades are right before anyone scrolls. A null element is ignored.",
  },
  {
    name: "update",
    type: "(el: HTMLElement) => void",
    description: "Re-measure now. Call it after the content or the container changes size. Nothing else watches for that.",
  },
];

const styles = [
  { name: "scrollShadowTopStyle", type: "object", description: "36px fade across the top edge. z-index 5." },
  { name: "scrollShadowBottomStyle", type: "object", description: "36px fade across the bottom edge. z-index 5." },
  { name: "scrollShadowRightStyle", type: "object", description: "36px fade down the right edge. z-index 20." },
];
</script>

<template>
  <CuiStack spacing="8" class="cui-typography">
    <div>
      <h1>Scroll Shadows</h1>
      <p class="cui-lead">
        <code class="cui-code">useScrollShadows()</code> tracks whether a scroll container has more
        content in each direction. The three exported style objects draw an edge fade for each.
      </p>
      <p>
        <code class="cui-code">CuiTable</code>, <code class="cui-code">CuiModalBody</code> and the
        markdown editor's toolbar all use it to show that there is more to scroll to. Each fade fades
        to <code class="cui-code">var(--cui-surface-base)</code>, so it follows themes and dark mode.
        It ignores pointer events, so it never blocks a click on the content under it.
      </p>
    </div>

    <Example title="Top and bottom fades" :code="verticalCode">
      <CuiStack spacing="4">
        <CuiFlex gap="2" wrap="wrap" align="center">
          <CuiButton size="sm" variant="outline" :disabled="itemCount === 24" @click="setCount(24)">24 items</CuiButton>
          <CuiButton size="sm" variant="outline" :disabled="itemCount === 4" @click="setCount(4)">4 items</CuiButton>
          <CuiBadge :color="vertical.canScrollUp.value ? 'primary' : 'surface'">canScrollUp: {{ vertical.canScrollUp.value }}</CuiBadge>
          <CuiBadge :color="vertical.canScrollDown.value ? 'primary' : 'surface'">canScrollDown: {{ vertical.canScrollDown.value }}</CuiBadge>
        </CuiFlex>

        <div class="scroll-shadows-demo">
          <div ref="verticalEl" class="scroll-shadows-demo__scroller" @scroll="vertical.onScroll">
            <div v-for="item in allItems.slice(0, itemCount)" :key="item" class="scroll-shadows-demo__row">{{ item }}</div>
          </div>
          <div v-if="vertical.canScrollUp.value" :style="scrollShadowTopStyle" />
          <div v-if="vertical.canScrollDown.value" :style="scrollShadowBottomStyle" />
        </div>
      </CuiStack>
    </Example>

    <CuiCard variant="outline">
      <CuiCardBody>
        <p><strong>Try:</strong></p>
        <ul>
          <li>At rest, only the bottom fade shows. The first measurement runs on the frame after mount.</li>
          <li>Scroll down a little: the top fade appears once you are more than 4px from the top. Scroll to the end and the bottom fade goes.</li>
          <li>Switch to <em>4 items</em>. The list no longer overflows and both fades go. That works only because the button calls <code class="cui-code">update()</code> after the change. The composable has no resize or mutation observer.</li>
        </ul>
      </CuiCardBody>
    </CuiCard>

    <Example title="Horizontal overflow" :code="horizontalCode">
      <div class="scroll-shadows-demo">
        <div ref="horizontalEl" class="scroll-shadows-demo__strip" @scroll="horizontal.onScroll">
          <CuiButton v-for="chip in chips" :key="chip" size="sm" variant="ghost">{{ chip }}</CuiButton>
        </div>
        <div v-if="horizontal.canScrollLeft.value" :style="scrollShadowLeftStyle" />
        <div v-if="horizontal.canScrollRight.value" :style="scrollShadowRightStyle" />
      </div>
    </Example>

    <CuiCard variant="outline">
      <CuiCardBody>
        <p>
          <strong>Try:</strong> scroll the strip sideways, or narrow the window until it overflows.
          There are only three exported styles, and none of them is a left fade. Spread
          <code class="cui-code">scrollShadowRightStyle</code> and flip it, as the markdown editor's
          toolbar does. Notice also that a window resize doesn't re-measure: the right fade appears
          after your next scroll, not when the window narrows.
        </p>
      </CuiCardBody>
    </CuiCard>

    <CuiCard variant="outline">
      <CuiCardBody>
        <p><strong>The fades are siblings of the scroller, not children of it.</strong></p>
        <p>
          Wrap the scroller in an element with <code class="cui-code">position: relative</code>. Put the
          fades in that wrapper, next to the scroller. An absolutely positioned child of a scroll
          container scrolls with the content, so a fade placed inside the scroller slides out of view
          as soon as anyone scrolls. That is the opposite of what an edge fade is for, and it is how
          the editor toolbar's fades broke (#125). The styles set
          <code class="cui-code">border-radius: inherit</code>, so a fade takes its wrapper's rounded
          corner instead of squaring it off.
        </p>
      </CuiCardBody>
    </CuiCard>

    <div>
      <h2>API</h2>
      <p>
        <code class="cui-code">useScrollShadows()</code> takes no options. Call it once per scroll
        container. Each call has its own state.
      </p>
      <h3>Returns</h3>
      <PropTable :props="returns" />
      <h3>Exported styles</h3>
      <p>
        Plain inline-style objects for <code class="cui-code">:style</code>. Each one is absolutely
        positioned, 36px deep, <code class="cui-code">pointer-events: none</code> and
        <code class="cui-code">border-radius: inherit</code>, and fades from
        <code class="cui-code">var(--cui-surface-base, white)</code> to transparent. Give the scroll
        area that same background, or the fade shows as a band of a different colour.
      </p>
      <PropTable :props="styles" />
    </div>

    <div>
      <h2>When to use it</h2>
      <ul>
        <li>
          <strong>A fixed-height region whose overflow is easy to miss:</strong> a list in a card, a
          toolbar that overflows on narrow screens, a panel body. The fade shows there's more without
          the space a scrollbar takes.
        </li>
        <li>
          <strong>Content that changes size:</strong> call <code class="cui-code">update(el)</code> after
          the change, in a <code class="cui-code">nextTick</code>. For a container that resizes with the
          window, call it from your own <code class="cui-code">ResizeObserver</code>.
        </li>
        <li>
          <strong>Not over a non-surface background.</strong> The fade colour is fixed to
          <code class="cui-code">--cui-surface-base</code>. On a tinted panel, spread the style and
          replace <code class="cui-code">background</code> with your own gradient.
        </li>
      </ul>
    </div>
  </CuiStack>
</template>

<style scoped>
.scroll-shadows-demo {
  position: relative;
  max-width: 28rem;
  background: var(--cui-surface-base);
  border: 1px solid var(--cui-border);
  border-radius: var(--cui-radius-lg, 0.5rem);
}

.scroll-shadows-demo__scroller {
  max-height: 14rem;
  overflow-y: auto;
}

.scroll-shadows-demo__row {
  padding: 0.5rem 1rem;
  border-bottom: 1px solid var(--cui-border);
}

.scroll-shadows-demo__row:last-child {
  border-bottom: none;
}

.scroll-shadows-demo__strip {
  display: flex;
  gap: 0.25rem;
  padding: 0.5rem;
  overflow-x: auto;
  white-space: nowrap;
}
</style>

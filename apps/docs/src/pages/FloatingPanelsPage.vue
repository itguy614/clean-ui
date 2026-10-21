<script setup lang="ts">
import { computed, ref } from "vue";
import {
  CuiStack,
  CuiCard,
  CuiCardBody,
  CuiButton,
  CuiBadge,
  CuiFlex,
  CuiRadio,
  CuiRadioGroup,
  usePopover,
  type PopoverPlacement,
} from "@itguy614/clean-ui";
import Example from "../components/Example.vue";
import PropTable from "../components/PropTable.vue";

// --- Demo: a hand-built panel anchored to a button ---
const placement = ref<PopoverPlacement>("bottom");
const open = ref(false);

const { referenceRef, floatingRef, arrowRef, floatingStyles, arrowStyle, placement: resolved, currentSide, isPositioned } =
  usePopover({ placement, offsetDistance: 10, arrow: true });

// Floating UI measures after mount, so the panel's first frame has no position yet.
// Keep it invisible until `isPositioned` — the same guard CuiTooltip and CuiPopover use.
const hiddenUntilPositioned = computed(() => (isPositioned.value ? {} : { opacity: "0", pointerEvents: "none" as const }));

// The arrow is a rotated square; draw the border only on the two edges that face outward.
const arrowBorders = computed(() => {
  const edges = {
    top: ["borderRight", "borderBottom"],
    bottom: ["borderLeft", "borderTop"],
    left: ["borderTop", "borderRight"],
    right: ["borderBottom", "borderLeft"],
  }[currentSide.value];
  return Object.fromEntries(edges.map((e) => [e, "1px solid var(--cui-border)"]));
});

const demoCode = `<script setup>
import { computed, ref } from "vue";
import { usePopover } from "@itguy614/clean-ui";

const placement = ref("bottom");
const open = ref(false);

const { referenceRef, floatingRef, arrowRef, floatingStyles, arrowStyle,
        currentSide, isPositioned } =
  usePopover({ placement, offsetDistance: 10, arrow: true });

// No position exists until Floating UI has measured — hide the first frame.
const hiddenUntilPositioned = computed(() =>
  isPositioned.value ? {} : { opacity: "0", pointerEvents: "none" });
<\/script>

<template>
  <!-- The reference must be a DOM element: wrap a component, don't ref it. -->
  <span ref="referenceRef" style="display: inline-block">
    <CuiButton :aria-expanded="open" aria-controls="demo-panel" @click="open = !open">
      Details
    </CuiButton>
  </span>

  <Teleport to="body">
    <div v-if="open" id="demo-panel" ref="floatingRef" class="my-panel"
         :style="{ ...floatingStyles, ...hiddenUntilPositioned }">
      Anchored on the {{ currentSide }} side.
      <div ref="arrowRef" class="my-panel__arrow" :style="arrowStyle" />
    </div>
  </Teleport>
</template>`;

const options = [
  {
    name: "placement",
    type: "MaybeRefOrGetter<PopoverPlacement>",
    default: '"top"',
    description:
      'Preferred side: "top", "bottom", "left", "right" or "auto". Reactive. "auto" passes no placement to Floating UI, which then defaults to bottom.',
  },
  {
    name: "offsetDistance",
    type: "MaybeRefOrGetter<number>",
    default: "8",
    description: "Gap between the reference and the floating element, in pixels. Reactive.",
  },
  {
    name: "arrow",
    type: "boolean",
    default: "false",
    description:
      "Adds Floating UI's arrow middleware once arrowRef is bound, and fills arrowStyle. Read once at setup — not reactive.",
  },
  {
    name: "strategy",
    type: '"absolute" | "fixed"',
    default: '"absolute"',
    description: "CSS position the floating element uses. Read once at setup — not reactive.",
  },
];

const returns = [
  { name: "referenceRef", type: "Ref<HTMLElement | null>", description: "Bind with ref=\"referenceRef\" on the anchor element." },
  { name: "floatingRef", type: "Ref<HTMLElement | null>", description: "Bind on the floating element. Positioning runs while it is mounted." },
  { name: "arrowRef", type: "Ref<HTMLElement | null>", description: "Bind on the arrow element, when arrow is true." },
  {
    name: "floatingStyles",
    type: "Ref<CSSProperties>",
    description: "position plus left/top. Spread into the floating element's :style. It never sets transform, so the panel can animate its own.",
  },
  {
    name: "arrowStyle",
    type: "ComputedRef<CSSProperties>",
    description: "Absolute position for the arrow, pulled 4px past the edge facing the reference. Empty without arrow.",
  },
  {
    name: "placement",
    type: "Ref<Placement>",
    description: 'Floating UI\'s resolved placement after flip/shift, e.g. "top" or "left-start".',
  },
  {
    name: "currentSide",
    type: 'ComputedRef<"top" | "bottom" | "left" | "right">',
    description: "The side actually used, after flipping — for a side-dependent class or transform-origin.",
  },
  {
    name: "isPositioned",
    type: "Ref<boolean>",
    description: "False until the first position is computed. Keep the panel invisible until it turns true.",
  },
  { name: "update", type: "() => void", description: "Recompute the position by hand. Rarely needed: autoUpdate already tracks scroll, resize and layout shifts." },
];
</script>

<template>
  <CuiStack spacing="8" class="cui-typography">
    <div>
      <h1>Floating Panels</h1>
      <p class="cui-lead">
        <code class="cui-code">usePopover()</code> anchors a floating element to a reference element,
        and keeps it there as the page scrolls and resizes. It is the
        <a href="https://floating-ui.com/" target="_blank" rel="noopener">Floating UI</a> wrapper behind
        <code class="cui-code">CuiTooltip</code> and <code class="cui-code">CuiPopover</code>.
      </p>
      <p>
        It handles position only. Every placement gets an offset, a flip to the opposite side when
        there is no room, and a shift that keeps the panel 8px inside the viewport. Opening and closing,
        Escape, click-outside, focus and ARIA are up to you. If you need those as well, use
        <code class="cui-code">CuiPopover</code>: it already has them.
      </p>
    </div>

    <Example title="An anchored panel" :code="demoCode">
      <CuiStack spacing="6">
        <CuiRadioGroup v-model="placement" variant="buttons" label="Placement" size="sm">
          <CuiRadio value="top" label="Top" />
          <CuiRadio value="right" label="Right" />
          <CuiRadio value="bottom" label="Bottom" />
          <CuiRadio value="left" label="Left" />
          <CuiRadio value="auto" label="Auto" />
        </CuiRadioGroup>

        <div style="display: flex; justify-content: center; padding: 4rem 0">
          <span ref="referenceRef" style="display: inline-block">
            <CuiButton :aria-expanded="open" aria-controls="floating-panels-demo" @click="open = !open">
              {{ open ? "Hide details" : "Show details" }}
            </CuiButton>
          </span>
        </div>

        <CuiFlex gap="2" wrap="wrap" align="center">
          <span>Asked for <CuiBadge>{{ placement }}</CuiBadge></span>
          <span>got <CuiBadge color="info">{{ open ? resolved : "—" }}</CuiBadge></span>
        </CuiFlex>
      </CuiStack>

      <Teleport to="body">
        <div
          v-if="open"
          id="floating-panels-demo"
          ref="floatingRef"
          class="floating-panels-demo"
          :style="{ ...floatingStyles, ...hiddenUntilPositioned }"
        >
          <strong>Anchored on the {{ currentSide }} side.</strong>
          <span>Scroll the page or narrow the window — the panel follows its button.</span>
          <div ref="arrowRef" class="floating-panels-demo__arrow" :style="{ ...arrowStyle, ...arrowBorders }" />
        </div>
      </Teleport>
    </Example>

    <CuiCard variant="outline">
      <CuiCardBody>
        <p><strong>Try:</strong></p>
        <ul>
          <li>Open the panel, then switch placements. The panel moves with each one, because <code class="cui-code">placement</code> is a ref.</li>
          <li>Choose <em>Top</em> and scroll until the button is near the top of the window. The panel flips to the bottom, and <em>got</em> shows the new side.</li>
          <li>Choose <em>Left</em> or <em>Right</em> on a narrow window. If neither side has room, the panel falls back to the vertical axis.</li>
          <li>Choose <em>Auto</em>: you get <em>bottom</em>. Auto isn't a "best side" search. It just leaves the choice to Floating UI, whose default is bottom.</li>
        </ul>
      </CuiCardBody>
    </CuiCard>

    <div>
      <h2>API</h2>
      <p>
        <code class="cui-code">usePopover(options?: UsePopoverOptions)</code>. The types
        <code class="cui-code">PopoverPlacement</code> and <code class="cui-code">UsePopoverOptions</code>
        are exported too.
      </p>
      <h3>Options</h3>
      <PropTable :props="options" />
      <h3>Returns</h3>
      <PropTable :props="returns" />
    </div>

    <div>
      <h2>When to use it</h2>
      <ul>
        <li>
          <strong>A custom floating element that doesn't fit <code class="cui-code">CuiTooltip</code> or
          <code class="cui-code">CuiPopover</code>:</strong> a hover card, a coach mark, an inline
          annotation. Check first whether <code class="cui-code">CuiPopover</code>'s slots already cover it.
        </li>
        <li>
          <strong>Not for menus or listboxes.</strong> <code class="cui-code">CuiDropdown</code>,
          <code class="cui-code">CuiSelect</code>, <code class="cui-code">CuiCombobox</code> and
          <code class="cui-code">CuiTagInput</code> use a separate, synchronous positioner that is
          internal to the library. Floating UI computes position asynchronously, after mount. That is
          fine for a tooltip, where the show delay hides the first unpositioned frame. A menu that
          appears on click with <code class="cui-code">v-if</code> would draw in the wrong place
          first. The internal positioner measures the trigger and places the panel before it paints.
          It isn't exported, so build menus from those components rather than from this composable.
        </li>
        <li>
          <strong>Layering is yours.</strong> Teleport the panel to <code class="cui-code">body</code> so
          no ancestor's <code class="cui-code">overflow</code> clips it. Give it a z-index from the
          library's scale: popovers use <code class="cui-code">calc(var(--cui-z-overlay, 9990) + 8)</code>,
          so a consumer who re-layers the library moves your panel with it.
        </li>
      </ul>
    </div>
  </CuiStack>
</template>

<style scoped>
.floating-panels-demo {
  z-index: calc(var(--cui-z-overlay, 9990) + 8);
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  max-width: 16rem;
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  color: var(--cui-text-body);
  background: var(--cui-surface-base);
  border: 1px solid var(--cui-border);
  border-radius: var(--cui-radius-md, 0.375rem);
  transition: opacity 0.1s;
}

.floating-panels-demo__arrow {
  width: 8px;
  height: 8px;
  background: var(--cui-surface-base);
  transform: rotate(45deg);
}
</style>

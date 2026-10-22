<script setup lang="ts">
import { computed, defineComponent, h, ref } from "vue";
import {
  CuiStack,
  CuiCard,
  CuiCardBody,
  CuiBadge,
  CuiFlex,
  CuiGrid,
  CuiToggle,
  useBreakpoint,
  useGridContext,
  useFlexContext,
  type ActiveBreakpoint,
} from "@itguy614/clean-ui";
import Example from "../components/Example.vue";
import PropTable, { type PropRow } from "../components/PropTable.vue";

// --- Breakpoint readout ---
const { breakpoint } = useBreakpoint();
const steps: { id: ActiveBreakpoint; min: string }[] = [
  { id: "base", min: "0" },
  { id: "sm", min: "640px" },
  { id: "md", min: "768px" },
  { id: "lg", min: "1024px" },
  { id: "xl", min: "1280px" },
  { id: "2xl", min: "1536px" },
];
const columnsFor: Record<ActiveBreakpoint, number> = { base: 1, sm: 2, md: 2, lg: 3, xl: 4, "2xl": 4 };
const columns = computed(() => columnsFor[breakpoint.value]);

// --- Layout context probe: a leaf component that reports where it sits ---
// Calling useGridContext()/useFlexContext() registers the caller as a layout level of that
// type, so a probe reads `parentContext` — the context of the CuiGrid/CuiFlex around it.
const probeStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "0.125rem",
  padding: "0.75rem",
  fontSize: "0.875rem",
  border: "1px solid var(--cui-primary-border)",
  background: "var(--cui-primary-bg)",
  borderRadius: "var(--cui-radius-md, 0.375rem)",
} as const;
const LayoutProbe = defineComponent({
  name: "LayoutProbe",
  props: { label: { type: String, required: true } },
  setup(props) {
    const { parentContext: grid } = useGridContext();
    const { parentContext: flex } = useFlexContext();
    return () =>
      h("div", { style: probeStyle }, [
        h("strong", props.label),
        h("div", grid ? `In a grid — grid depth ${grid.value.depth}, debug ${grid.value.debug}` : "Not in a grid"),
        h("div", flex ? `In a flex — flex depth ${flex.value.depth}, debug ${flex.value.debug}` : "Not in a flex"),
      ]);
  },
});
const outerDebug = ref(false);

const breakpointCode = `<script setup>
import { computed } from "vue";
import { useBreakpoint } from "@itguy614/clean-ui";

const { breakpoint } = useBreakpoint(); // Readonly<Ref<"base" | "sm" | "md" | "lg" | "xl" | "2xl">>

const columns = computed(() =>
  ({ base: 1, sm: 2, md: 2, lg: 3, xl: 4, "2xl": 4 })[breakpoint.value],
);
<\/script>

<template>
  <p>Active breakpoint: {{ breakpoint }} — {{ columns }} columns</p>
</template>`;

const contextCode = `<!-- LayoutProbe.vue -->
<script setup>
import { useGridContext, useFlexContext } from "@itguy614/clean-ui";

// parentContext is the enclosing CuiGrid's / CuiFlex's context, or null.
const { parentContext: grid } = useGridContext();
const { parentContext: flex } = useFlexContext();
<\/script>

<template>
  <div>
    <p v-if="grid">In a grid — depth {{ grid.depth }}, debug {{ grid.debug }}</p>
    <p v-else>Not in a grid</p>
    <p v-if="flex">In a flex — depth {{ flex.depth }}</p>
  </div>
</template>

<!-- usage -->
<CuiGrid :cols="2" gap="4" :debug="debug">
  <LayoutProbe label="Grid child" />
  <CuiGrid :cols="1">
    <LayoutProbe label="Nested grid child" />
  </CuiGrid>
</CuiGrid>
<CuiFlex gap="4">
  <LayoutProbe label="Flex child" />
</CuiFlex>`;

const breakpointReturns: PropRow[] = [
  {
    name: "breakpoint",
    type: "Readonly<Ref<ActiveBreakpoint>>",
    description:
      'The widest breakpoint the window currently meets: "base" below 640px, then "sm" | "md" | "lg" | "xl" | "2xl". Always "base" during server rendering.',
  },
];

const contextReturns: PropRow[] = [
  {
    name: "context",
    type: "Ref<LayoutContext>",
    description: "The context this call creates and provides to its descendants — the caller becomes a layout level.",
  },
  {
    name: "parentContext",
    type: "Ref<LayoutContext> | null",
    description: "The nearest enclosing context of the same type (grid or flex), or null when there is none.",
  },
];

const layoutContextFields: PropRow[] = [
  { name: "type", type: '"grid" | "flex"', description: "Which family the context belongs to." },
  { name: "isNested", type: "boolean", description: "True when there is an enclosing context of the same type." },
  { name: "depth", type: "number", description: "0 at the outermost level, +1 for each nested level of the same type." },
  {
    name: "debug",
    type: "boolean",
    description: "Whether debug outlines are on. Starts as the parent's value; CuiGrid and CuiFlex then overwrite it from their own debug prop.",
  },
];
</script>

<template>
  <CuiStack spacing="8" class="cui-typography">
    <div>
      <h1>Breakpoint &amp; Layout Context</h1>
      <p class="cui-lead">
        <code class="cui-code">useBreakpoint()</code> tells a component which responsive breakpoint is
        active. <code class="cui-code">useGridContext()</code> and
        <code class="cui-code">useFlexContext()</code> tell it which grid or flex container it sits in.
      </p>
      <p>
        These are the composables the layout components are built on: CuiGrid, CuiFlex and the other
        responsive components resolve their breakpoint-keyed props through
        <code class="cui-code">useBreakpoint()</code>, and CuiGrid and CuiFlex track nesting depth (for
        the debug overlay) through the layout context.
      </p>
    </div>

    <!-- useBreakpoint -->
    <Example title="Active breakpoint" :code="breakpointCode">
      <CuiStack spacing="4">
        <CuiFlex gap="2" wrap="wrap">
          <CuiBadge
            v-for="step in steps"
            :key="step.id"
            :color="breakpoint === step.id ? 'primary' : 'surface'"
            :variant="breakpoint === step.id ? 'solid' : 'subtle'"
          >
            {{ step.id }} · {{ step.min }}
          </CuiBadge>
        </CuiFlex>
        <p style="margin: 0">
          Active breakpoint: <CuiBadge>{{ breakpoint }}</CuiBadge> — a layout keyed on it would use
          <strong>{{ columns }}</strong> {{ columns === 1 ? "column" : "columns" }}.
        </p>
      </CuiStack>
    </Example>

    <CuiCard variant="outline">
      <CuiCardBody>
        <p><strong>Try:</strong></p>
        <ul>
          <li>Resize the browser window: the highlighted badge follows the width, with no reload.</li>
          <li>Narrow the window below 640px and the value becomes <code class="cui-code">base</code> — the step below <code class="cui-code">sm</code>.</li>
          <li>The thresholds are Tailwind's defaults; the value is the widest one the window meets (a <code class="cui-code">min-width</code> query, mobile-first).</li>
        </ul>
      </CuiCardBody>
    </CuiCard>

    <!-- Layout context -->
    <Example title="Reading the layout context" :code="contextCode">
      <CuiStack spacing="4">
        <CuiToggle v-model="outerDebug" label="Debug on the outer grid" />
        <CuiGrid :cols="2" gap="4" :debug="outerDebug">
          <LayoutProbe label="Grid child" />
          <CuiGrid :cols="1" gap="4">
            <LayoutProbe label="Nested grid child" />
          </CuiGrid>
        </CuiGrid>
        <CuiFlex gap="4" wrap="wrap">
          <LayoutProbe label="Flex child" />
          <CuiGrid :cols="1">
            <LayoutProbe label="Grid inside a flex" />
          </CuiGrid>
        </CuiFlex>
        <LayoutProbe label="Outside any layout" />
      </CuiStack>
    </Example>

    <CuiCard variant="outline">
      <CuiCardBody>
        <p><strong>Try:</strong></p>
        <ul>
          <li>The nested grid child reports depth 1; its parent grid is itself inside a grid.</li>
          <li>The grid inside a flex reports grid depth 0 <em>and</em> a flex parent: grid and flex are tracked separately, so each counts only its own kind.</li>
          <li>Turn on <em>Debug on the outer grid</em>: the grid child's readout changes, the nested grid child's does not — each CuiGrid sets <code class="cui-code">debug</code> from its own prop.</li>
        </ul>
      </CuiCardBody>
    </CuiCard>

    <!-- API -->
    <div>
      <h2>API</h2>
      <h3><code class="cui-code">useBreakpoint()</code></h3>
      <p>
        Takes no arguments. Every call shares one reactive value and one set of
        <code class="cui-code">matchMedia</code> listeners (one per breakpoint), so calling it from many
        components costs nothing extra.
      </p>
      <PropTable :props="breakpointReturns" />
      <p>
        <code class="cui-code">ActiveBreakpoint</code> is exported as a type:
        <code class="cui-code">"base" | "sm" | "md" | "lg" | "xl" | "2xl"</code>, with minimum widths of
        640, 768, 1024, 1280 and 1536px for <code class="cui-code">sm</code> to <code class="cui-code">2xl</code>.
      </p>

      <h3><code class="cui-code">useGridContext()</code> / <code class="cui-code">useFlexContext()</code></h3>
      <p>
        Takes no arguments. Each call injects the enclosing context of its type, then creates and
        <em>provides</em> a new one a level deeper — calling it makes the caller a grid (or flex) level for
        everything beneath it. A leaf component that only wants to know where it sits reads
        <code class="cui-code">parentContext</code>; a container component of your own that should count
        as a level reads <code class="cui-code">context</code>.
      </p>
      <PropTable :props="contextReturns" />
      <p><code class="cui-code">LayoutContext</code> (exported as a type):</p>
      <PropTable :props="layoutContextFields" />
    </div>

    <div>
      <h2>When to use it</h2>
      <ul>
        <li>
          Use <code class="cui-code">useBreakpoint()</code> when a component's <em>behaviour</em> or
          <em>structure</em> changes with width — fewer columns, a menu that collapses into a drawer, a
          different number of items. For purely visual changes, a CSS media query or a responsive prop on
          CuiGrid/CuiFlex is simpler and works before hydration.
        </li>
        <li>
          Server rendering always sees <code class="cui-code">base</code>, so markup chosen from the
          breakpoint can shift once the client hydrates. Prefer it for things that render after mount.
        </li>
        <li>
          Use the layout context when a component placed inside a CuiGrid or CuiFlex needs to adapt to
          it — for example, a debug overlay of your own, or a card that drops its outer margin when it is a
          grid cell.
        </li>
      </ul>
    </div>
  </CuiStack>
</template>


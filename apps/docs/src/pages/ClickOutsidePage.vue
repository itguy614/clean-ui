<script setup lang="ts">
import { ref, useTemplateRef } from "vue";
import { CuiStack, CuiCard, CuiCardBody, CuiButton, CuiFlex, CuiBadge, useClickOutside } from "@itguy614/clean-ui";
import Example from "../components/Example.vue";
import PropTable from "../components/PropTable.vue";

// --- Panel that closes on an outside press, listening only while open ---
const open = ref(false);
const outsideClicks = ref(0);
const triggerEl = useTemplateRef<HTMLElement>("triggerEl");
const panelEl = useTemplateRef<HTMLElement>("panelEl");

useClickOutside(
  // The trigger counts as "inside": otherwise pressing it to close would close the panel
  // on mousedown and its click would open it again.
  () => [triggerEl.value, panelEl.value],
  () => {
    outsideClicks.value++;
    open.value = false;
  },
  { enabled: open },
);

// --- The same thing without `enabled`: the listener is always attached ---
const alwaysOpen = ref(false);
const alwaysCalls = ref(0);
const alwaysCallsWhileClosed = ref(0);
const alwaysTriggerEl = useTemplateRef<HTMLElement>("alwaysTriggerEl");
const alwaysPanelEl = useTemplateRef<HTMLElement>("alwaysPanelEl");

useClickOutside(
  () => [alwaysTriggerEl.value, alwaysPanelEl.value],
  () => {
    alwaysCalls.value++;
    if (!alwaysOpen.value) alwaysCallsWhileClosed.value++;
    alwaysOpen.value = false;
  },
);

const panelCode = `<script setup>
const open = ref(false);
const triggerEl = useTemplateRef("triggerEl");
const panelEl = useTemplateRef("panelEl");

useClickOutside(
  () => [triggerEl.value, panelEl.value],  // presses inside any of these are ignored
  () => (open.value = false),
  { enabled: open },                       // listen only while the panel is open
);
<\/script>

<template>
  <span ref="triggerEl">
    <CuiButton :aria-expanded="open" @click="open = !open">Filters</CuiButton>
  </span>
  <div v-if="open" ref="panelEl" class="panel">…</div>
</template>`;

const alwaysCode = `// No \`enabled\`: one document mousedown listener for the life of the component,
// and the handler runs on every press outside — open or not.
useClickOutside(
  () => [triggerEl.value, panelEl.value],
  () => (open.value = false),
);`;

const panelStyle = {
  position: "absolute",
  top: "calc(100% + 0.5rem)",
  left: "0",
  zIndex: "1",
  width: "16rem",
  padding: "1rem",
  background: "var(--cui-surface-base)",
  border: "1px solid var(--cui-border)",
  borderRadius: "var(--cui-radius-lg, 0.5rem)",
} as const;

const params = [
  {
    name: "targets",
    type: "Ref<HTMLElement | null | undefined>[] | (() => (HTMLElement | null | undefined)[])",
    description:
      "The elements that count as inside. A press within any of them is ignored. An array of refs works, template refs included; pass a getter when the set of elements is computed, or one is teleported (a trigger plus its panel in <body>). Null entries are skipped, so a v-if panel that is not rendered is fine.",
  },
  {
    name: "handler",
    type: "() => void",
    description: "Called on a mousedown whose target is outside every element in targets. It receives no event.",
  },
  {
    name: "options.enabled",
    type: "MaybeRefOrGetter<boolean>",
    description:
      "Attach the listener only while this is true. Pass the panel's open state. When it turns on, the listener is attached a task later, so the press that opened the panel cannot also close it.",
  },
];
</script>

<template>
  <CuiStack spacing="8" class="cui-typography">
    <div>
      <h1>Click Outside</h1>
      <p class="cui-lead">
        <code class="cui-code">useClickOutside()</code> calls a handler when a press lands outside a set
        of elements: the usual way to close a dropdown, popover or menu.
      </p>
      <p>
        It listens for <code class="cui-code">mousedown</code> on the document, so the panel closes as
        the press starts rather than when it ends. Every library component that closes on an outside
        press uses it. Write your own document listener only if you need something it can't do.
      </p>
    </div>

    <!-- Panel -->
    <Example title="A panel that closes on an outside press" :code="panelCode" code-open>
      <CuiStack spacing="4">
        <div style="position: relative; display: inline-block; align-self: flex-start">
          <span ref="triggerEl" style="display: inline-block">
            <CuiButton :aria-expanded="open" aria-controls="click-outside-panel" @click="open = !open">
              {{ open ? "Close filters" : "Open filters" }}
            </CuiButton>
          </span>
          <div v-if="open" id="click-outside-panel" ref="panelEl" :style="panelStyle">
            <CuiStack spacing="3">
              <p style="margin: 0">Presses inside this panel are ignored.</p>
              <CuiButton size="sm" variant="ghost" @click="outsideClicks = 0">Reset counter</CuiButton>
            </CuiStack>
          </div>
        </div>
        <CuiFlex gap="3" wrap="wrap" align="center">
          <span>Outside presses handled: <CuiBadge>{{ outsideClicks }}</CuiBadge></span>
          <span>
            Listener:
            <CuiBadge :color="open ? 'success' : 'surface'">{{ open ? "attached" : "none" }}</CuiBadge>
          </span>
        </CuiFlex>
      </CuiStack>
    </Example>

    <CuiCard variant="outline">
      <CuiCardBody>
        <p><strong>Try:</strong></p>
        <ul>
          <li>Open the panel, then click anywhere else on the page. It closes and the counter goes up by one.</li>
          <li>Open it and click inside the panel, or on its <em>Reset counter</em> button. It stays open.</li>
          <li>Click the trigger while the panel is open. It closes once and the counter doesn't move: the trigger is one of the targets, so its own click does the closing.</li>
          <li>With the panel closed, click around the page. The counter doesn't move. No listener is attached, so the handler never runs.</li>
        </ul>
      </CuiCardBody>
    </CuiCard>

    <!-- Without enabled -->
    <Example title="Without enabled" :code="alwaysCode">
      <CuiStack spacing="4">
        <div style="position: relative; display: inline-block; align-self: flex-start">
          <span ref="alwaysTriggerEl" style="display: inline-block">
            <CuiButton :aria-expanded="alwaysOpen" @click="alwaysOpen = !alwaysOpen">
              {{ alwaysOpen ? "Close panel" : "Open panel" }}
            </CuiButton>
          </span>
          <div v-if="alwaysOpen" ref="alwaysPanelEl" :style="panelStyle">
            <p style="margin: 0">Same panel, no <code class="cui-code">enabled</code>.</p>
          </div>
        </div>
        <CuiFlex gap="3" wrap="wrap" align="center">
          <span>Handler calls: <CuiBadge>{{ alwaysCalls }}</CuiBadge></span>
          <span>
            Calls while already closed:
            <CuiBadge :color="alwaysCallsWhileClosed > 0 ? 'warning' : 'surface'">{{ alwaysCallsWhileClosed }}</CuiBadge>
          </span>
        </CuiFlex>
      </CuiStack>
    </Example>

    <CuiCard variant="outline">
      <CuiCardBody>
        <p>
          <strong>Try:</strong> leave this panel closed and click around the page. Every click outside
          it, including clicks on the first demo, runs this handler, and the second counter shows how
          many of those calls had nothing to close.
        </p>
        <p style="margin-bottom: 0">
          That is why <code class="cui-code">enabled</code> exists (#203). A page with fifty selects,
          comboboxes and dropdowns would otherwise hold fifty document listeners, and every press
          anywhere would run all fifty handlers to close panels that aren't open. With
          <code class="cui-code">enabled: open</code> a closed control costs nothing. Only the one
          open panel listens.
        </p>
      </CuiCardBody>
    </CuiCard>

    <!-- API -->
    <div>
      <h2>API</h2>
      <pre class="cui-pre"><code class="cui-code">useClickOutside(targets, handler, options?): void</code></pre>
      <p>It returns nothing. The listener is removed when the calling component unmounts, or when <code class="cui-code">enabled</code> turns false.</p>
    </div>

    <CuiCard variant="outline">
      <CuiCardBody>
        <PropTable :props="params" />
      </CuiCardBody>
    </CuiCard>

    <CuiCard variant="outline">
      <CuiCardBody>
        <p><strong>Things to know:</strong></p>
        <ul style="margin-bottom: 0">
          <li>
            Include the trigger in <code class="cui-code">targets</code>. Otherwise, pressing it to
            close the panel closes it on mousedown, and the click that follows opens it again.
          </li>
          <li>
            Arming is delayed by one task after <code class="cui-code">enabled</code> turns true. So a
            panel opened from a <code class="cui-code">mousedown</code> handler doesn't receive that
            same press when it bubbles up to the document.
          </li>
          <li>
            The listener goes on <code class="cui-code">document</code> through the library's
            <code class="cui-code">useEventListener</code>, so it is SSR-safe: on the server nothing is
            attached. Call it during a component's setup. Outside a component or effect scope it adds
            no listener and logs a warning, because nothing could ever remove one.
          </li>
          <li>
            Only <code class="cui-code">mousedown</code> is watched. A focus change from the keyboard
            doesn't count as an outside press, so close the panel on Escape or Tab yourself (overlays
            use the shared layer stack for Escape).
          </li>
        </ul>
      </CuiCardBody>
    </CuiCard>

    <!-- When to use it -->
    <div>
      <h2>When to use it</h2>
      <p>
        Use it for any panel that closes when the user turns their attention elsewhere: a custom
        dropdown, a filter popover, an inline editor, or a teleported menu whose trigger lives
        somewhere else in the DOM. Always pass <code class="cui-code">enabled</code> with the panel's
        open state.
      </p>
      <p style="margin-bottom: 0">
        Don't use it for modal overlays. A modal blocks the page behind it with a backdrop, so
        handle a press on that backdrop directly. <router-link :to="{ name: 'overlay' }">useOverlay</router-link>'s
        <code class="cui-code">onBackdropClick</code> does this.
      </p>
    </div>
  </CuiStack>
</template>

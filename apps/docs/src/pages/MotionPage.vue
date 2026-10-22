<script setup lang="ts">
import { computed, ref } from "vue";
import {
  CuiStack,
  CuiCard,
  CuiCardHeader,
  CuiCardBody,
  CuiRadioGroup,
  CuiRadio,
  CuiButton,
  CuiToggle,
  CuiFlex,
  CuiAccordion,
  CuiAccordionItem,
  CuiPopover,
  CuiTooltip,
  CuiDropdown,
  CuiDropdownTrigger,
  CuiDropdownMenu,
  CuiDropdownItem,
  CuiBadge,
  CuiAlert,
  useToast,
  motionDuration,
  MOTION_DURATIONS,
  type MotionDuration,
} from "@itguy614/clean-ui";
import Example from "../components/Example.vue";
import TokenTable from "../components/TokenTable.vue";
import type { TokenRow } from "../meta/types";

const DURATION_USE: Record<MotionDuration, string> = {
  instant: "No motion",
  press: "A button press, a toggle knob, a menu row's hover",
  fast: "Tooltips, colour changes, and every exit",
  base: "Dropdowns, selects, popovers",
  slow: "Modals, slideovers, toasts, collapsible panels",
};
const DURATIONS: TokenRow[] = (Object.keys(MOTION_DURATIONS) as MotionDuration[]).map((name) => ({
  name: `--cui-duration-${name}`,
  default: `${MOTION_DURATIONS[name]}ms`,
  description: DURATION_USE[name],
}));

const EASINGS: TokenRow[] = [
  { name: "--cui-ease-out", default: "cubic-bezier(0.23, 1, 0.32, 1)", description: "Anything entering or leaving, and hover feedback" },
  { name: "--cui-ease-in-out", default: "cubic-bezier(0.77, 0, 0.175, 1)", description: "Something moving on screen: a knob, a chevron turning" },
  { name: "--cui-ease-drawer", default: "cubic-bezier(0.32, 0.72, 0, 1)", description: "CuiSlideover's panel sliding in from an edge" },
];

// The speed demo scales every duration token on one container.
const speed = ref<"snappy" | "default" | "calm">("default");
const SPEED_FACTOR = { snappy: 0.5, default: 1, calm: 2 } as const;
const speedStyle = computed(() =>
  Object.fromEntries(
    (Object.keys(MOTION_DURATIONS) as MotionDuration[]).map((name) => [
      `--cui-duration-${name}`,
      `${MOTION_DURATIONS[name] * SPEED_FACTOR[speed.value]}ms`,
    ]),
  ),
);
const demoToggle = ref(true);

// motionDuration() reads what the CSS resolves to on an element.
const speedBox = ref<HTMLElement | null>(null);
const measured = ref<number | null>(null);
function measure() {
  measured.value = motionDuration("base", speedBox.value);
}

const tokensCode = `/* A calmer library */
:root {
  --cui-duration-base: 300ms;
  --cui-duration-slow: 350ms;
}

/* Or just a calmer panel */
.settings-panel {
  --cui-duration-base: 300ms;
  --cui-duration-slow: 350ms;
}`;

const pressCode = `<CuiButton variant="solid">Press me</CuiButton>

<!-- Turn the press off for a subtree, or on :root for everything -->
<div style="--cui-press-scale: 1">
  <CuiButton>No press</CuiButton>
</div>`;

const originCode = `<CuiPopover placement="top" title="top">
  <CuiButton variant="outline">top</CuiButton>
  <template #content><p>Grows from the top side's trigger edge.</p></template>
</CuiPopover>

<CuiDropdown>
  <CuiDropdownTrigger>
    <CuiButton>Menu</CuiButton>
  </CuiDropdownTrigger>
  <CuiDropdownMenu>
    <CuiDropdownItem>First</CuiDropdownItem>
    <CuiDropdownItem>Second</CuiDropdownItem>
  </CuiDropdownMenu>
</CuiDropdown>

<CuiTooltip text="From its trigger">
  <CuiButton variant="ghost">Hover me</CuiButton>
</CuiTooltip>`;

// Exits (#263): toasts to remove from the middle of the stack, an alert to dismiss.
const { toast, dismiss } = useToast();
let stack: string[] = [];
function threeToasts() {
  stack = ["First", "Second", "Third"].map((title) => toast({ title, description: "Stays until dismissed", autoDismiss: 0 }));
}
function dismissMiddle() {
  if (stack[1]) dismiss(stack[1]);
}
const alertKey = ref(0);
const alertGone = ref(false);

const exitCode = `<!-- Menus, popovers, tooltips and listboxes play an exit before they unmount,
     and reverse if reopened mid-exit -->
<CuiDropdown>…</CuiDropdown>

<!-- Removing a toast moves the rest into place -->
const { toast, dismiss } = useToast();
dismiss(id);

<!-- An alert emits dismiss once its exit has played -->
<CuiAlert dismissible title="Saved" @dismiss="…" />`;

const jsCode = `import { motionDuration } from "@itguy614/clean-ui";

// Wait exactly as long as the CSS exit animation on this element
setTimeout(remove, motionDuration("fast", panelEl));`;
</script>

<template>
  <CuiStack spacing="8" class="cui-typography">
    <div>
      <h1>Motion</h1>
      <p class="cui-lead">
        Every transition and animation in the library reads a duration and an easing token.
        Override them on <code class="cui-code">:root</code> for the whole app, or on any
        container for one part of it.
      </p>
    </div>

    <CuiCard variant="outline">
      <CuiCardHeader title="Durations" />
      <CuiCardBody>
        <p class="text-sm" style="color: var(--cui-text-secondary);">
          UI motion stays under 300ms, and exits run faster than entries: a menu opens over
          <code class="cui-code">base</code> and closes over <code class="cui-code">fast</code>.
          Looping animations, such as spinners and skeletons, keep their own longer durations.
        </p>
        <div style="margin-top: 0.75rem;"><TokenTable :tokens="DURATIONS" /></div>
      </CuiCardBody>
    </CuiCard>

    <CuiCard variant="outline">
      <CuiCardHeader title="Easings" />
      <CuiCardBody>
        <p class="text-sm" style="color: var(--cui-text-secondary);">
          Colour and hover changes keep plain <code class="cui-code">ease</code>, and constant
          loops keep <code class="cui-code">linear</code>. Nothing in the library uses
          <code class="cui-code">ease-in</code>: it starts slowly, so the interface feels late.
        </p>
        <div style="margin-top: 0.75rem;"><TokenTable :tokens="EASINGS" /></div>
      </CuiCardBody>
    </CuiCard>

    <Example title="Overriding the tokens on a container" :code="tokensCode">
      <CuiStack spacing="4">
        <CuiRadioGroup v-model="speed" label="Speed for this panel" orientation="horizontal">
          <CuiRadio value="snappy" label="Snappy (×0.5)" />
          <CuiRadio value="default" label="Default" />
          <CuiRadio value="calm" label="Calm (×2)" />
        </CuiRadioGroup>
        <div ref="speedBox" :style="speedStyle">
          <CuiFlex gap="4" class="flex-wrap items-center">
            <CuiToggle v-model="demoToggle" label="Toggle" />
            <CuiButton variant="ghost" @click="measure">Read motionDuration("base")</CuiButton>
            <CuiBadge v-if="measured !== null" variant="subtle">{{ measured }}ms</CuiBadge>
          </CuiFlex>
          <CuiAccordion style="margin-top: 1rem; max-width: 28rem;">
            <CuiAccordionItem value="demo" label="Open me">The chevron turns and the panel opens over this container's durations.</CuiAccordionItem>
          </CuiAccordion>
        </div>
        <p class="text-sm" style="color: var(--cui-text-secondary);">
          A container's override reaches what renders inside it. Menus, popovers, tooltips,
          modals and slideovers are teleported to <code class="cui-code">&lt;body&gt;</code>, so
          they follow <code class="cui-code">:root</code>'s tokens, not the container's.
        </p>
      </CuiStack>
    </Example>

    <Example title="Press feedback" :code="pressCode">
      <CuiStack spacing="3">
        <p class="text-sm" style="color: var(--cui-text-secondary);">
          A pressed button shrinks to <code class="cui-code">--cui-press-scale</code> (0.97)
          over <code class="cui-code">--cui-duration-press</code>. Set the token to
          <code class="cui-code">1</code> to turn it off. Reduced motion turns it off, and so
          does a CuiButtonGroup, whose merged buttons would otherwise pull apart.
        </p>
        <CuiFlex gap="3" class="flex-wrap items-center">
          <CuiButton variant="solid">Press me</CuiButton>
          <CuiButton>Outline</CuiButton>
          <div style="--cui-press-scale: 1">
            <CuiButton>No press</CuiButton>
          </div>
        </CuiFlex>
      </CuiStack>
    </Example>

    <Example title="Panels grow out of their trigger" :code="originCode">
      <CuiStack spacing="3">
        <p class="text-sm" style="color: var(--cui-text-secondary);">
          Popovers, tooltips, menus and listboxes scale in from the edge that faces their
          trigger, on whichever side they opened, and after flipping when there isn't room.
          A context menu grows from the corner at the pointer. Modals stay centred.
        </p>
        <CuiFlex gap="3" class="flex-wrap items-center">
          <CuiPopover v-for="side in (['top', 'right', 'bottom', 'left'] as const)" :key="side" :placement="side" :title="side">
            <CuiButton variant="outline">{{ side }}</CuiButton>
            <template #content><p style="padding: 0.75rem; margin: 0;">Grows from the {{ side }} side's trigger edge.</p></template>
          </CuiPopover>
          <CuiDropdown>
            <CuiDropdownTrigger>
              <CuiButton>Menu</CuiButton>
            </CuiDropdownTrigger>
            <CuiDropdownMenu>
              <CuiDropdownItem>First</CuiDropdownItem>
              <CuiDropdownItem>Second</CuiDropdownItem>
            </CuiDropdownMenu>
          </CuiDropdown>
          <CuiTooltip text="From its trigger">
            <CuiButton variant="ghost">Hover me</CuiButton>
          </CuiTooltip>
        </CuiFlex>
      </CuiStack>
    </Example>

    <Example title="Exits" :code="exitCode">
      <CuiStack spacing="4">
        <p class="text-sm" style="color: var(--cui-text-secondary);">
          Every overlay animates out, faster than it came in, then leaves the DOM. Click the
          menu's trigger twice quickly: it turns straight back from where it was. Modals,
          slideovers and alerts finish their exit before they report closing.
        </p>
        <CuiFlex gap="3" class="flex-wrap items-center">
          <CuiDropdown>
            <CuiDropdownTrigger>
              <CuiButton>Menu</CuiButton>
            </CuiDropdownTrigger>
            <CuiDropdownMenu>
              <CuiDropdownItem>First</CuiDropdownItem>
              <CuiDropdownItem>Second</CuiDropdownItem>
            </CuiDropdownMenu>
          </CuiDropdown>
          <CuiButton variant="outline" @click="threeToasts">Show three toasts</CuiButton>
          <CuiButton variant="outline" @click="dismissMiddle">Dismiss the middle one</CuiButton>
          <CuiButton v-if="alertGone" variant="ghost" @click="alertGone = false; alertKey++">Bring the alert back</CuiButton>
        </CuiFlex>
        <CuiAlert v-if="!alertGone" :key="alertKey" color="success" title="Saved" dismissible @dismiss="alertGone = true">
          Dismiss me: the alert fades out, then reports it.
        </CuiAlert>
      </CuiStack>
    </Example>

    <CuiCard variant="outline">
      <CuiCardHeader title="Reading a duration in JavaScript" />
      <CuiCardBody>
        <p class="text-sm" style="color: var(--cui-text-secondary);">
          <code class="cui-code">motionDuration(name, el?)</code> returns a duration token's
          value in milliseconds, as it resolves on <code class="cui-code">el</code> (the document
          root by default). Use it for any wait that has to match a CSS animation, so the two
          can't drift apart. It falls back to the default under server rendering. Set the
          tokens to plain times, such as <code class="cui-code">150ms</code> or
          <code class="cui-code">0.2s</code>: a <code class="cui-code">calc()</code> stays
          unresolved in a custom property, so JavaScript can't read it, and you'll get a
          console warning.
          <code class="cui-code">MOTION_DURATIONS</code> holds the defaults.
        </p>
        <pre class="cui-pre" style="margin-top: 0.75rem;"><code class="cui-code">{{ jsCode }}</code></pre>
      </CuiCardBody>
    </CuiCard>
  </CuiStack>
</template>

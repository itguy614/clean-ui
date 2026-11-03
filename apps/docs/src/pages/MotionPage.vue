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
  CuiSlider,
  CuiProgress,
  CuiTransition,
  CuiInput,
  useToast,
  motionDuration,
  MOTION_DURATIONS,
  type MotionDuration,
} from "@itguy614/clean-ui";
import Example from "../components/Example.vue";
import TokenTable from "../components/TokenTable.vue";
import PropTable, { type PropRow } from "../components/PropTable.vue";
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
const level = ref(40);
const alertGone = ref(false);

const exitCode = `<!-- Menus, popovers, tooltips and listboxes play an exit before they unmount,
     and reverse if reopened mid-exit -->
<CuiDropdown>…</CuiDropdown>

<!-- Removing a toast moves the rest into place -->
const { toast, dismiss } = useToast();
dismiss(id);

<!-- An alert emits dismiss once its exit has played -->
<CuiAlert dismissible title="Saved" @dismiss="…" />`;

// CuiTransition (#397): the presets, an inline editor swap, and a raw-class list.
type Preset = "fade" | "fade-slide" | "grow" | "collapse";
type Side = "top" | "bottom" | "start" | "end";
const preset = ref<Preset>("fade-slide");
const side = ref<Side>("bottom");
const presetShown = ref(true);

const editing = ref(false);
const name = ref("Quarterly report");

let nextRow = 4;
const rows = ref([
  { id: 1, label: "Design review" },
  { id: 2, label: "Ship the beta" },
  { id: 3, label: "Write the changelog" },
]);
const addRow = () => rows.value.unshift({ id: nextRow++, label: `New task ${nextRow - 1}` });
const removeRow = (id: number) => (rows.value = rows.value.filter((r) => r.id !== id));

const TRANSITION_PROPS: PropRow[] = [
  { name: "preset", type: '"fade" | "fade-slide" | "grow" | "collapse"', default: '"fade"', description: "The motion. fade-slide moves 0.5rem, grow scales from 0.95, collapse animates the height with grid-template-rows" },
  { name: "side", type: '"top" | "bottom" | "start" | "end"', default: '"bottom"', description: "fade-slide only: the edge the content slides in from. start and end follow the writing direction" },
  { name: "duration", type: '"fast" | "base" | "slow"', default: "base", description: "The enter's duration token. The exit always runs over fast" },
  { name: "mode", type: '"in-out" | "out-in"', description: "Passed to Vue's <Transition>: how swapped content takes turns" },
  { name: "appear", type: "boolean", default: "false", description: "Also play the enter on first render" },
  { name: "@before-enter, @after-enter, @before-leave, @after-leave …", type: "Vue transition events", description: "Passed through to <Transition>" },
];

const transitionCode = `<!-- One child, shown with v-if or v-show -->
<CuiTransition preset="fade-slide" side="top">
  <div v-if="open">Panel</div>
</CuiTransition>

<!-- Swapping two blocks: give each a key, and take turns -->
<CuiTransition mode="out-in">
  <CuiInput v-if="editing" key="edit" v-model="name" />
  <span v-else key="view">{{ name }}</span>
</CuiTransition>

<!-- collapse: the element becomes a grid and needs one child to clip -->
<CuiTransition preset="collapse">
  <div v-show="open"><div>Anything, of any height</div></div>
</CuiTransition>`;

const rawCode = `<!-- Without the component: the preset classes, on a raw <Transition>
     or <TransitionGroup>. name is cui-transition-<preset> -->
<!-- A list: collapse takes the row's space with it, so the others glide.
     The row carries .cui-transition-collapse and wraps its content in one child. -->
<TransitionGroup name="cui-transition-collapse" tag="ul">
  <li v-for="row in rows" :key="row.id" class="cui-transition-collapse">
    <div>{{ row.label }}</div>
  </li>
</TransitionGroup>

<!-- Side: .cui-transition-side-top | -bottom | -start | -end on the element -->
<Transition name="cui-transition-fade-slide">
  <p v-if="open" class="cui-transition-side-top">…</p>
</Transition>

/* Tune from CSS */
.panel {
  --cui-duration-base: 300ms;
  --cui-transition-distance: 1rem;
}`;

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
        <p class="text-sm" style="color: var(--cui-text-secondary); margin-top: 0.5rem;">
          What's used many times a day doesn't animate at all. Menu items, listbox options,
          tree nodes and date cells change colour at once as the keyboard crosses them, since a
          fade leaves a trail of half-lit rows when an arrow key repeats. Dragging a slider
          follows the pointer, and stepping it from the keyboard lands at once. Only a click on
          its track glides the thumb across.
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

    <Example title="CuiTransition" :code="transitionCode">
      <CuiStack spacing="4">
        <p class="text-sm" style="color: var(--cui-text-secondary);">
          Content of your own that appears and disappears: wrap it in
          <code class="cui-code">CuiTransition</code> instead of writing the CSS. It enters over
          <code class="cui-code">base</code>, leaves over <code class="cui-code">fast</code> and
          moves by transform and opacity only. Under reduced motion every preset fades where the
          content stands. Hide it with <code class="cui-code">v-show</code> and a quick toggle
          turns straight back from where it was; with <code class="cui-code">v-if</code> the
          returning content is a new element, so it fades in beside the one still leaving.
        </p>
        <CuiFlex gap="4" class="flex-wrap items-end">
          <CuiRadioGroup v-model="preset" label="Preset" orientation="horizontal">
            <CuiRadio value="fade" label="fade" />
            <CuiRadio value="fade-slide" label="fade-slide" />
            <CuiRadio value="grow" label="grow" />
            <CuiRadio value="collapse" label="collapse" />
          </CuiRadioGroup>
          <CuiRadioGroup v-model="side" label="Side (fade-slide)" orientation="horizontal" :disabled="preset !== 'fade-slide'">
            <CuiRadio value="top" label="top" />
            <CuiRadio value="bottom" label="bottom" />
            <CuiRadio value="start" label="start" />
            <CuiRadio value="end" label="end" />
          </CuiRadioGroup>
          <CuiButton variant="outline" @click="presetShown = !presetShown">{{ presetShown ? "Hide" : "Show" }}</CuiButton>
        </CuiFlex>
        <div style="min-height: 6rem;">
          <CuiTransition :preset="preset" :side="side">
            <div v-show="presetShown">
              <CuiAlert color="info" title="Hello">This is the content that comes and goes.</CuiAlert>
            </div>
          </CuiTransition>
        </div>
        <PropTable :props="TRANSITION_PROPS" />
      </CuiStack>
    </Example>

    <Example title="Swapping content in place">
      <CuiStack spacing="3">
        <p class="text-sm" style="color: var(--cui-text-secondary);">
          An inline editor: the text and its input take turns with
          <code class="cui-code">mode="out-in"</code>, each carrying its own
          <code class="cui-code">key</code>.
        </p>
        <CuiFlex gap="3" class="items-center" style="min-height: 3rem;">
          <CuiTransition mode="out-in" preset="fade-slide" side="top">
            <CuiInput v-if="editing" key="edit" v-model="name" label="Name" style="max-width: 18rem;" />
            <strong v-else key="view">{{ name }}</strong>
          </CuiTransition>
          <CuiButton variant="outline" @click="editing = !editing">{{ editing ? "Done" : "Edit" }}</CuiButton>
        </CuiFlex>
      </CuiStack>
    </Example>

    <Example title="The preset classes, on a raw Transition" :code="rawCode">
      <CuiStack spacing="3">
        <p class="text-sm" style="color: var(--cui-text-secondary);">
          Every preset is also a set of classes:
          <code class="cui-code">cui-transition-fade</code>, <code class="cui-code">-fade-slide</code>,
          <code class="cui-code">-grow</code> and <code class="cui-code">-collapse</code>, to use as a
          <code class="cui-code">&lt;Transition name&gt;</code>. That is the way into a
          <code class="cui-code">&lt;TransitionGroup&gt;</code>. Add and remove a row here: the
          others glide into place.
        </p>
        <CuiButton variant="outline" @click="addRow">Add a row</CuiButton>
        <TransitionGroup name="cui-transition-collapse" tag="ul" style="list-style: none; padding: 0; margin: 0; max-width: 24rem;">
          <li v-for="row in rows" :key="row.id" class="cui-transition-collapse">
            <CuiFlex gap="3" class="items-center justify-between" style="padding: 0.375rem 0;">
              <span>{{ row.label }}</span>
              <CuiButton size="xs" variant="ghost" color="error" @click="removeRow(row.id)">Remove</CuiButton>
            </CuiFlex>
          </li>
        </TransitionGroup>
      </CuiStack>
    </Example>

    <Example title="Only transform and opacity animate">
      <CuiStack spacing="3">
        <p class="text-sm" style="color: var(--cui-text-secondary);">
          A width, height or position that animates has to lay the page out and repaint it on
          every frame. A slider's thumb and fill, a progress bar and a toast's countdown move
          by <code class="cui-code">transform</code> instead, so the browser's compositor
          animates them. Drag the slider, or use the arrow keys: the bar follows it.
        </p>
        <CuiSlider v-model="level" label="Level" />
        <CuiProgress :value="level" />
      </CuiStack>
    </Example>

    <CuiCard variant="outline">
      <CuiCardHeader title="Reduced motion" />
      <CuiCardBody>
        <p class="text-sm" style="color: var(--cui-text-secondary);">
          With the system's <strong>Reduce motion</strong> setting on
          (<code class="cui-code">prefers-reduced-motion: reduce</code>), the library removes
          movement and keeps fades. Fades don't cause motion sickness, and they still show
          what changed.
        </p>
        <ul class="text-sm" style="color: var(--cui-text-secondary); margin-top: 0.5rem;">
          <li>Only opacity transitions. A scale, slide or other transform snaps, and colours change instantly, which is still not motion.</li>
          <li>Menus, popovers, tooltips, toasts, modals, slideovers and alerts fade in and out where they stand.</li>
          <li>Durations don't change, so <code class="cui-code">motionDuration()</code> and the exits it times still match the CSS.</li>
          <li>Decorative loops stop: pulses, shimmers, pings and an indeterminate progress bar. A spinner stops spinning and dims.</li>
          <li>Buttons don't shrink when pressed.</li>
          <li>Only the library's components and what's inside them are affected, including content in their slots. Utility classes you put around your own content, such as <code class="cui-code">.cui-typography</code>, a theme or a density, don't count.</li>
        </ul>
        <p class="text-sm" style="color: var(--cui-text-secondary); margin-top: 0.5rem;">
          Hover-only motion, such as a rating star or a colour swatch growing, runs only with a
          fine pointer (<code class="cui-code">@media (hover: hover) and (pointer: fine)</code>).
          On a touch screen, a tap would set the hover state and some browsers would leave it set.
        </p>
        <p class="text-sm" style="color: var(--cui-text-secondary); margin-top: 0.5rem;">
          To try it, turn on Reduce motion in your OS. In Chrome you can also open DevTools,
          then Rendering, and emulate <code class="cui-code">prefers-reduced-motion</code>.
          Then open the menu above.
        </p>
      </CuiCardBody>
    </CuiCard>

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

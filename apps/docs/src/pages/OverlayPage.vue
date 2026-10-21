<script setup lang="ts">
import { ref, useTemplateRef } from "vue";
import { CuiStack, CuiCard, CuiCardBody, CuiButton, CuiFlex, CuiToggle, CuiInput, CuiBadge, useOverlay } from "@itguy614/clean-ui";
import Example from "../components/Example.vue";
import PropTable from "../components/PropTable.vue";

// --- A minimal custom overlay: no CuiModal, just the composable ---
const open = ref(false);
const persistent = ref(false);
const name = ref("");
const lastClosed = ref("never");
const dialogEl = useTemplateRef<HTMLElement>("dialogEl");

const { isVisible, isAnimating, onKeydown, onBackdropClick, closeOverlay } = useOverlay({
  open: () => open.value,
  dialogRef: dialogEl,
  persistent: () => persistent.value,
  allowNested: () => false,
  animationDuration: 150,
  onUpdateOpen: (value) => (open.value = value),
  onClose: () => (lastClosed.value = new Date().toLocaleTimeString()),
});

const overlayCode = `<script setup>
const open = ref(false);
const dialogEl = useTemplateRef("dialogEl");

const { isVisible, isAnimating, onKeydown, onBackdropClick, closeOverlay } = useOverlay({
  open: () => open.value,
  dialogRef: dialogEl,
  persistent: () => false,
  allowNested: () => false,
  animationDuration: 150,
  onUpdateOpen: (value) => (open.value = value),
  onClose: () => {},
});
<\/script>

<template>
  <CuiButton @click="open = true">Open overlay</CuiButton>

  <Teleport to="body">
    <div v-if="isVisible" class="overlay" :class="{ 'is-in': isAnimating }"
         @keydown="onKeydown" @click.self="onBackdropClick">
      <div ref="dialogEl" role="dialog" aria-modal="true"
           aria-labelledby="overlay-title" tabindex="-1" class="panel">
        <h2 id="overlay-title">Rename project</h2>
        <CuiInput v-model="name" label="Project name" />
        <CuiButton @click="closeOverlay">Cancel</CuiButton>
        <CuiButton variant="solid" @click="closeOverlay">Save</CuiButton>
      </div>
    </div>
  </Teleport>
</template>`;

const options = [
  {
    name: "open",
    type: "() => boolean",
    description:
      "Getter for the open state. The composable watches it: true opens (and also on mount, if it starts true), false starts the exit.",
  },
  {
    name: "dialogRef",
    type: "Ref<HTMLElement | undefined> | ShallowRef<HTMLElement | null>",
    description:
      "The dialog panel. It gets focus on open, so give it tabindex=\"-1\", and the focus trap cycles through the focusable elements inside it.",
  },
  {
    name: "persistent",
    type: "() => boolean",
    description:
      "When true, Escape and backdrop clicks are ignored. The overlay still takes the Escape, so a layer beneath doesn't close instead. Calling closeOverlay() still closes it.",
  },
  {
    name: "allowNested",
    type: "() => boolean",
    description: "Meant to control whether this overlay may open on top of another one, but it currently has no effect: nothing blocks or closes the overlay beneath (#285). CuiModal and CuiSlideover forward their own allowNested prop.",
  },
  {
    name: "animationDuration",
    type: "number",
    default: "200",
    description:
      "Exit animation length in ms. The element stays mounted (isVisible) this long after closing begins, then the callbacks run.",
  },
  {
    name: "onUpdateOpen",
    type: "(value: boolean) => void",
    description: "Called with false when the exit finishes. Write it back to your open state, or emit update:visible.",
  },
  {
    name: "onClose",
    type: "() => void",
    description: "Called when the exit finishes, right after onUpdateOpen(false). Known issue: when you write open back, it currently runs a second time (#339).",
  },
];

const returns = [
  {
    name: "isVisible",
    type: "Ref<boolean>",
    description: "Render the overlay while this is true (v-if). It turns on at open and off after the exit animation.",
  },
  {
    name: "isAnimating",
    type: "Ref<boolean>",
    description:
      "Bind your \"shown\" class to it. It turns on a frame after mount, so the enter transition has a rendered start state, and off as soon as closing begins.",
  },
  {
    name: "onKeydown",
    type: "(e: KeyboardEvent) => void",
    description: "The focus trap. Bind it with @keydown on the overlay root: Tab and Shift+Tab wrap between the first and last focusable elements.",
  },
  {
    name: "onBackdropClick",
    type: "() => void",
    description: "Bind it with @click.self on the backdrop. Closes unless persistent.",
  },
  {
    name: "requestClose",
    type: "() => void",
    description: "Close unless persistent: what Escape and the backdrop call.",
  },
  {
    name: "closeOverlay",
    type: "() => void",
    description: "Close unconditionally, ignoring persistent. Use it for Cancel and Save buttons.",
  },
  {
    name: "openOverlay",
    type: "() => void",
    description:
      "Open imperatively. It doesn't change your open state, so normally you set open to true and let the watcher call this.",
  },
];

const overlayStyle = {
  position: "fixed",
  inset: "0",
  zIndex: "var(--cui-z-overlay, 9990)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "1rem",
  background: "color-mix(in srgb, var(--color-surface-950) 50%, transparent)",
  transition: "opacity 150ms ease",
} as const;

const panelStyle = {
  width: "100%",
  maxWidth: "26rem",
  padding: "1.5rem",
  background: "var(--cui-surface-base)",
  border: "1px solid var(--cui-border)",
  borderRadius: "var(--cui-radius-lg, 0.5rem)",
  outline: "none",
  transition: "transform 150ms ease",
} as const;
</script>

<template>
  <CuiStack spacing="8" class="cui-typography">
    <div>
      <h1>Overlay</h1>
      <p class="cui-lead">
        <code class="cui-code">useOverlay()</code> handles the behaviour behind
        <code class="cui-code">CuiModal</code> and <code class="cui-code">CuiSlideover</code>: focus on
        open and back on close, a Tab focus trap, body scroll lock, Escape through the shared layer
        stack, and an exit animation delay.
      </p>
      <p>
        It renders nothing. You supply the markup (a <code class="cui-code">Teleport</code>, a
        backdrop, a dialog element) and bind what it returns. Reach for it when you need an overlay
        the library doesn't ship, such as a command palette, a lightbox or a full-screen takeover,
        and want it to behave like the rest of the library's overlays.
      </p>
    </div>

    <!-- Demo -->
    <Example title="A custom overlay" :code="overlayCode" code-open>
      <CuiStack spacing="4">
        <CuiFlex gap="4" wrap="wrap" align="center">
          <CuiButton @click="open = true">Open overlay</CuiButton>
          <CuiToggle v-model="persistent" label="Persistent" />
        </CuiFlex>
        <p style="margin: 0">
          Last closed: <CuiBadge>{{ lastClosed }}</CuiBadge>
        </p>
      </CuiStack>
    </Example>

    <Teleport to="body">
      <div
        v-if="isVisible"
        class="cui-docs-overlay"
        :style="{ ...overlayStyle, opacity: isAnimating ? 1 : 0 }"
        @keydown="onKeydown"
        @click.self="onBackdropClick"
      >
        <div
          ref="dialogEl"
          role="dialog"
          aria-modal="true"
          aria-labelledby="docs-overlay-title"
          tabindex="-1"
          :style="{ ...panelStyle, transform: isAnimating ? 'none' : 'translateY(0.5rem) scale(0.98)' }"
        >
          <CuiStack spacing="4">
            <h2 id="docs-overlay-title" style="margin: 0; font-size: 1.125rem; font-weight: 600; color: var(--cui-text-emphasis)">
              Rename project
            </h2>
            <p style="margin: 0; color: var(--cui-text-secondary)">
              Built with <code class="cui-code">useOverlay</code>, not <code class="cui-code">CuiModal</code>.
              {{ persistent ? "Persistent is on: Escape and the backdrop won't close it." : "" }}
            </p>
            <CuiInput v-model="name" label="Project name" placeholder="Untitled" />
            <CuiFlex gap="2" justify="end">
              <CuiButton variant="ghost" @click="closeOverlay">Cancel</CuiButton>
              <CuiButton variant="solid" @click="closeOverlay">Save</CuiButton>
            </CuiFlex>
          </CuiStack>
        </div>
      </div>
    </Teleport>

    <CuiCard variant="outline">
      <CuiCardBody>
        <p><strong>Try:</strong></p>
        <ul>
          <li>Open it. Focus moves to the dialog panel itself, which is why the panel has <code class="cui-code">tabindex="-1"</code>.</li>
          <li>Press Tab repeatedly: input, Cancel, Save, then back to the input. Shift+Tab from the input wraps to Save. (Shift+Tab pressed straight after opening, before focus is on a control, can still leave the dialog — #339.)</li>
          <li>Try to scroll the page with the wheel or trackpad. The body is locked, so nothing moves behind the backdrop.</li>
          <li>Press Escape, or click the dimmed backdrop. It fades out, and focus returns to the <em>Open overlay</em> button.</li>
          <li>Turn on <em>Persistent</em> and open it again. Escape and backdrop clicks are now ignored, but Cancel and Save still close it: they call <code class="cui-code">closeOverlay()</code>, which doesn't check <code class="cui-code">persistent</code>.</li>
        </ul>
      </CuiCardBody>
    </CuiCard>

    <!-- API -->
    <div>
      <h2>API</h2>
      <pre class="cui-pre"><code class="cui-code">useOverlay(options: UseOverlayOptions)</code></pre>
      <h3>Options</h3>
      <p>All options are required except <code class="cui-code">animationDuration</code>. The booleans are getters, not refs.</p>
    </div>

    <CuiCard variant="outline">
      <CuiCardBody>
        <PropTable :props="options" />
      </CuiCardBody>
    </CuiCard>

    <div>
      <h3>Returns</h3>
    </div>

    <CuiCard variant="outline">
      <CuiCardBody>
        <PropTable :props="returns" />
      </CuiCardBody>
    </CuiCard>

    <CuiCard variant="outline">
      <CuiCardBody>
        <p><strong>How the pieces work:</strong></p>
        <ul style="margin-bottom: 0">
          <li>
            <strong>Escape</strong> comes from the shared layer stack (<code class="cui-code">useLayerStack</code>),
            registered as a modal layer while the overlay is open. One document listener gives Escape
            to the topmost layer only. A popover or select open inside your overlay closes first, and a
            modal opened from inside it closes before it. Don't add your own Escape listener.
          </li>
          <li>
            <strong>Scroll lock</strong> is reference-counted across all overlays. Stacked overlays
            release the body only when the last one closes. On iOS, where
            <code class="cui-code">overflow: hidden</code> doesn't stop touch scrolling, the body is
            pinned in place and its scroll position restored on unlock.
          </li>
          <li>
            <strong>The focus trap</strong> is a keydown handler, not a sentinel. It wraps Tab at the
            last focusable element and Shift+Tab at the first, so bind
            <code class="cui-code">onKeydown</code> on an element that contains the dialog.
          </li>
          <li>
            <strong>Focus return</strong>: the element focused at open time gets focus back once the
            exit finishes.
          </li>
          <li>
            <strong>Timing</strong>: <code class="cui-code">isAnimating</code> turns on a frame
            after the element mounts (<code class="cui-code">nextTick</code> then
            <code class="cui-code">requestAnimationFrame</code>), so a CSS transition has a painted
            starting frame. Without that, the enter transition would never run.
          </li>
          <li>
            Call it during a component's setup: it registers <code class="cui-code">onMounted</code> /
            <code class="cui-code">onUnmounted</code> hooks, and unmounting releases the scroll lock even
            mid-animation.
          </li>
        </ul>
      </CuiCardBody>
    </CuiCard>

    <!-- When to use it -->
    <div>
      <h2>When to use it</h2>
      <p>
        Use <code class="cui-code">CuiModal</code>, <code class="cui-code">CuiSlideover</code> or
        <code class="cui-code">CuiConfirmDialog</code> when one of them fits. They already add the
        backdrop, sizing, header and footer, and the ARIA wiring. Use
        <code class="cui-code">useOverlay</code> when you need a modal surface with a layout those
        components can't take, and it should still trap focus, lock scrolling and take its turn in
        the Escape stack.
      </p>
      <p style="margin-bottom: 0">
        Don't use it for non-modal panels such as dropdowns, popovers or menus. They shouldn't trap
        focus or lock the page. Use <router-link :to="{ name: 'click-outside' }">useClickOutside</router-link>
        to close them instead.
      </p>
    </div>
  </CuiStack>
</template>

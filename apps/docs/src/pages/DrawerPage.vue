<script setup lang="ts">
import { ref } from "vue";
import {
  CuiAlert,
  CuiBadge,
  CuiButton,
  CuiDrawer,
  CuiFlex,
  CuiFormField,
  CuiInput,
  CuiModalBody,
  CuiModalFooter,
  CuiModalHeader,
  CuiStack,
} from "@itguy614/clean-ui";
import type { CuiDrawerSnapPoint } from "@itguy614/clean-ui";
import DocPage from "../components/DocPage.vue";
import Example from "../components/Example.vue";
import meta from "../meta/drawer";

const usage = ref(false);
const snapping = ref(false);
const snap = ref<CuiDrawerSnapPoint>(0.4);
const scrolling = ref(false);
const keyboard = ref(false);
const persistent = ref(false);
const noDrag = ref(false);
const assembled = ref(false);
const restyled = ref(false);

const rows = Array.from({ length: 30 }, (_, i) => `Item ${i + 1}`);
const email = ref("");
</script>

<template>
  <DocPage :meta="meta">
    <template #intro>
      <CuiAlert color="info" title="Try it on a phone, or with touch emulation">
        <ol class="list-decimal pl-5">
          <li>Open the basic drawer. <strong>Touch:</strong> drag it down from anywhere and let go. <strong>Mouse:</strong> drag the grab handle at the top (the rest of the sheet keeps text selection and clicks).</li>
          <li>Drag it down a little and let go: it springs back. Flick it down quickly, even a short way: it closes.</li>
          <li>Pull it <em>up</em> while it is fully open: it follows your finger less and less, then settles back.</li>
          <li>Open the snap-point drawer. Drag between the three heights, and flick up or down to skip one.</li>
          <li>Open the scrolling drawer. Scroll the list, back to the top, and keep pulling: it only closes once the list is at the top.</li>
          <li>Open the keyboard drawer on a phone and tap the field: the sheet stays above the keyboard.</li>
          <li>Watch the page behind the sheet while you drag: the backdrop fades as the sheet moves away, comes back to full if it springs back, and finishes fading as it closes.</li>
          <li>Turn on Reduce Motion in your OS: the sheet fades instead of sliding, but a drag still follows your finger. Drag it halfway down and let go past the closing point: it fades out where you left it, with no jump back to the top first.</li>
          <li>Press Escape, click the backdrop or the X, with the mouse or the keyboard: each closes it. Dragging is never the only way.</li>
        </ol>
      </CuiAlert>
    </template>

    <template #usage>
      <Example
        code-open
        :code="`<CuiDrawer v-model:visible=&quot;show&quot; title=&quot;Share&quot;>
  <p>Drag me down, or press Escape.</p>
</CuiDrawer>`"
      >
        <CuiButton variant="solid" size="sm" @click="usage = true">Open drawer</CuiButton>
        <CuiDrawer v-model:visible="usage" title="Share">
          <p>Drag the sheet down to close it, flick it, press Escape, click the backdrop or use the X.</p>
        </CuiDrawer>
      </Example>
    </template>

    <template #customization>
      <Example
        class="mt-4"
        title="Restyle with a class or a token"
        :code="`<CuiDrawer v-model:visible=&quot;show&quot; class=&quot;docs-narrow-drawer&quot; title=&quot;Narrow&quot;>...</CuiDrawer>

/* the class lands on the panel (.cui-drawer__panel) */
.docs-narrow-drawer {
  width: 28rem;
  border-radius: 1.5rem 1.5rem 0 0;
}

/* or every drawer on the page */
:root {
  --cui-drawer-width: 28rem;
}`"
      >
        <CuiButton variant="outline" size="sm" @click="restyled = true">Open</CuiButton>
        <CuiDrawer v-model:visible="restyled" class="docs-narrow-drawer" title="Narrow">
          <p>A class passed to CuiDrawer lands on its panel, and wins over its width with no <code>!important</code>.</p>
        </CuiDrawer>
      </Example>
      <p class="mt-4 text-sm text-surface-600 dark:text-surface-400">
        <code>--cui-drawer-width</code>, <code>--cui-drawer-height</code> and
        <code>--cui-drawer-radius</code> restyle every drawer beneath where they are set. The drawer
        teleports to <code>&lt;body&gt;</code>, so a token reaches it from <code>:root</code> or
        <code>body</code>, or from a class on the drawer itself, not from a container around the tag.
      </p>
    </template>

    <template #accessibility>
      <p class="text-surface-700 dark:text-surface-300">
        A drawer is a modal dialog that arrives from the bottom: <code>role="dialog"</code> with
        <code>aria-modal="true"</code>, on the same <code>useOverlay</code> as <code>CuiModal</code>.
      </p>
      <ul class="list-disc pl-5 text-surface-700 dark:text-surface-300">
        <li>On open, focus moves to the panel; on close it returns to the control that opened it. Tab and Shift+Tab wrap inside it, and background scrolling is locked.</li>
        <li><strong>Dragging is never the only way to close it.</strong> Escape, the backdrop and the X button (in simple mode, or a <code>CuiModalHeader</code> you assemble) all close it, and each works without a pointer. <code>persistent</code> blocks Escape, the backdrop and a drag that would close it (it can still be dragged between snap points); the X still closes.</li>
        <li>The grab handle is decorative (<code>aria-hidden</code>), not a control. A screen reader or keyboard user never needs it.</li>
        <li>With <code>title</code> set, the dialog is labelled by its title. Assembling the sheet yourself, give it an <code>aria-label</code>, which lands on the panel.</li>
        <li>Under <code>prefers-reduced-motion</code> the sheet fades rather than slides; a drag still follows the finger, since that is direct manipulation, not animation, and a sheet dismissed after a drag fades out where the finger left it. A snap point is still a resting place. The backdrop fade is an opacity change, so it stays.</li>
        <li>A drag never starts on a text field, a select or anything marked <code>data-cui-no-drag</code>, and a click that ends a drag is swallowed rather than pressing whatever was under the finger.</li>
        <li>Touch zoom still works inside the sheet (<code>touch-action: pinch-zoom</code>), and a scrolling region keeps its own native panning.</li>
      </ul>
    </template>

    <template #extra>
      <CuiAlert color="warning" title="The 500ms open is a documented exception to the 300ms ceiling" class="mb-6">
        The sheet crosses most of the screen on <code>--cui-ease-drawer</code>, the iOS sheet curve,
        over twice <code>--cui-duration-slow</code> (500ms) to match a native sheet, and a shorter run
        reads as a snap. It is the one open in the library over the ceiling (#268); the exit stays on
        <code>--cui-duration-fast</code>. While a finger is down the sheet follows it directly (a
        <code>transform</code> written onto the panel, never a custom property, never Vue state), so a
        long list inside does not lag the drag.
      </CuiAlert>
      <CuiStack spacing="2" class="mb-6">
        <h2 class="text-2xl font-semibold">How the gesture decides</h2>
        <ul class="list-disc pl-5 text-surface-700 dark:text-surface-300">
          <li><strong>Release:</strong> faster than 0.11 px/ms over the drag closes it (or moves one snap point) however short it was. Slower, it goes to the nearest snap point, or closes once pulled past 40% of the way.</li>
          <li><strong>The backdrop follows the sheet:</strong> its opacity is written straight onto the backdrop as you drag, scaled from its own (<code>backdrop-opacity</code>) to nothing across the distance from the lowest snap point to closed. On release it settles with the sheet: back to full on a spring-back, to zero on a dismissal. Inside a <code>CuiSlideoverStack</code> the backdrop is the stack's, one for the whole group, so only a drawer that is the only panel open fades it; a drawer open with others leaves it alone.</li>
          <li><strong>Pulling past fully open</strong> is damped: the sheet moves less the further you pull.</li>
          <li><strong>Scroll versus drag:</strong> a drag that starts in scrolled content is a scroll. Only at the top of the content does a pull close the sheet, and for 100ms after the content last scrolled no drag starts, so a fast scroll past the top does not dismiss it.</li>
          <li><strong>One finger:</strong> the pointer is captured once the drag starts, and a second touch is ignored.</li>
          <li><strong>Mouse:</strong> only from the grab handle. Touch and pen drag from anywhere that is not a field.</li>
          <li><strong>Keyboard:</strong> with a soft keyboard open, the sheet is anchored to the visual viewport and held to the room left, so a focused field is never covered.</li>
        </ul>
      </CuiStack>
    </template>

    <template #examples>
      <Example
        title="Snap points"
        :code="`<CuiDrawer v-model:visible=&quot;show&quot; v-model:active-snap-point=&quot;snap&quot; :snap-points=&quot;[0.4, 0.7, 1]&quot; title=&quot;Snap points&quot;>...</CuiDrawer>`"
      >
        <CuiFlex gap="3" class="flex-wrap items-center">
          <CuiButton variant="outline" size="sm" @click="snapping = true">Open</CuiButton>
          <CuiBadge variant="subtle">Resting at {{ snap }}</CuiBadge>
        </CuiFlex>
        <CuiDrawer v-model:visible="snapping" v-model:active-snap-point="snap" :snap-points="[0.4, 0.7, 1]" title="Snap points">
          <p>Fractions of the viewport height (0.4, 0.7, 1) or px (320, "320px"). Drag between them, flick to skip one, or drag down from the lowest to close.</p>
        </CuiDrawer>
      </Example>

      <Example
        class="mt-6"
        title="Scrolling content"
        :code="`<CuiDrawer v-model:visible=&quot;show&quot; title=&quot;Scrolling&quot;>
  <ul><li v-for=&quot;row in rows&quot;>{{ row }}</li></ul>
</CuiDrawer>`"
      >
        <CuiButton variant="outline" size="sm" @click="scrolling = true">Open</CuiButton>
        <CuiDrawer v-model:visible="scrolling" title="Scrolling" :snap-points="[0.6]">
          <ul class="m-0 list-none p-0">
            <li v-for="row in rows" :key="row" class="border-b border-surface-200 py-3 dark:border-surface-800">{{ row }}</li>
          </ul>
        </CuiDrawer>
      </Example>

      <Example
        class="mt-6"
        title="A field and the keyboard"
        :code="`<CuiDrawer v-model:visible=&quot;show&quot; title=&quot;Sign up&quot;>
  <CuiInput v-model=&quot;email&quot; label=&quot;Email&quot; />
</CuiDrawer>`"
      >
        <CuiButton variant="outline" size="sm" @click="keyboard = true">Open</CuiButton>
        <CuiDrawer v-model:visible="keyboard" title="Sign up">
          <CuiFormField label="Email">
            <CuiInput v-model="email" type="email" placeholder="you@example.com" />
          </CuiFormField>
        </CuiDrawer>
      </Example>

      <Example
        class="mt-6"
        title="Assembled from sub-components"
        :code="`<CuiDrawer v-model:visible=&quot;show&quot; aria-label=&quot;Confirm&quot;>
  <CuiModalHeader title=&quot;Delete item?&quot; @close=&quot;show = false&quot; />
  <CuiModalBody>This cannot be undone.</CuiModalBody>
  <CuiModalFooter><CuiButton @click=&quot;show = false&quot;>Cancel</CuiButton></CuiModalFooter>
</CuiDrawer>`"
      >
        <CuiButton variant="outline" size="sm" @click="assembled = true">Open</CuiButton>
        <CuiDrawer v-model:visible="assembled" aria-label="Confirm">
          <CuiModalHeader title="Delete item?" @close="assembled = false" />
          <CuiModalBody>This cannot be undone.</CuiModalBody>
          <CuiModalFooter>
            <CuiButton variant="ghost" @click="assembled = false">Cancel</CuiButton>
            <CuiButton variant="solid" color="error" @click="assembled = false">Delete</CuiButton>
          </CuiModalFooter>
        </CuiDrawer>
      </Example>

      <Example
        class="mt-6"
        title="Persistent, and no dragging"
        :code="`<CuiDrawer v-model:visible=&quot;show&quot; persistent title=&quot;Persistent&quot;>...</CuiDrawer>
<CuiDrawer v-model:visible=&quot;show&quot; no-drag title=&quot;Fixed&quot;>...</CuiDrawer>`"
      >
        <CuiFlex gap="3" class="flex-wrap">
          <CuiButton variant="outline" size="sm" @click="persistent = true">Persistent</CuiButton>
          <CuiButton variant="outline" size="sm" @click="noDrag = true">No drag</CuiButton>
        </CuiFlex>
        <CuiDrawer v-model:visible="persistent" persistent title="Persistent">
          <p>Escape, the backdrop and a drag down do not close it. Use the X.</p>
        </CuiDrawer>
        <CuiDrawer v-model:visible="noDrag" no-drag title="No drag">
          <p>It closes by Escape, the backdrop and the X only.</p>
        </CuiDrawer>
      </Example>
    </template>
  </DocPage>
</template>

<style>
.docs-narrow-drawer {
  width: 28rem;
  border-radius: 1.5rem 1.5rem 0 0;
}
</style>

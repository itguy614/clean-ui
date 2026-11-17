<script setup lang="ts">
import { ref } from "vue";
import {
  CuiAlert,
  CuiButton,
  CuiFlex,
  CuiFormField,
  CuiInput,
  CuiSlideover,
  CuiSlideoverStack,
  CuiStack,
  CuiTextarea,
  CuiToggle,
} from "@itguy614/clean-ui";
import DocPage from "../components/DocPage.vue";
import Example from "../components/Example.vue";
import meta from "../meta/slideover-stack";

// Modal stack: three panels, each opened from the one beneath.
const levels = ref([false, false, false]);
const pushInward = ref(true);
const allActive = ref(false);

// Co-active: a form, and a history of it that stays interactive beside it.
const formOpen = ref(false);
const historyOpen = ref(false);
const title = ref("Quarterly report");
const notes = ref("");
const history = ["Quarterly report", "Q3 report", "Draft"];
// Whether History is declared inside the Edit panel (its child) or beside it (a sibling).
const nestHistory = ref(true);

// Peek: the same stack, always peeking.
const peeks = ref([false, false, false, false]);
</script>

<template>
  <DocPage :meta="meta">
    <template #intro>
      <CuiAlert color="info" title="Try it">
        <ol class="list-decimal pl-5">
          <li><strong>Modal stack:</strong> open panel 1, then open 2 from inside it, then 3. The newest panel enters at the right edge and the ones already open slide inward to make room, all edge to edge, with a gap always left on the left. Close the top one: it leaves through the right edge and the others slide back. Narrow your window and open all three: they narrow together, then fall back to peeking.</li>
          <li>Turn off <strong>Push existing panels inward</strong> (<code>push="outward"</code>) and reopen: now the first panel stays at the edge and each new one attaches on the inner side.</li>
          <li>Turn on <strong>All panels stay active</strong> (<code>:modal="false"</code> on the stack) and open all three: none goes inert, Tab moves freely between them, and Escape closes the panel you are in.</li>
          <li>With all three open, try to click or Tab into panel 1: only the top panel responds. Press Escape: only the top closes, and focus goes back to the button you opened it with.</li>
          <li><strong>Co-active:</strong> open the form, then open its history. Both are interactive: click a history row to fill the form, type in the form, and Tab from one to the other.</li>
          <li>With the form focused, press Escape: the panel you are in closes, not the one on top.</li>
          <li><strong>Child panels:</strong> with History open, close Edit report (its X, Escape in it, or the backdrop). History closes with it, leaving through the same edge in the same motion, and focus goes back to the Edit report button. Close History alone: Edit report stays open.</li>
          <li>Turn off <strong>Declare History inside Edit report</strong> and repeat: History is now a sibling, declared next to Edit report, so closing Edit report leaves it open.</li>
          <li>Open all three panels of the first demo and look at the seams: one surface, a hairline between panels, and the soft shadow only on the outer edge, not between them. In the peek cascade each panel casts a small shadow on the one beneath.</li>
          <li>Open a second and a third panel and watch the page behind: the dimming stays as it is, with no flash.</li>
          <li><strong>Peek:</strong> open the cascade and open all four. Each lower panel shows its edge behind the one above; the fourth and deeper share the last offset.</li>
          <li>Turn on Reduce Motion in your OS: panels fade where they stand instead of sliding or re-flowing.</li>
        </ol>
      </CuiAlert>
    </template>

    <template #usage>
      <Example
        code-open
        title="Modal stack"
        :code="`<!-- push: inward (default) | outward; modal=false: every panel stays active -->
<CuiSlideoverStack push=&quot;inward&quot; :modal=&quot;true&quot;>
  <CuiSlideover v-model:visible=&quot;one&quot; title=&quot;One&quot;>
    <CuiButton @click=&quot;two = true&quot;>Open two</CuiButton>
  </CuiSlideover>
  <CuiSlideover v-model:visible=&quot;two&quot; title=&quot;Two&quot;>...</CuiSlideover>
</CuiSlideoverStack>`"
      >
        <CuiFlex gap="4" class="flex-wrap items-center">
          <CuiButton variant="solid" size="sm" @click="levels[0] = true">Open panel 1</CuiButton>
          <CuiToggle v-model="pushInward" label="Push existing panels inward" size="sm" />
          <CuiToggle v-model="allActive" label="All panels stay active" size="sm" />
        </CuiFlex>
        <CuiSlideoverStack :push="pushInward ? 'inward' : 'outward'" :modal="!allActive">
          <CuiSlideover v-for="(_, i) in levels" :key="i" v-model:visible="levels[i]" :title="`Panel ${i + 1}`" size="md">
            <CuiStack spacing="3">
              <p>This is panel {{ i + 1 }}. {{ allActive ? "Every panel in this stack is interactive." : "Only the top panel of a modal stack is interactive." }}</p>
              <CuiButton v-if="i < levels.length - 1" variant="outline" size="sm" @click="levels[i + 1] = true">
                Open panel {{ i + 2 }}
              </CuiButton>
              <p v-else>That is the last one. Press Escape to close it.</p>
            </CuiStack>
          </CuiSlideover>
        </CuiSlideoverStack>
      </Example>
    </template>

    <template #examples>
      <Example
        title="Co-active: a form and its history"
        :code="`<CuiSlideoverStack>
  <CuiSlideover v-model:visible=&quot;formOpen&quot; title=&quot;Edit report&quot;>
    ...
    <!-- inside the form: its child, closes with it. Move it out for a sibling -->
    <CuiSlideover v-model:visible=&quot;historyOpen&quot; :modal=&quot;false&quot; title=&quot;History&quot;>...</CuiSlideover>
  </CuiSlideover>
</CuiSlideoverStack>`"
      >
        <CuiFlex gap="4" class="flex-wrap items-center">
          <CuiButton variant="outline" size="sm" @click="formOpen = true">Edit report</CuiButton>
          <CuiToggle v-model="nestHistory" label="Declare History inside Edit report" size="sm" />
        </CuiFlex>
        <CuiSlideoverStack>
          <CuiSlideover v-model:visible="formOpen" title="Edit report" size="md">
            <CuiStack spacing="3">
              <CuiFormField label="Title"><CuiInput v-model="title" /></CuiFormField>
              <CuiFormField label="Notes"><CuiTextarea v-model="notes" :rows="4" /></CuiFormField>
              <CuiFlex gap="2">
                <CuiButton variant="outline" size="sm" @click="historyOpen = true">Show history</CuiButton>
              </CuiFlex>
            </CuiStack>
            <!-- Declared in the form's content: History is its child, and closes with it. -->
            <CuiSlideover v-if="nestHistory" v-model:visible="historyOpen" :modal="false" title="History" size="sm">
              <CuiStack spacing="2">
                <p>Click a version to put its title in the form.</p>
                <CuiButton v-for="h in history" :key="h" variant="ghost" size="sm" @click="title = h">{{ h }}</CuiButton>
              </CuiStack>
            </CuiSlideover>
          </CuiSlideover>
          <!-- Declared beside it: a sibling, independent of the form. -->
          <CuiSlideover v-if="!nestHistory" v-model:visible="historyOpen" :modal="false" title="History" size="sm">
            <CuiStack spacing="2">
              <p>Click a version to put its title in the form.</p>
              <CuiButton v-for="h in history" :key="h" variant="ghost" size="sm" @click="title = h">{{ h }}</CuiButton>
            </CuiStack>
          </CuiSlideover>
        </CuiSlideoverStack>
      </Example>

      <Example
        class="mt-6"
        title="Peek: a cascade"
        :code="`<CuiSlideoverStack mode=&quot;peek&quot; :peek-offset=&quot;40&quot; :max-peek=&quot;3&quot;>...</CuiSlideoverStack>`"
      >
        <CuiButton variant="outline" size="sm" @click="peeks[0] = true">Open the cascade</CuiButton>
        <CuiSlideoverStack mode="peek">
          <CuiSlideover v-for="(_, i) in peeks" :key="i" v-model:visible="peeks[i]" :title="`Layer ${i + 1}`" size="md">
            <CuiStack spacing="3">
              <p>Layer {{ i + 1 }}.</p>
              <CuiButton v-if="i < peeks.length - 1" variant="outline" size="sm" @click="peeks[i + 1] = true">Go deeper</CuiButton>
            </CuiStack>
          </CuiSlideover>
        </CuiSlideoverStack>
      </Example>
    </template>

    <template #extra>
      <CuiStack spacing="2" class="mb-6">
        <h2 class="text-2xl font-semibold">Which panels are interactive</h2>
        <p class="text-surface-700 dark:text-surface-300">
          Walk from the top panel down. The top panel is always active, and so is each one beneath
          it while the panel above was opened co-active (<code>:modal="false"</code>). The walk
          stops at the first modal panel, which is active too. Everything beneath that is
          <code>inert</code> and <code>aria-hidden</code>, and the single shared backdrop sits just
          behind the lowest active panel.
        </p>
        <ul class="list-disc pl-5 text-surface-700 dark:text-surface-300">
          <li><code>1 modal, 2 co-active, 3 co-active</code>: all three are interactive; the backdrop is behind 1.</li>
          <li><code>1 modal, 2 co-active, 3 modal</code>: 3 is modal, so 1 and 2 are inert; the backdrop is behind 3.</li>
        </ul>
        <p class="text-surface-700 dark:text-surface-300">
          <code>modal</code> on the stack (default <code>true</code>) is every panel's default;
          <code>:modal="false"</code> makes all of them co-active, so the active set is the whole
          stack and the backdrop sits behind the lowest panel. A panel's own <code>modal</code>
          prop still wins when set: a modal panel in an all-active stack bounds the active set as
          usual. Unset on both, a panel is modal, as it is outside a stack.
        </p>
        <p class="text-surface-700 dark:text-surface-300">
          Escape closes the topmost active panel, unless it is <code>persistent</code>, in which case
          nothing closes. In a co-active group, if focus is in a lower active panel, Escape closes the
          focused panel instead. A click on the backdrop closes the topmost panel the same way.
        </p>
      </CuiStack>

      <CuiStack spacing="2" class="mb-6">
        <h2 class="text-2xl font-semibold">Child panels</h2>
        <p class="text-surface-700 dark:text-surface-300">
          A <code>CuiSlideover</code> or <code>CuiDrawer</code> declared inside another panel's
          content (its slot) is that panel's child, by the component tree, even though both teleport
          to the body. Closing the parent, by any route (its <code>visible</code>, Escape, the
          backdrop, the X), closes its open children in the same tick, newest first, so their exits
          play as one motion with the parent's. Each child emits its own <code>update:visible</code>
          (false) and <code>close</code>, before its parent's, so your flags stay in sync. Focus returns to the
          parent's opener, since the child's own opener lived inside the parent. Closing a child
          never closes its parent, and a sibling, declared next to the parent, is independent in
          both directions. It works the same inside or outside a stack, and nests as deep as you like.
        </p>
        <p class="text-surface-700 dark:text-surface-300">
          A child is only rendered while its parent is open, so a child's flag opens nothing while
          the parent is closed. If it is still true when the parent opens, the child opens with it.
          The cascade resets the flag when the parent closes, so that does not happen by accident.
          There is no way to let a nested child outlive its parent: declare it beside the parent
          instead.
        </p>
      </CuiStack>

      <CuiStack spacing="2" class="mb-6">
        <h2 class="text-2xl font-semibold">Backdrop and shadows</h2>
        <ul class="list-disc pl-5 text-surface-700 dark:text-surface-300">
          <li>The stack draws <strong>one backdrop</strong>, for as long as any panel is open, always just behind the bottom panel. It fades in with the first panel and out with the last; opening or closing the others, or a change of the active set, never fades it, remounts it, moves it a layer or doubles it up. Its opacity, blur and gradient come from the lowest active panel's backdrop props.</li>
          <li>A panel <strong>covered</strong> by another (beneath the active set) is dimmed by its own scrim, which fades in by opacity over the incoming panel's slide and out over the same easing, so the dimming is a ramp, never a step. Settled, it is as dim as the backdrop made it. The scrim takes the backdrop's color and opacity; a covered panel does not get its blur, gradient or image.</li>
          <li>Attached panels are <strong>one surface</strong>: no shadow between them, a hairline (<code>--cui-border</code>, or <code>--cui-slideover-border</code>) at each seam, and the soft shadow only on the outer edge of the group. When the outer edge changes hands (<code>push="outward"</code>), the shadow and hairline cross-fade by opacity.</li>
          <li>Peeking panels overlap, so each keeps a smaller shadow (<code>--cui-shadow-md</code>) onto the one beneath. A slideover outside a stack looks exactly as it always did.</li>
        </ul>
      </CuiStack>

      <CuiStack spacing="2" class="mb-6">
        <h2 class="text-2xl font-semibold">Layout</h2>
        <ul class="list-disc pl-5 text-surface-700 dark:text-surface-300">
          <li><strong>Attach:</strong> panels keep their natural width and sit edge to edge from the docked side. The gap a lone slideover leaves (<code>gap</code>, 32px) is never used.</li>
          <li><strong>Push:</strong> <code>push="inward"</code> (the default) puts the newest panel at the docked edge and slides the ones already open toward the open side to make room, so the stack reads oldest to newest from the open side to the edge. <code>push="outward"</code> leaves the older panels where they are and attaches the newest on the open side. A closing panel reverses either: it leaves through the docked edge and the rest slide back. Left-docked stacks mirror this.</li>
          <li><strong>Narrow to fit:</strong> once the group would reach the gap, every panel narrows by the same proportion so the group exactly fills the viewport minus the gap.</li>
          <li><strong>Peek:</strong> below <code>minWidth</code>, or on a viewport narrower than <code>peekBelow</code>, panels overlap and each lower panel's edge shows <code>peekOffset</code> beyond the one above. Past <code>maxPeek</code> layers the offset stops growing.</li>
          <li><strong>Same side only:</strong> a stack is all-right or all-left. Panels on different sides still get the shared backdrop, inert and z-order, but the layout only arranges the first panel's side, and a development warning says so. Top and bottom panels join the coordination without any layout.</li>
        </ul>
        <p class="text-surface-700 dark:text-surface-300">
          Narrowing, sliding and peeking animate on <code>transform</code> only. The new layout is applied at
          once, and each panel that moved is then played from where it was drawn to where it now is
          (a translate and a scale about its docked edge), over <code>--cui-duration-slow</code>. A
          width transition would animate layout on every frame; this stays on the compositor. Sliding
          alone is a pure translate. The catch: during that quarter second, text in a panel that is
          narrowing is scaled with it.
        </p>
      </CuiStack>

      <CuiStack spacing="2" class="mb-6">
        <h2 class="text-2xl font-semibold">The shared core</h2>
        <p class="text-surface-700 dark:text-surface-300">
          The stack is a thin layer over an overlay-agnostic coordinator
          (<code>useOverlayStackProvider</code>, joined through <code>useOverlayStackContext</code>)
          that owns depth, z-order, the one backdrop, <code>inert</code> and which panel an Escape or
          a backdrop click means. <code>CuiSlideover</code> and <code>CuiDrawer</code> both join it
          while open, so a drawer inside a stack gets the same ordering, backdrop and inert, with no
          stack layout of its own. Outside a stack nothing changes: an overlay with no stack around
          it does a single optional inject and behaves exactly as before. The Escape stack and the
          page scroll lock are still the shared ones, so the page locks once and unlocks when the
          last panel closes.
        </p>
      </CuiStack>
    </template>
  </DocPage>
</template>

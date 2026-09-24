<script setup lang="ts">
import { ref } from "vue";
import {
  CuiButton,
  CuiCheckbox,
  CuiFlex,
  CuiFormField,
  CuiInput,
  CuiModalBody,
  CuiModalFooter,
  CuiModalHeader,
  CuiSelect,
  CuiSlideover,
  CuiStack,
  CuiTextarea,
} from "@itguy614/clean-ui";
import DocPage from "../components/DocPage.vue";
import Example from "../components/Example.vue";
import meta from "../meta/slideover";

const usage = ref(false);
const leftPanel = ref(false);
const topPanel = ref(false);
const bottomPanel = ref(false);
const sized = ref({ sm: false, lg: false, xl: false, full: false, custom: false });
const withFooter = ref(false);
const scrolling = ref(false);
const persistent = ref(false);
const blurred = ref(false);
const formPanel = ref(false);
const settingsPanel = ref(false);

// Form data
const formName = ref("");
const formEmail = ref("");
const formRole = ref<string | null>(null);
const formBio = ref("");
const formAgree = ref(false);
</script>

<template>
  <DocPage :meta="meta">
    <template #usage>
      <Example
        code-open
        :code="`<CuiSlideover v-model:visible=&quot;show&quot; title=&quot;Detail Panel&quot;>
  <p>Click the X, press Escape, or click the backdrop to close.</p>
</CuiSlideover>`"
      >
        <CuiButton variant="solid" size="sm" @click="usage = true">Open Right</CuiButton>
        <CuiSlideover v-model:visible="usage" title="Detail Panel">
          <p>This is a basic slideover from the right edge. Click the X, press Escape, or click the backdrop to close.</p>
        </CuiSlideover>
      </Example>
    </template>

    <template #accessibility>
      <p class="text-surface-700 dark:text-surface-300">
        A slideover is a modal dialog that happens to arrive from an edge. The panel is a
        <code>role="dialog"</code> with <code>aria-modal="true"</code>, and it runs the same
        <code>useOverlay</code> composable as <code>CuiModal</code> — so everything below is
        true of both, and a reader who has learned one has learned the other.
      </p>
      <ul class="list-disc pl-5 text-surface-700 dark:text-surface-300">
        <li>
          On open, focus moves to the panel; on close it is returned to the control that opened
          it. Tab and Shift+Tab wrap inside the panel while it is open.
        </li>
        <li>
          Escape closes, unless <code>persistent</code> is set — which blocks Escape and the
          backdrop click together. The X button is unaffected, so pair it with
          <code>noCloseButton</code> and an explicit footer action.
        </li>
        <li>Background scrolling is locked while the panel is open.</li>
        <li>
          <code>titleAs</code> sets the element the title renders as, defaulting to
          <code>h2</code>. It is forwarded to <code>CuiModalHeader</code>, so it works in simple
          mode and when you assemble the header yourself.
        </li>
        <li>
          Because it is modal, a slideover is the wrong shape for a persistent sidebar or a
          navigation rail — those should stay in the page, reachable by Tab, rather than
          trapping focus and locking the scroll.
        </li>
        <li>
          The panel has no accessible name today: <code>aria-labelledby</code> is emitted, but
          the id it names is never put on the title element. Add your own
          <code>aria-label</code> if the name matters to you.
        </li>
      </ul>
    </template>

    <template #examples>
        <!-- Sides -->
        <Example title="All Sides" :code="`<CuiSlideover v-model:visible=&quot;show&quot; title=&quot;Right Panel&quot; side=&quot;right&quot;>...</CuiSlideover>
<CuiSlideover v-model:visible=&quot;show&quot; title=&quot;Left Panel&quot; side=&quot;left&quot;>...</CuiSlideover>
<CuiSlideover v-model:visible=&quot;show&quot; title=&quot;Top Panel&quot; side=&quot;top&quot;>...</CuiSlideover>
<CuiSlideover v-model:visible=&quot;show&quot; title=&quot;Bottom Panel&quot; side=&quot;bottom&quot;>...</CuiSlideover>`">
          <CuiFlex gap="3" class="flex-wrap">
            <CuiButton variant="outline" size="sm" @click="usage = true">Right (default)</CuiButton>
            <CuiButton variant="outline" size="sm" @click="leftPanel = true">Left</CuiButton>
            <CuiButton variant="outline" size="sm" @click="topPanel = true">Top</CuiButton>
            <CuiButton variant="outline" size="sm" @click="bottomPanel = true">Bottom</CuiButton>
          </CuiFlex>
          <CuiSlideover v-model:visible="leftPanel" side="left" title="Left Panel">
            <p>Slides in from the left edge. Good for navigation drawers or secondary sidebars.</p>
          </CuiSlideover>
          <CuiSlideover v-model:visible="topPanel" side="top" title="Top Panel">
            <p>Slides down from the top. Useful for notifications or search panels.</p>
          </CuiSlideover>
          <CuiSlideover v-model:visible="bottomPanel" side="bottom" title="Bottom Panel">
            <p>Slides up from the bottom. Common on mobile for action sheets or detail drawers.</p>
          </CuiSlideover>
        </Example>

        <!-- Sizes -->
        <Example title="Sizes (horizontal)" :code="`<CuiSlideover v-model:visible=&quot;show&quot; title=&quot;Small Panel&quot; size=&quot;sm&quot;>...</CuiSlideover>
<CuiSlideover v-model:visible=&quot;show&quot; title=&quot;Large Panel&quot; size=&quot;lg&quot;>...</CuiSlideover>
<CuiSlideover v-model:visible=&quot;show&quot; title=&quot;Custom Width&quot; size=&quot;600px&quot;>...</CuiSlideover>`">
          <CuiFlex gap="3" class="flex-wrap">
            <CuiButton variant="outline" size="sm" @click="sized.sm = true">Small (20rem)</CuiButton>
            <CuiButton variant="outline" size="sm" @click="usage = true">Medium (default)</CuiButton>
            <CuiButton variant="outline" size="sm" @click="sized.lg = true">Large (36rem)</CuiButton>
            <CuiButton variant="outline" size="sm" @click="sized.xl = true">XL (48rem)</CuiButton>
            <CuiButton variant="outline" size="sm" @click="sized.full = true">Full</CuiButton>
            <CuiButton variant="outline" size="sm" @click="sized.custom = true">Custom (600px)</CuiButton>
          </CuiFlex>
          <CuiSlideover v-model:visible="sized.sm" title="Small Panel" size="sm">
            <p>A narrow panel (20rem / 320px). Good for quick actions or simple lists.</p>
          </CuiSlideover>
          <CuiSlideover v-model:visible="sized.lg" title="Large Panel" size="lg">
            <p>A wider panel (36rem / 576px). Room for forms and detailed content.</p>
          </CuiSlideover>
          <CuiSlideover v-model:visible="sized.xl" title="XL Panel" size="xl">
            <p>Extra wide (48rem / 768px). Good for split views or data-heavy panels.</p>
          </CuiSlideover>
          <CuiSlideover v-model:visible="sized.full" title="Full Width" size="full">
            <p>Takes up the full viewport width. Like a page takeover.</p>
          </CuiSlideover>
          <CuiSlideover v-model:visible="sized.custom" title="Custom Width" size="600px">
            <p>A custom width of 600px passed as a string.</p>
          </CuiSlideover>
        </Example>

        <!-- With Footer -->
        <Example title="With Footer Actions" :code="`<CuiSlideover v-model:visible=&quot;show&quot;>
  <CuiModalHeader title=&quot;Edit&quot; @close=&quot;show = false&quot; />
  <CuiModalBody>...</CuiModalBody>
  <CuiModalFooter>
    <CuiButton variant=&quot;ghost&quot;>Cancel</CuiButton>
    <CuiButton variant=&quot;solid&quot;>Save</CuiButton>
  </CuiModalFooter>
</CuiSlideover>`">
          <CuiButton variant="solid" size="sm" @click="withFooter = true">Open with Footer</CuiButton>
          <CuiSlideover v-model:visible="withFooter">
            <CuiModalHeader title="Edit Settings" @close="withFooter = false" />
            <CuiModalBody>
              <p>The slideover reuses CuiModalHeader, CuiModalBody, and CuiModalFooter — the same sub-components from CuiModal.</p>
            </CuiModalBody>
            <CuiModalFooter>
              <CuiButton variant="ghost" color="secondary" @click="withFooter = false">Cancel</CuiButton>
              <CuiButton variant="solid" color="success" @click="withFooter = false">Save</CuiButton>
            </CuiModalFooter>
          </CuiSlideover>
        </Example>

        <!-- Scrolling Body -->
        <Example title="Scrolling Body" :code="`<CuiSlideover v-model:visible=&quot;show&quot; size=&quot;lg&quot;>
  <CuiModalHeader title=&quot;Activity Log&quot; @close=&quot;show = false&quot; />
  <CuiModalBody>
    <p v-for=&quot;i in 20&quot; :key=&quot;i&quot;>Long content entry {{ i }}...</p>
  </CuiModalBody>
  <CuiModalFooter>
    <CuiButton variant=&quot;ghost&quot; @click=&quot;show = false&quot;>Close</CuiButton>
  </CuiModalFooter>
</CuiSlideover>`">
          <CuiButton variant="outline" size="sm" @click="scrolling = true">Open Long Content</CuiButton>
          <CuiSlideover v-model:visible="scrolling" size="lg">
            <CuiModalHeader title="Activity Log" @close="scrolling = false" />
            <CuiModalBody>
              <CuiStack spacing="4">
                <p v-for="i in 20" :key="i">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor
                  incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud
                  exercitation ullamco laboris. Entry {{ i }}.
                </p>
              </CuiStack>
            </CuiModalBody>
            <CuiModalFooter>
              <CuiButton variant="ghost" color="secondary" @click="scrolling = false">Close</CuiButton>
            </CuiModalFooter>
          </CuiSlideover>
        </Example>

        <!-- Persistent -->
        <Example title="Persistent (no Escape/backdrop close)" :code="`<CuiSlideover v-model:visible=&quot;show&quot; persistent>
  <CuiModalHeader title=&quot;Unsaved Changes&quot; no-close-button />
  <CuiModalBody>
    <p>You must choose an option below to continue.</p>
  </CuiModalBody>
  <CuiModalFooter>
    <CuiButton variant=&quot;ghost&quot; @click=&quot;show = false&quot;>Discard</CuiButton>
    <CuiButton variant=&quot;solid&quot; color=&quot;success&quot; @click=&quot;show = false&quot;>Save</CuiButton>
  </CuiModalFooter>
</CuiSlideover>`">
          <CuiButton variant="outline" size="sm" color="warning" @click="persistent = true">Open Persistent</CuiButton>
          <CuiSlideover v-model:visible="persistent" persistent>
            <CuiModalHeader title="Unsaved Changes" no-close-button />
            <CuiModalBody>
              <p>You have unsaved changes. You must choose an option below to continue.</p>
            </CuiModalBody>
            <CuiModalFooter>
              <CuiButton variant="ghost" color="secondary" @click="persistent = false">Discard</CuiButton>
              <CuiButton variant="solid" color="success" @click="persistent = false">Save</CuiButton>
            </CuiModalFooter>
          </CuiSlideover>
        </Example>

        <!-- Blurred Backdrop -->
        <Example title="Blurred Backdrop" :code="`<CuiSlideover
  v-model:visible=&quot;show&quot;
  title=&quot;Blurred Backdrop&quot;
  backdrop-blur=&quot;md&quot;
  :backdrop-opacity=&quot;0.3&quot;
>
  <p>Page content is blurred and dimmed.</p>
</CuiSlideover>`">
          <CuiButton variant="outline" size="sm" @click="blurred = true">Blur + Tint</CuiButton>
          <CuiSlideover
            v-model:visible="blurred"
            title="Blurred Backdrop"
            backdrop-blur="md"
            :backdrop-opacity="0.3"
          >
            <p>The page content behind is blurred and dimmed for focus.</p>
          </CuiSlideover>
        </Example>

        <!-- Form in Slideover -->
        <Example title="Form in Slideover" :code="`<CuiSlideover v-model:visible=&quot;show&quot; size=&quot;lg&quot;>
  <CuiModalHeader title=&quot;Create User&quot; @close=&quot;show = false&quot; />
  <CuiModalBody>
    <CuiStack spacing=&quot;4&quot;>
      <CuiFormField label=&quot;Full Name&quot; required>
        <CuiInput v-model=&quot;formName&quot; placeholder=&quot;John Doe&quot; />
      </CuiFormField>
    </CuiStack>
  </CuiModalBody>
  <CuiModalFooter>
    <CuiButton variant=&quot;ghost&quot; @click=&quot;show = false&quot;>Cancel</CuiButton>
    <CuiButton variant=&quot;solid&quot; color=&quot;success&quot; @click=&quot;show = false&quot;>Create User</CuiButton>
  </CuiModalFooter>
</CuiSlideover>`">
          <CuiButton variant="solid" size="sm" @click="formPanel = true">Create User</CuiButton>
          <CuiSlideover v-model:visible="formPanel" size="lg">
            <CuiModalHeader title="Create User" @close="formPanel = false" />
            <CuiModalBody>
              <CuiStack spacing="4">
                <CuiFormField label="Full Name" required>
                  <CuiInput v-model="formName" placeholder="John Doe" />
                </CuiFormField>
                <CuiFormField label="Email" required>
                  <CuiInput v-model="formEmail" type="email" placeholder="you@example.com" />
                </CuiFormField>
                <CuiFormField label="Role">
                  <CuiSelect v-model="formRole" :options="['Admin', 'Editor', 'Viewer']" placeholder="Select role..." />
                </CuiFormField>
                <CuiFormField label="Bio">
                  <CuiTextarea v-model="formBio" :rows="3" auto-resize placeholder="Brief description..." />
                </CuiFormField>
                <CuiFormField>
                  <CuiCheckbox v-model="formAgree" label="Send welcome email" />
                </CuiFormField>
              </CuiStack>
            </CuiModalBody>
            <CuiModalFooter>
              <CuiButton variant="ghost" color="secondary" @click="formPanel = false">Cancel</CuiButton>
              <CuiButton variant="solid" color="success" @click="formPanel = false">Create User</CuiButton>
            </CuiModalFooter>
          </CuiSlideover>
        </Example>

        <!-- Settings Panel Pattern -->
        <Example title="Settings Panel (left)" :code="`<CuiSlideover v-model:visible=&quot;show&quot; side=&quot;left&quot; size=&quot;sm&quot;>
  <CuiModalHeader title=&quot;Settings&quot; @close=&quot;show = false&quot; />
  <CuiModalBody>
    <CuiStack spacing=&quot;4&quot;>
      <CuiFormField label=&quot;Display Name&quot;>
        <CuiInput model-value=&quot;Kurt Wolf&quot; />
      </CuiFormField>
      <CuiCheckbox :model-value=&quot;true&quot; label=&quot;Enable notifications&quot; />
    </CuiStack>
  </CuiModalBody>
  <CuiModalFooter>
    <CuiButton variant=&quot;ghost&quot; @click=&quot;show = false&quot;>Cancel</CuiButton>
    <CuiButton variant=&quot;solid&quot; @click=&quot;show = false&quot;>Save</CuiButton>
  </CuiModalFooter>
</CuiSlideover>`">
          <CuiButton variant="outline" size="sm" @click="settingsPanel = true">Open Settings</CuiButton>
          <CuiSlideover v-model:visible="settingsPanel" side="left" size="sm">
            <CuiModalHeader title="Settings" @close="settingsPanel = false" />
            <CuiModalBody>
              <CuiStack spacing="4">
                <CuiFormField label="Display Name">
                  <CuiInput model-value="Kurt Wolf" />
                </CuiFormField>
                <CuiFormField label="Language">
                  <CuiSelect :model-value="'en'" :options="[{ value: 'en', label: 'English' }, { value: 'es', label: 'Spanish' }, { value: 'fr', label: 'French' }]" />
                </CuiFormField>
                <CuiCheckbox :model-value="true" label="Enable notifications" />
                <CuiCheckbox :model-value="false" label="Dark mode" />
              </CuiStack>
            </CuiModalBody>
            <CuiModalFooter>
              <CuiButton variant="ghost" color="secondary" @click="settingsPanel = false">Cancel</CuiButton>
              <CuiButton variant="solid" @click="settingsPanel = false">Save</CuiButton>
            </CuiModalFooter>
          </CuiSlideover>
        </Example>
    </template>
  </DocPage>
</template>

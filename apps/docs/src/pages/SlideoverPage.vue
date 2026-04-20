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
import PropTable from "../components/PropTable.vue";
import EventTable from "../components/EventTable.vue";
import Example from "../components/Example.vue";

const basic = ref(false);
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
  <CuiStack spacing="8">
    <div>
      <h1 class="text-4xl font-bold">Slideover</h1>
      <p class="mt-2 text-lg text-surface-600 dark:text-surface-400">
        A panel that slides in from any edge of the viewport. Shares overlay
        behavior with <code class="cui-code">CuiModal</code> (focus trap, scroll lock,
        backdrop) and reuses <code class="cui-code">CuiModalHeader</code>,
        <code class="cui-code">CuiModalBody</code>, and
        <code class="cui-code">CuiModalFooter</code> sub-components.
      </p>
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">CuiSlideover Props</h2>
      <PropTable
        :props="[
          { name: 'v-model:open', type: 'boolean', default: 'false', description: 'Controls visibility' },
          { name: 'side', type: 'right | left | top | bottom', default: 'right', description: 'Which edge the panel slides from' },
          { name: 'size', type: 'sm | md | lg | xl | full | string', default: 'md', description: 'Panel width/height (named or custom CSS value)' },
          { name: 'title', type: 'string', default: '—', description: 'Header title text (simple mode)' },
          { name: 'persistent', type: 'boolean', default: 'false', description: 'Disable Escape and backdrop click closing' },
          { name: 'noCloseButton', type: 'boolean', default: 'false', description: 'Hide the X close button' },
          { name: 'allowNested', type: 'boolean', default: 'false', description: 'Allow stacking on top of another overlay' },
          { name: 'backdropOpacity', type: 'number', default: '0.5', description: 'Backdrop darkness (0–1)' },
          { name: 'backdropBlur', type: 'none | sm | md | lg | string', default: 'none', description: 'Backdrop blur amount' },
          { name: 'backdropColor', type: 'string', default: 'black', description: 'Backdrop color' },
          { name: 'backdropImage', type: 'string', default: '—', description: 'Backdrop image URL' },
          { name: 'backdropGradient', type: 'string', default: '—', description: 'Backdrop CSS gradient' },
          { name: 'hidden', type: 'boolean', default: 'false', description: 'Hide the component (v-show)' },
        ]"
      />
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">Events</h2>
      <EventTable
        :events="[
          { name: 'update:open', payload: 'boolean', description: 'Controls slideover visibility (v-model:open)' },
          { name: 'close', payload: '—', description: 'Fires when the slideover is closed' },
        ]"
      />
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">Examples</h2>
      <CuiStack spacing="6">

        <!-- Basic (right) -->
        <Example title="Basic (Right)" :code="`<CuiSlideover v-model:open=&quot;show&quot; title=&quot;Details&quot;>
  <p>Panel content here.</p>
</CuiSlideover>`">
          <CuiButton variant="solid" size="sm" @click="basic = true">Open Right</CuiButton>
          <CuiSlideover v-model:open="basic" title="Detail Panel">
            <p>This is a basic slideover from the right edge. Click the X, press Escape, or click the backdrop to close.</p>
          </CuiSlideover>
        </Example>

        <!-- Sides -->
        <Example title="All Sides" :code="`<CuiSlideover v-model:open=&quot;show&quot; title=&quot;Right Panel&quot; side=&quot;right&quot;>...</CuiSlideover>
<CuiSlideover v-model:open=&quot;show&quot; title=&quot;Left Panel&quot; side=&quot;left&quot;>...</CuiSlideover>
<CuiSlideover v-model:open=&quot;show&quot; title=&quot;Top Panel&quot; side=&quot;top&quot;>...</CuiSlideover>
<CuiSlideover v-model:open=&quot;show&quot; title=&quot;Bottom Panel&quot; side=&quot;bottom&quot;>...</CuiSlideover>`">
          <CuiFlex gap="3" class="flex-wrap">
            <CuiButton variant="outline" size="sm" @click="basic = true">Right (default)</CuiButton>
            <CuiButton variant="outline" size="sm" @click="leftPanel = true">Left</CuiButton>
            <CuiButton variant="outline" size="sm" @click="topPanel = true">Top</CuiButton>
            <CuiButton variant="outline" size="sm" @click="bottomPanel = true">Bottom</CuiButton>
          </CuiFlex>
          <CuiSlideover v-model:open="leftPanel" side="left" title="Left Panel">
            <p>Slides in from the left edge. Good for navigation drawers or secondary sidebars.</p>
          </CuiSlideover>
          <CuiSlideover v-model:open="topPanel" side="top" title="Top Panel">
            <p>Slides down from the top. Useful for notifications or search panels.</p>
          </CuiSlideover>
          <CuiSlideover v-model:open="bottomPanel" side="bottom" title="Bottom Panel">
            <p>Slides up from the bottom. Common on mobile for action sheets or detail drawers.</p>
          </CuiSlideover>
        </Example>

        <!-- Sizes -->
        <Example title="Sizes (horizontal)" :code="`<CuiSlideover v-model:open=&quot;show&quot; title=&quot;Small Panel&quot; size=&quot;sm&quot;>...</CuiSlideover>
<CuiSlideover v-model:open=&quot;show&quot; title=&quot;Large Panel&quot; size=&quot;lg&quot;>...</CuiSlideover>
<CuiSlideover v-model:open=&quot;show&quot; title=&quot;Custom Width&quot; size=&quot;600px&quot;>...</CuiSlideover>`">
          <CuiFlex gap="3" class="flex-wrap">
            <CuiButton variant="outline" size="sm" @click="sized.sm = true">Small (20rem)</CuiButton>
            <CuiButton variant="outline" size="sm" @click="basic = true">Medium (default)</CuiButton>
            <CuiButton variant="outline" size="sm" @click="sized.lg = true">Large (36rem)</CuiButton>
            <CuiButton variant="outline" size="sm" @click="sized.xl = true">XL (48rem)</CuiButton>
            <CuiButton variant="outline" size="sm" @click="sized.full = true">Full</CuiButton>
            <CuiButton variant="outline" size="sm" @click="sized.custom = true">Custom (600px)</CuiButton>
          </CuiFlex>
          <CuiSlideover v-model:open="sized.sm" title="Small Panel" size="sm">
            <p>A narrow panel (20rem / 320px). Good for quick actions or simple lists.</p>
          </CuiSlideover>
          <CuiSlideover v-model:open="sized.lg" title="Large Panel" size="lg">
            <p>A wider panel (36rem / 576px). Room for forms and detailed content.</p>
          </CuiSlideover>
          <CuiSlideover v-model:open="sized.xl" title="XL Panel" size="xl">
            <p>Extra wide (48rem / 768px). Good for split views or data-heavy panels.</p>
          </CuiSlideover>
          <CuiSlideover v-model:open="sized.full" title="Full Width" size="full">
            <p>Takes up the full viewport width. Like a page takeover.</p>
          </CuiSlideover>
          <CuiSlideover v-model:open="sized.custom" title="Custom Width" size="600px">
            <p>A custom width of 600px passed as a string.</p>
          </CuiSlideover>
        </Example>

        <!-- With Footer -->
        <Example title="With Footer Actions" :code="`<CuiSlideover v-model:open=&quot;show&quot;>
  <CuiModalHeader title=&quot;Edit&quot; @close=&quot;show = false&quot; />
  <CuiModalBody>...</CuiModalBody>
  <CuiModalFooter>
    <CuiButton variant=&quot;ghost&quot;>Cancel</CuiButton>
    <CuiButton variant=&quot;solid&quot;>Save</CuiButton>
  </CuiModalFooter>
</CuiSlideover>`">
          <CuiButton variant="solid" size="sm" @click="withFooter = true">Open with Footer</CuiButton>
          <CuiSlideover v-model:open="withFooter">
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
        <Example title="Scrolling Body" :code="`<CuiSlideover v-model:open=&quot;show&quot; size=&quot;lg&quot;>
  <CuiModalHeader title=&quot;Activity Log&quot; @close=&quot;show = false&quot; />
  <CuiModalBody>
    <p v-for=&quot;i in 20&quot; :key=&quot;i&quot;>Long content entry {{ i }}...</p>
  </CuiModalBody>
  <CuiModalFooter>
    <CuiButton variant=&quot;ghost&quot; @click=&quot;show = false&quot;>Close</CuiButton>
  </CuiModalFooter>
</CuiSlideover>`">
          <CuiButton variant="outline" size="sm" @click="scrolling = true">Open Long Content</CuiButton>
          <CuiSlideover v-model:open="scrolling" size="lg">
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
        <Example title="Persistent (no Escape/backdrop close)" :code="`<CuiSlideover v-model:open=&quot;show&quot; persistent>
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
          <CuiSlideover v-model:open="persistent" persistent>
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
  v-model:open=&quot;show&quot;
  title=&quot;Blurred Backdrop&quot;
  backdrop-blur=&quot;md&quot;
  :backdrop-opacity=&quot;0.3&quot;
>
  <p>Page content is blurred and dimmed.</p>
</CuiSlideover>`">
          <CuiButton variant="outline" size="sm" @click="blurred = true">Blur + Tint</CuiButton>
          <CuiSlideover
            v-model:open="blurred"
            title="Blurred Backdrop"
            backdrop-blur="md"
            :backdrop-opacity="0.3"
          >
            <p>The page content behind is blurred and dimmed for focus.</p>
          </CuiSlideover>
        </Example>

        <!-- Form in Slideover -->
        <Example title="Form in Slideover" :code="`<CuiSlideover v-model:open=&quot;show&quot; size=&quot;lg&quot;>
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
          <CuiSlideover v-model:open="formPanel" size="lg">
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
        <Example title="Settings Panel (left)" :code="`<CuiSlideover v-model:open=&quot;show&quot; side=&quot;left&quot; size=&quot;sm&quot;>
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
          <CuiSlideover v-model:open="settingsPanel" side="left" size="sm">
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

      </CuiStack>
    </div>
  </CuiStack>
</template>

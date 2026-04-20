<script setup lang="ts">
import { ref } from "vue";
import {
  CuiButton,
  CuiCheckbox,
  CuiFlex,
  CuiFormField,
  CuiInput,
  CuiModal,
  CuiModalHeader,
  CuiModalBody,
  CuiModalFooter,
  CuiSelect,
  CuiStack,
  CuiTextarea,
} from "@itguy614/clean-ui";
import PropTable from "../components/PropTable.vue";
import EventTable from "../components/EventTable.vue";
import Example from "../components/Example.vue";

const basic = ref(false);
const sized = ref({ sm: false, lg: false, xl: false, full: false, custom: false });
const withFooter = ref(false);
const scrolling = ref(false);
const persistent = ref(false);
const noClose = ref(false);
const blurred = ref(false);
const blurLight = ref(false);
const blurHeavy = ref(false);
const colored = ref(false);
const gradient = ref(false);
const transparent = ref(false);
const imageBackdrop = ref(false);
const imageBlur = ref(false);
const formModal = ref(false);
const confirmModal = ref(false);

// SVG backdrop images as data URIs (built in script to avoid template encoding issues)
const gridSvg = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><rect width="40" height="40" fill="none"/><path d="M40 0H0v40" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="0.5"/></svg>')}`;
const dotSvg = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"><circle cx="10" cy="10" r="1.5" fill="rgba(255,255,255,0.25)"/></svg>')}`;

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
      <h1 class="text-4xl font-bold">Modal</h1>
      <p class="mt-2 text-lg text-surface-600 dark:text-surface-400">
        Dialog overlay with focus trap, scroll lock, configurable backdrop,
        and smart closing behavior. Uses <code class="cui-code">CuiBackdrop</code>
        internally.
      </p>
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">CuiModal Props</h2>
      <PropTable
        :props="[
          { name: 'v-model:open', type: 'boolean', default: 'false', description: 'Controls visibility' },
          { name: 'size', type: 'sm | md | lg | xl | full | string', default: 'md', description: 'Modal width (named or custom CSS value)' },
          { name: 'title', type: 'string', default: '—', description: 'Header title text (simple mode)' },
          { name: 'persistent', type: 'boolean', default: 'false', description: 'Disable Escape and backdrop click closing' },
          { name: 'noCloseButton', type: 'boolean', default: 'false', description: 'Hide the X close button' },
          { name: 'allowNested', type: 'boolean', default: 'false', description: 'Allow stacking on top of another modal' },
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
      <h2 class="mb-4 text-2xl font-semibold">Slots</h2>
      <PropTable
        :props="[
          { name: '#header', type: 'slot', default: '-', description: 'Custom header (overrides title prop)' },
          { name: 'default', type: 'slot', default: '-', description: 'Body content (scrollable)' },
          { name: '#footer', type: 'slot', default: '-', description: 'Footer actions' },
        ]"
      />
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">Events</h2>
      <EventTable
        :events="[
          { name: 'update:open', payload: 'boolean', description: 'Controls modal visibility (v-model:open)' },
          { name: 'close', payload: '—', description: 'Fires when the modal is closed' },
        ]"
      />
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">Examples</h2>
      <CuiStack spacing="6">

        <!-- Basic -->
        <Example title="Basic Modal" :code="`<CuiModal v-model:open=&quot;show&quot; title=&quot;Hello&quot;>
  <p>Modal content here.</p>
</CuiModal>`">
          <CuiButton variant="solid" size="sm" @click="basic = true">Open Modal</CuiButton>
          <CuiModal v-model:open="basic" title="Basic Modal">
            <p>This is a basic modal with a title and body content. Click the X, press Escape, or click the backdrop to close.</p>
          </CuiModal>
        </Example>

        <!-- Sizes -->
        <Example title="Sizes" :code="`<CuiModal v-model:open=&quot;show&quot; title=&quot;Small Modal&quot; size=&quot;sm&quot;>...</CuiModal>
<CuiModal v-model:open=&quot;show&quot; title=&quot;Large Modal&quot; size=&quot;lg&quot;>...</CuiModal>
<CuiModal v-model:open=&quot;show&quot; title=&quot;Custom Width&quot; size=&quot;700px&quot;>...</CuiModal>`">
          <CuiFlex gap="3" class="flex-wrap">
            <CuiButton variant="outline" size="sm" @click="sized.sm = true">Small (24rem)</CuiButton>
            <CuiButton variant="outline" size="sm" @click="withFooter = true">Medium (default)</CuiButton>
            <CuiButton variant="outline" size="sm" @click="sized.lg = true">Large (48rem)</CuiButton>
            <CuiButton variant="outline" size="sm" @click="sized.xl = true">XL (64rem)</CuiButton>
            <CuiButton variant="outline" size="sm" @click="sized.full = true">Full</CuiButton>
            <CuiButton variant="outline" size="sm" @click="sized.custom = true">Custom (700px)</CuiButton>
          </CuiFlex>
          <CuiModal v-model:open="sized.sm" title="Small Modal" size="sm">
            <p>This is a small modal (24rem / 384px).</p>
          </CuiModal>
          <CuiModal v-model:open="sized.lg" title="Large Modal" size="lg">
            <p>This is a large modal (48rem / 768px). Good for forms and detailed content.</p>
          </CuiModal>
          <CuiModal v-model:open="sized.xl" title="Extra Large Modal" size="xl">
            <p>This is an XL modal (64rem / 1024px). Almost full width on most screens.</p>
          </CuiModal>
          <CuiModal v-model:open="sized.full" title="Full Width Modal" size="full">
            <p>This takes up the full viewport width minus a small margin.</p>
          </CuiModal>
          <CuiModal v-model:open="sized.custom" title="Custom Width" size="700px">
            <p>This modal uses a custom width of 700px.</p>
          </CuiModal>
        </Example>

        <!-- With Footer -->
        <Example title="With Footer Actions" :code="`<CuiModal v-model:open=&quot;show&quot; title=&quot;Confirm&quot;>
  <p>Are you sure?</p>
  <template #footer>
    <CuiButton variant=&quot;ghost&quot;>Cancel</CuiButton>
    <CuiButton variant=&quot;solid&quot;>Confirm</CuiButton>
  </template>
</CuiModal>`">
          <CuiButton variant="solid" size="sm" @click="withFooter = true">Open with Footer</CuiButton>
          <CuiModal v-model:open="withFooter">
            <CuiModalHeader title="Save Changes" @close="withFooter = false" />
            <CuiModalBody>
              <p>You have unsaved changes. Would you like to save them before leaving?</p>
            </CuiModalBody>
            <CuiModalFooter>
              <CuiButton variant="ghost" color="secondary" @click="withFooter = false">Discard</CuiButton>
              <CuiButton variant="outline" @click="withFooter = false">Cancel</CuiButton>
              <CuiButton variant="solid" color="success" @click="withFooter = false">Save</CuiButton>
            </CuiModalFooter>
          </CuiModal>
        </Example>

        <!-- Scrolling Body -->
        <Example title="Scrolling Body" :code="`<CuiModal v-model:open=&quot;show&quot;>
  <CuiModalHeader title=&quot;Terms of Service&quot; @close=&quot;show = false&quot; />
  <CuiModalBody>
    <p v-for=&quot;i in 20&quot; :key=&quot;i&quot;>Long content paragraph {{ i }}...</p>
  </CuiModalBody>
  <CuiModalFooter>
    <CuiButton variant=&quot;solid&quot; color=&quot;success&quot; @click=&quot;show = false&quot;>Accept</CuiButton>
  </CuiModalFooter>
</CuiModal>`">
          <CuiButton variant="outline" size="sm" @click="scrolling = true">Open Long Content</CuiButton>
          <CuiModal v-model:open="scrolling">
            <CuiModalHeader title="Terms of Service" @close="scrolling = false" />
            <CuiModalBody>
              <CuiStack spacing="4">
                <p v-for="i in 20" :key="i">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor
                  incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud
                  exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Paragraph {{ i }}.
                </p>
              </CuiStack>
            </CuiModalBody>
            <CuiModalFooter>
              <CuiButton variant="ghost" color="secondary" @click="scrolling = false">Decline</CuiButton>
              <CuiButton variant="solid" color="success" @click="scrolling = false">Accept</CuiButton>
            </CuiModalFooter>
          </CuiModal>
        </Example>

        <!-- Persistent -->
        <Example title="Persistent (no Escape/backdrop close)" :code="`<CuiModal v-model:open=&quot;show&quot; persistent>
  <CuiModalHeader title=&quot;Delete Account&quot; no-close-button />
  <CuiModalBody>
    <p>This action is permanent and cannot be undone.</p>
  </CuiModalBody>
  <CuiModalFooter>
    <CuiButton variant=&quot;ghost&quot; @click=&quot;show = false&quot;>Keep Account</CuiButton>
    <CuiButton variant=&quot;solid&quot; color=&quot;error&quot; @click=&quot;show = false&quot;>Delete Forever</CuiButton>
  </CuiModalFooter>
</CuiModal>`">
          <CuiButton variant="outline" size="sm" color="warning" @click="persistent = true">Open Persistent</CuiButton>
          <CuiModal v-model:open="persistent" persistent>
            <CuiModalHeader title="Delete Account" no-close-button />
            <CuiModalBody>
              <p>This action is permanent and cannot be undone. You must choose an option below.</p>
            </CuiModalBody>
            <CuiModalFooter>
              <CuiButton variant="ghost" color="secondary" @click="persistent = false">Keep Account</CuiButton>
              <CuiButton variant="solid" color="error" @click="persistent = false">Delete Forever</CuiButton>
            </CuiModalFooter>
          </CuiModal>
        </Example>

        <!-- No Close Button -->
        <Example title="No Close Button" :code="`<CuiModal v-model:open=&quot;show&quot;>
  <CuiModalHeader title=&quot;Wizard Step 1&quot; no-close-button />
  <CuiModalBody>
    <p>No X button — use footer actions or Escape to close.</p>
  </CuiModalBody>
  <CuiModalFooter>
    <CuiButton variant=&quot;solid&quot; @click=&quot;show = false&quot;>Next Step</CuiButton>
  </CuiModalFooter>
</CuiModal>`">
          <CuiButton variant="outline" size="sm" @click="noClose = true">Open (no X)</CuiButton>
          <CuiModal v-model:open="noClose">
            <CuiModalHeader title="Wizard Step 1" no-close-button />
            <CuiModalBody>
              <p>This modal has no X button. Use the footer actions or press Escape to close.</p>
            </CuiModalBody>
            <CuiModalFooter>
              <CuiButton variant="solid" @click="noClose = false">Next Step</CuiButton>
            </CuiModalFooter>
          </CuiModal>
        </Example>

        <!-- Backdrop: Light Blur -->
        <Example title="Backdrop: Light Blur" :code="`<CuiModal v-model:open=&quot;show&quot; title=&quot;Light Blur&quot; backdrop-blur=&quot;sm&quot; :backdrop-opacity=&quot;0.15&quot;>
  <p>A subtle blur with low opacity.</p>
</CuiModal>`">
          <CuiButton variant="outline" size="sm" @click="blurLight = true">Light Blur</CuiButton>
          <CuiModal v-model:open="blurLight" title="Light Blur" backdrop-blur="sm" :backdrop-opacity="0.15">
            <p>A subtle blur with very low opacity. The page content is softly out of focus behind the modal.</p>
          </CuiModal>
        </Example>

        <!-- Backdrop: Heavy Blur -->
        <Example title="Backdrop: Heavy Blur" :code="`<CuiModal v-model:open=&quot;show&quot; title=&quot;Heavy Blur&quot; backdrop-blur=&quot;lg&quot; :backdrop-opacity=&quot;0.3&quot;>
  <p>A strong blur with moderate opacity.</p>
</CuiModal>`">
          <CuiButton variant="outline" size="sm" @click="blurHeavy = true">Heavy Blur</CuiButton>
          <CuiModal v-model:open="blurHeavy" title="Heavy Blur" backdrop-blur="lg" :backdrop-opacity="0.3">
            <p>A strong blur with moderate opacity. Page content is fully obscured. Good for focusing attention.</p>
          </CuiModal>
        </Example>

        <!-- Backdrop: Blur + Tint -->
        <Example title="Backdrop: Blur + Color Tint" :code="`<CuiModal
  v-model:open=&quot;show&quot;
  title=&quot;Blurred &amp; Tinted&quot;
  backdrop-blur=&quot;md&quot;
  :backdrop-opacity=&quot;0.4&quot;
  backdrop-color=&quot;oklch(0.20 0.12 270)&quot;
>
  <p>Combines blur with a brand-colored tint.</p>
</CuiModal>`">
          <CuiButton variant="outline" size="sm" @click="blurred = true">Blur + Tint</CuiButton>
          <CuiModal v-model:open="blurred" title="Blurred &amp; Tinted" backdrop-blur="md" :backdrop-opacity="0.4" backdrop-color="oklch(0.20 0.12 270)">
            <p>Combines blur with a brand-colored tint for a premium feel.</p>
          </CuiModal>
        </Example>

        <!-- Backdrop: Branded Color -->
        <Example title="Backdrop: Brand Color" :code="`<CuiModal
  v-model:open=&quot;show&quot;
  title=&quot;Branded Backdrop&quot;
  backdrop-color=&quot;oklch(0.25 0.15 270)&quot;
  :backdrop-opacity=&quot;0.8&quot;
>
  <p>Deep brand-colored overlay, no blur.</p>
</CuiModal>`">
          <CuiButton variant="outline" size="sm" color="primary" @click="colored = true">Brand Overlay</CuiButton>
          <CuiModal
            v-model:open="colored"
            title="Branded Backdrop"
            backdrop-color="oklch(0.25 0.15 270)"
            :backdrop-opacity="0.8"
          >
            <p>Deep brand-colored overlay. No blur, just a strong color wash.</p>
          </CuiModal>
        </Example>

        <!-- Backdrop: Gradient -->
        <Example title="Backdrop: Gradient" :code="`<CuiModal
  v-model:open=&quot;show&quot;
  title=&quot;Gradient Backdrop&quot;
  backdrop-gradient=&quot;linear-gradient(135deg, oklch(0.25 0.15 270) 0%, oklch(0.20 0.10 200) 100%)&quot;
  :backdrop-opacity=&quot;0.85&quot;
>
  <p>A gradient backdrop for a dramatic feel.</p>
</CuiModal>`">
          <CuiButton variant="outline" size="sm" color="info" @click="gradient = true">Gradient Overlay</CuiButton>
          <CuiModal
            v-model:open="gradient"
            title="Gradient Backdrop"
            backdrop-gradient="linear-gradient(135deg, oklch(0.25 0.15 270) 0%, oklch(0.20 0.10 200) 100%)"
            :backdrop-opacity="0.85"
          >
            <p>A gradient backdrop for a dramatic, editorial feel. Useful for marketing modals or onboarding flows.</p>
          </CuiModal>
        </Example>

        <!-- Backdrop: Image (SVG grid) -->
        <Example title="Backdrop: SVG Grid Image" :code="`<CuiModal
  v-model:open=&quot;show&quot;
  title=&quot;Image Backdrop&quot;
  :backdrop-image=&quot;gridSvg&quot;
  backdrop-color=&quot;oklch(0.18 0.05 270)&quot;
  :backdrop-opacity=&quot;0.85&quot;
>
  <p>An SVG grid pattern over a dark background.</p>
</CuiModal>`">
          <CuiButton variant="outline" size="sm" @click="imageBackdrop = true">Grid Image</CuiButton>
          <CuiModal
            v-model:open="imageBackdrop"
            title="Image Backdrop"
            :backdrop-image="gridSvg"
            backdrop-color="oklch(0.18 0.05 270)"
            :backdrop-opacity="0.85"
          >
            <p>An SVG grid pattern overlaid on a dark background. Good for technical or developer-focused UIs.</p>
          </CuiModal>
        </Example>

        <!-- Backdrop: Image + Blur -->
        <Example title="Backdrop: Image + Blur (combined)" :code="`<CuiModal
  v-model:open=&quot;show&quot;
  title=&quot;Image + Blur&quot;
  :backdrop-image=&quot;dotSvg&quot;
  backdrop-blur=&quot;sm&quot;
  backdrop-color=&quot;oklch(0.22 0.06 270)&quot;
  :backdrop-opacity=&quot;0.5&quot;
>
  <p>Dot-grid, brand tint, and medium blur combined.</p>
</CuiModal>`">
          <CuiButton variant="outline" size="sm" @click="imageBlur = true">Image + Blur</CuiButton>
          <CuiModal
            v-model:open="imageBlur"
            title="Image + Blur"
            :backdrop-image="dotSvg"
            backdrop-blur="sm"
            backdrop-color="oklch(0.22 0.06 270)"
            :backdrop-opacity="0.5"
          >
            <p>Combines a dot-grid SVG pattern, a brand-colored tint, and a medium blur. All three backdrop features work together.</p>
          </CuiModal>
        </Example>

        <!-- Backdrop: Nearly Transparent -->
        <Example title="Backdrop: Nearly Transparent" :code="`<CuiModal v-model:open=&quot;show&quot; title=&quot;Light Overlay&quot; :backdrop-opacity=&quot;0.1&quot;>
  <p>Very subtle backdrop — page is mostly visible.</p>
</CuiModal>`">
          <CuiButton variant="outline" size="sm" @click="transparent = true">Transparent</CuiButton>
          <CuiModal
            v-model:open="transparent"
            title="Light Overlay"
            :backdrop-opacity="0.1"
          >
            <p>Very subtle backdrop — the page is still mostly visible. Good for non-critical notifications or light confirmations.</p>
          </CuiModal>
        </Example>

        <!-- Form in Modal -->
        <Example title="Form in Modal" :code="`<CuiModal v-model:open=&quot;show&quot; size=&quot;lg&quot;>
  <CuiModalHeader title=&quot;Create User&quot; @close=&quot;show = false&quot; />
  <CuiModalBody>
    <CuiStack spacing=&quot;4&quot;>
      <CuiFormField label=&quot;Full Name&quot; required>
        <CuiInput v-model=&quot;formName&quot; placeholder=&quot;John Doe&quot; />
      </CuiFormField>
      <CuiFormField label=&quot;Role&quot;>
        <CuiSelect v-model=&quot;formRole&quot; :options=&quot;['Admin', 'Editor', 'Viewer']&quot; />
      </CuiFormField>
    </CuiStack>
  </CuiModalBody>
  <CuiModalFooter>
    <CuiButton variant=&quot;ghost&quot; @click=&quot;show = false&quot;>Cancel</CuiButton>
    <CuiButton variant=&quot;solid&quot; color=&quot;success&quot; @click=&quot;show = false&quot;>Create User</CuiButton>
  </CuiModalFooter>
</CuiModal>`">
          <CuiButton variant="solid" size="sm" @click="formModal = true">Open Form</CuiButton>
          <CuiModal v-model:open="formModal" size="lg">
            <CuiModalHeader title="Create User" @close="formModal = false" />
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
              <CuiButton variant="ghost" color="secondary" @click="formModal = false">Cancel</CuiButton>
              <CuiButton variant="solid" color="success" @click="formModal = false">Create User</CuiButton>
            </CuiModalFooter>
          </CuiModal>
        </Example>

        <!-- Confirm Dialog Pattern -->
        <Example title="Confirm Dialog Pattern" :code="`<CuiModal v-model:open=&quot;show&quot; size=&quot;sm&quot; persistent>
  <CuiModalHeader title=&quot;Confirm Deletion&quot; no-close-button />
  <CuiModalBody>
    <p>Are you sure you want to delete <strong>Project Alpha</strong>?</p>
  </CuiModalBody>
  <CuiModalFooter>
    <CuiButton variant=&quot;ghost&quot; @click=&quot;show = false&quot;>Cancel</CuiButton>
    <CuiButton variant=&quot;solid&quot; color=&quot;error&quot; @click=&quot;show = false&quot;>Delete</CuiButton>
  </CuiModalFooter>
</CuiModal>`">
          <CuiButton variant="solid" size="sm" color="error" @click="confirmModal = true">Delete Item</CuiButton>
          <CuiModal v-model:open="confirmModal" size="sm" persistent>
            <CuiModalHeader title="Confirm Deletion" no-close-button />
            <CuiModalBody>
              <p>Are you sure you want to delete <strong>Project Alpha</strong>? This action cannot be undone.</p>
            </CuiModalBody>
            <CuiModalFooter>
              <CuiButton variant="ghost" color="secondary" @click="confirmModal = false">Cancel</CuiButton>
              <CuiButton variant="solid" color="error" @click="confirmModal = false">Delete</CuiButton>
            </CuiModalFooter>
          </CuiModal>
        </Example>

      </CuiStack>
    </div>
  </CuiStack>
</template>

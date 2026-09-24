<script setup lang="ts">
import { ref } from "vue";
import {
  CuiButton,
  CuiCard,
  CuiCardBody,
  CuiFlex,
  CuiStack,
  CuiStepper,
  type StepDef,
} from "@itguy614/clean-ui";
import DocPage from "../components/DocPage.vue";
import Example from "../components/Example.vue";
import meta from "../meta/stepper";

const basicSteps: StepDef[] = [
  { label: "Account" },
  { label: "Profile" },
  { label: "Review" },
  { label: "Complete" },
];
const usageStep = ref(1);

const detailSteps: StepDef[] = [
  { label: "Account Setup", description: "Create your credentials" },
  { label: "Personal Info", description: "Name, email, and phone" },
  { label: "Preferences", description: "Notifications and theme" },
  { label: "Confirmation", description: "Review and submit" },
];
const detailStep = ref(2);

const iconSteps: StepDef[] = [
  { label: "Cart", icon: "shopping-cart" },
  { label: "Shipping", icon: "truck" },
  { label: "Payment", icon: "credit-card" },
  { label: "Done", icon: "check-circle" },
];
const iconStep = ref(1);

const errorSteps: StepDef[] = [
  { label: "Details", description: "Basic information" },
  { label: "Verification", description: "Identity check", error: true },
  { label: "Approval", description: "Final review" },
];
const errorStep = ref(1);

const verticalSteps: StepDef[] = [
  { label: "Order Placed", description: "Your order has been confirmed" },
  { label: "Processing", description: "We're preparing your items" },
  { label: "Shipped", description: "On its way to you" },
  { label: "Delivered", description: "Enjoy your purchase!" },
];
const verticalStep = ref(1);
</script>

<template>
  <DocPage :meta="meta">
    <template #usage>
      <Example
        code-open
        :code="`<CuiStepper :steps=&quot;steps&quot; v-model=&quot;currentStep&quot; />

// steps = [
//   { label: 'Account' },
//   { label: 'Profile' },
//   { label: 'Review' },
//   { label: 'Complete' },
// ]`"
      >
        <CuiStack spacing="4">
          <CuiStepper :steps="basicSteps" v-model="usageStep" />
          <CuiFlex gap="2">
            <CuiButton size="sm" variant="outline" :disabled="usageStep === 0" @click="usageStep--">Back</CuiButton>
            <CuiButton
              size="sm"
              variant="solid"
              :disabled="usageStep === basicSteps.length - 1"
              @click="usageStep++"
            >
              Next
            </CuiButton>
          </CuiFlex>
        </CuiStack>
      </Example>
    </template>

    <template #accessibility>
      <p class="text-surface-700 dark:text-surface-300">
        The stepper is a <code>role="navigation"</code> region labelled "Progress" from the
        message catalogue, and the step the flow is on carries
        <code>aria-current="step"</code> — so a screen-reader user can find the indicator
        and hear which step is live.
      </p>
      <ul class="list-disc pl-5 text-surface-700 dark:text-surface-300">
        <li>
          Status is not carried by colour alone: a completed step swaps its number for a
          check icon and a failed one for a warning icon. Current and upcoming steps differ
          only by ring colour and label weight, so keep the labels themselves meaningful.
        </li>
        <li>
          The step number, label and description are all real text — nothing about a step
          is conveyed by a background image or a colour swatch that a high-contrast mode
          would flatten.
        </li>
      </ul>
      <p class="text-surface-700 dark:text-surface-300">
        <strong>Known gaps — read before relying on this as navigation.</strong> With
        <code>clickable</code> (the default) each step is a <code>&lt;div&gt;</code> with a
        click handler: no <code>tabindex</code>, no <code>role="button"</code> and no key
        handler, so steps can only be reached with a pointer. Give the user real controls —
        Back/Next buttons, as every example here does — and treat the stepper itself as an
        indicator. The markup is also a flat set of divs rather than an ordered list, and
        nothing announces "step 2 of 4", so the count and position are visual only.
      </p>
    </template>

    <template #examples>
      <!-- With descriptions -->
      <Example title="With Descriptions" :code="`<CuiStepper :steps=&quot;steps&quot; v-model=&quot;step&quot; />
// steps = [
//   { label: 'Account Setup', description: 'Create your credentials' },
//   { label: 'Personal Info', description: 'Name, email, and phone' },
// ]`">
        <CuiStack spacing="4">
          <CuiStepper :steps="detailSteps" v-model="detailStep" />
          <CuiFlex gap="2">
            <CuiButton size="sm" variant="outline" :disabled="detailStep === 0" @click="detailStep--">Back</CuiButton>
            <CuiButton size="sm" variant="solid" :disabled="detailStep === detailSteps.length - 1" @click="detailStep++">Next</CuiButton>
          </CuiFlex>
        </CuiStack>
      </Example>

      <!-- Custom icons -->
      <Example title="Custom Icons" :code="`// steps = [
//   { label: 'Cart', icon: 'shopping-cart' },
//   { label: 'Shipping', icon: 'truck' },
//   { label: 'Payment', icon: 'credit-card' },
// ]
<CuiStepper :steps=&quot;steps&quot; v-model=&quot;step&quot; />`">
        <CuiStack spacing="4">
          <CuiStepper :steps="iconSteps" v-model="iconStep" />
          <CuiFlex gap="2">
            <CuiButton size="sm" variant="outline" :disabled="iconStep === 0" @click="iconStep--">Back</CuiButton>
            <CuiButton size="sm" variant="solid" :disabled="iconStep === iconSteps.length - 1" @click="iconStep++">Next</CuiButton>
          </CuiFlex>
        </CuiStack>
      </Example>

      <!-- Sizes -->
      <Example title="Sizes" :code="`<CuiStepper :steps=&quot;steps&quot; :model-value=&quot;2&quot; size=&quot;sm&quot; :clickable=&quot;false&quot; />
<CuiStepper :steps=&quot;steps&quot; :model-value=&quot;2&quot; size=&quot;md&quot; :clickable=&quot;false&quot; />
<CuiStepper :steps=&quot;steps&quot; :model-value=&quot;2&quot; size=&quot;lg&quot; :clickable=&quot;false&quot; />`">
        <CuiStack spacing="6">
          <div>
            <div class="mb-2 text-sm font-medium" style="color: var(--cui-text-secondary);">Small:</div>
            <CuiStepper :steps="basicSteps" :model-value="2" size="sm" :clickable="false" />
          </div>
          <div>
            <div class="mb-2 text-sm font-medium" style="color: var(--cui-text-secondary);">Medium (default):</div>
            <CuiStepper :steps="basicSteps" :model-value="2" size="md" :clickable="false" />
          </div>
          <div>
            <div class="mb-2 text-sm font-medium" style="color: var(--cui-text-secondary);">Large:</div>
            <CuiStepper :steps="basicSteps" :model-value="2" size="lg" :clickable="false" />
          </div>
        </CuiStack>
      </Example>

      <!-- Error state -->
      <Example title="Error State" :code="`// steps = [
//   { label: 'Details', description: 'Basic information' },
//   { label: 'Verification', description: 'Identity check', error: true },
//   { label: 'Approval', description: 'Final review' },
// ]
<CuiStepper :steps=&quot;steps&quot; v-model=&quot;step&quot; />`">
        <CuiStack spacing="4">
          <CuiStepper :steps="errorSteps" v-model="errorStep" />
          <p class="text-sm" style="color: var(--cui-error);">Verification failed — please try again.</p>
        </CuiStack>
      </Example>

      <!-- Vertical -->
      <Example title="Vertical Orientation" :code="`<CuiStepper :steps=&quot;steps&quot; v-model=&quot;step&quot; orientation=&quot;vertical&quot; />`">
        <div style="max-width: 24rem;">
          <CuiCard variant="outline">
            <CuiCardBody>
              <CuiStack spacing="4">
                <CuiStepper :steps="verticalSteps" v-model="verticalStep" orientation="vertical" />
                <CuiFlex gap="2">
                  <CuiButton size="sm" variant="outline" :disabled="verticalStep === 0" @click="verticalStep--">Back</CuiButton>
                  <CuiButton size="sm" variant="solid" :disabled="verticalStep === verticalSteps.length - 1" @click="verticalStep++">Next</CuiButton>
                </CuiFlex>
              </CuiStack>
            </CuiCardBody>
          </CuiCard>
        </div>
      </Example>

      <!-- All complete -->
      <Example title="All Complete" :code="`<CuiStepper :steps=&quot;steps&quot; :model-value=&quot;steps.length&quot; :clickable=&quot;false&quot; />`">
        <CuiStepper :steps="basicSteps" :model-value="basicSteps.length" :clickable="false" />
      </Example>
    </template>
  </DocPage>
</template>

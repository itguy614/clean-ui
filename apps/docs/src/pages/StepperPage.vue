<script setup lang="ts">
import { ref } from "vue";
import {
  CuiButton,
  CuiCard,
  CuiCardBody,
  CuiFlex,
  CuiIcon,
  CuiStack,
  CuiStepper,
  type StepDef,
} from "@itguy614/clean-ui";
import PropTable from "../components/PropTable.vue";
import Example from "../components/Example.vue";

const basicSteps: StepDef[] = [
  { label: "Account" },
  { label: "Profile" },
  { label: "Review" },
  { label: "Complete" },
];
const basicStep = ref(1);

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
  <CuiStack spacing="8">
    <div>
      <h1 class="text-4xl font-bold">Stepper</h1>
      <p class="mt-2 text-lg text-surface-600 dark:text-surface-400">
        A step-by-step progress indicator for multi-step workflows.
        Supports horizontal and vertical orientations, clickable navigation,
        custom icons, descriptions, and error states.
      </p>
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">Props</h2>
      <PropTable
        :props="[
          { name: 'steps', type: 'StepDef[]', default: '—', description: 'Step definitions: { label, description?, icon?, error? }' },
          { name: 'modelValue', type: 'number', default: '0', description: 'Current active step (0-based, v-model)' },
          { name: 'orientation', type: 'horizontal | vertical', default: 'horizontal', description: 'Layout direction' },
          { name: 'size', type: 'sm | md | lg', default: 'md', description: 'Size' },
          { name: 'clickable', type: 'boolean', default: 'true', description: 'Allow clicking completed steps to go back' },
          { name: 'linear', type: 'boolean', default: 'true', description: 'Linear mode — can only progress forward, no skipping' },
          { name: 'hidden', type: 'boolean', default: 'false', description: 'Hide the component (v-show)' },
        ]"
      />
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">Examples</h2>
      <CuiStack spacing="6">

        <!-- Basic -->
        <Example title="Basic Stepper" :code="`<CuiStepper :steps=&quot;steps&quot; v-model=&quot;currentStep&quot; />`">
          <CuiStack spacing="4">
            <CuiStepper :steps="basicSteps" v-model="basicStep" />
            <CuiFlex gap="2">
              <CuiButton size="sm" variant="outline" :disabled="basicStep === 0" @click="basicStep--">Back</CuiButton>
              <CuiButton size="sm" variant="solid" :disabled="basicStep === basicSteps.length - 1" @click="basicStep++">Next</CuiButton>
            </CuiFlex>
          </CuiStack>
        </Example>

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

      </CuiStack>
    </div>
  </CuiStack>
</template>

<script setup lang="ts">
import { ref } from "vue";
import {
  CuiButton,
  CuiCheckbox,
  CuiCheckboxGroup,
  CuiFormField,
  CuiFlex,
  CuiInput,
  CuiMaskedInput,
  CuiRadio,
  CuiRadioGroup,
  CuiSelect,
  CuiStack,
  CuiTextarea,
  CuiToggle,
} from "@itguy614/clean-ui";
import PropTable from "../components/PropTable.vue";
import Example from "../components/Example.vue";

const name = ref("");
const email = ref("");
const phone = ref("");
const bio = ref("");
const role = ref<string | null>(null);
const plan = ref("");
const features = ref<string[]>([]);
const newsletter = ref(false);
const agree = ref(false);
</script>

<template>
  <CuiStack spacing="8">
    <div>
      <h1 class="text-4xl font-bold">Form Field</h1>
      <p class="mt-2 text-lg text-surface-600 dark:text-surface-400">
        Wrapper that adds label, required indicator, help text, and error
        display to any form control. Owns all error presentation via a left
        accent bar.
      </p>
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">Props</h2>
      <PropTable
        :props="[
          { name: 'label', type: 'string', default: '-', description: 'Label text' },
          { name: 'labelPosition', type: 'top | left', default: 'top', description: 'Label placement relative to control' },
          { name: 'for', type: 'string', default: 'auto', description: 'HTML for attribute (ties label to control id)' },
          { name: 'required', type: 'boolean', default: 'false', description: 'Show required indicator' },
          { name: 'requiredText', type: 'string', default: '-', description: 'Custom required text (replaces asterisk)' },
          { name: 'helpText', type: 'string', default: '-', description: 'Help text below control' },
          { name: 'error', type: 'boolean', default: 'false', description: 'Error state (left accent bar)' },
          { name: 'errorMessage', type: 'string', default: '-', description: 'Error message (replaces help text)' },
        ]"
      />
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">Slots</h2>
      <PropTable
        :props="[
          { name: 'default', type: 'slot', default: '-', description: 'The form control. Receives { id, error } as slot props.' },
        ]"
      />
    </div>

    <div>
      <h2 class="mb-4 text-2xl font-semibold">Examples</h2>
      <CuiStack spacing="6">

        <!-- Basic with Input -->
        <Example title="Basic — Input with Label" :code="`<CuiFormField label=&quot;Full Name&quot; help-text=&quot;As it appears on your ID&quot;>
  <CuiInput v-model=&quot;name&quot; placeholder=&quot;John Doe&quot; />
</CuiFormField>`">
          <div class="max-w-md">
            <CuiFormField label="Full Name" help-text="As it appears on your ID">
              <CuiInput v-model="name" placeholder="John Doe" />
            </CuiFormField>
          </div>
        </Example>

        <!-- Required (asterisk) -->
        <Example title="Required (asterisk)">
          <div class="max-w-md">
            <CuiFormField label="Email Address" required help-text="We will never share your email">
              <CuiInput v-model="email" type="email" placeholder="you@example.com" />
            </CuiFormField>
          </div>
        </Example>

        <!-- Required (custom text) -->
        <Example title="Required (custom text)">
          <div class="max-w-md">
            <CuiFormField label="Phone Number" required required-text="Required" help-text="Include country code">
              <CuiMaskedInput v-model="phone" mask="+1 (###) ###-####" placeholder="Phone" />
            </CuiFormField>
          </div>
        </Example>

        <!-- Error state -->
        <Example title="Error State" :code="`<CuiFormField label=&quot;Email&quot; required error error-message=&quot;Invalid email&quot;>
  <CuiInput v-model=&quot;email&quot; />
</CuiFormField>`">
          <CuiStack spacing="4" class="max-w-md">
            <CuiFormField label="Email" required error error-message="Please enter a valid email address">
              <CuiInput v-model="email" type="email" placeholder="you@example.com" />
            </CuiFormField>
            <CuiFormField label="Bio" error error-message="Bio must be at least 20 characters">
              <CuiTextarea v-model="bio" placeholder="Tell us about yourself..." :rows="3" />
            </CuiFormField>
          </CuiStack>
        </Example>

        <!-- Left label -->
        <Example title="Left Label Position" :code="`<CuiFormField label=&quot;Username&quot; label-position=&quot;left&quot;>
  <CuiInput v-model=&quot;name&quot; />
</CuiFormField>`">
          <CuiStack spacing="4" class="max-w-lg">
            <CuiFormField label="Full Name" label-position="left" required>
              <CuiInput v-model="name" placeholder="John Doe" />
            </CuiFormField>
            <CuiFormField label="Email" label-position="left" required help-text="Your primary email">
              <CuiInput v-model="email" type="email" placeholder="you@example.com" />
            </CuiFormField>
            <CuiFormField label="Role" label-position="left">
              <CuiSelect v-model="role" :options="['Admin', 'Editor', 'Viewer']" placeholder="Choose..." />
            </CuiFormField>
          </CuiStack>
        </Example>

        <!-- Wrapping different controls -->
        <Example title="Wrapping Different Controls">
          <CuiStack spacing="4" class="max-w-md">
            <CuiFormField label="Select a Plan" required>
              <CuiRadioGroup v-model="plan">
                <CuiRadio value="free" label="Free" description="Basic features, no cost" />
                <CuiRadio value="pro" label="Pro" description="Advanced features, $10/mo" />
                <CuiRadio value="enterprise" label="Enterprise" description="Custom pricing" />
              </CuiRadioGroup>
            </CuiFormField>

            <CuiFormField label="Features" help-text="Select all that apply">
              <CuiCheckboxGroup v-model="features">
                <CuiCheckbox value="sso" label="Single Sign-On" />
                <CuiCheckbox value="api" label="API Access" />
                <CuiCheckbox value="audit" label="Audit Logs" />
              </CuiCheckboxGroup>
            </CuiFormField>

            <CuiFormField label="Newsletter">
              <CuiToggle v-model="newsletter" label="Send me weekly updates" />
            </CuiFormField>

            <CuiFormField label="Terms" required error :error-message="!agree ? 'You must agree to continue' : undefined">
              <CuiCheckbox v-model="agree" label="I agree to the terms and conditions" />
            </CuiFormField>
          </CuiStack>
        </Example>

        <!-- Real-world form -->
        <Example title="Real-World: Registration Form">
          <CuiStack spacing="5" class="max-w-lg">
            <CuiFormField label="Full Name" required>
              <CuiInput v-model="name" placeholder="John Doe" />
            </CuiFormField>

            <CuiFormField label="Email" required help-text="We will send a confirmation link">
              <CuiInput v-model="email" type="email" placeholder="you@example.com" />
            </CuiFormField>

            <CuiFormField label="Phone" help-text="Optional, for account recovery">
              <CuiMaskedInput v-model="phone" mask="+1 (###) ###-####" />
            </CuiFormField>

            <CuiFormField label="Role">
              <CuiSelect
                v-model="role"
                :options="[
                  { value: 'dev', label: 'Developer' },
                  { value: 'design', label: 'Designer' },
                  { value: 'pm', label: 'Product Manager' },
                  { value: 'other', label: 'Other' },
                ]"
                placeholder="What do you do?"
                clearable
              />
            </CuiFormField>

            <CuiFormField label="Bio" help-text="Brief description (max 300 chars)">
              <CuiTextarea v-model="bio" auto-resize :max-length="300" placeholder="Tell us about yourself..." />
            </CuiFormField>

            <CuiFormField label="Plan" required>
              <CuiRadioGroup v-model="plan">
                <CuiRadio value="free" label="Free" />
                <CuiRadio value="pro" label="Pro ($10/mo)" />
              </CuiRadioGroup>
            </CuiFormField>

            <CuiFormField>
              <CuiCheckbox v-model="agree" label="I agree to the Terms of Service and Privacy Policy" />
            </CuiFormField>

            <CuiFlex gap="3">
              <CuiButton variant="solid" color="primary">Create Account</CuiButton>
              <CuiButton variant="ghost" color="secondary">Cancel</CuiButton>
            </CuiFlex>
          </CuiStack>
        </Example>

      </CuiStack>
    </div>
  </CuiStack>
</template>

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
import DocPage from "../components/DocPage.vue";
import Example from "../components/Example.vue";
import meta from "../meta/form-field";

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
  <DocPage :meta="meta">
    <template #usage>
      <Example
        code-open
        :code="`<CuiFormField label=&quot;Full Name&quot; help-text=&quot;As it appears on your ID&quot; v-slot=&quot;f&quot;>
  <CuiInput v-bind=&quot;f&quot; v-model=&quot;name&quot; placeholder=&quot;John Doe&quot; />
</CuiFormField>`"
      >
        <div class="max-w-md">
          <CuiFormField label="Full Name" help-text="As it appears on your ID" v-slot="f">
            <CuiInput v-bind="f" v-model="name" placeholder="John Doe" />
          </CuiFormField>
        </div>
      </Example>
    </template>

    <template #accessibility>
      <p class="text-surface-700 dark:text-surface-300">
        This component exists for the wiring. It generates one id at setup — once, not in
        a computed, so it survives re-renders — and hands it to the control as
        <code>id</code> while putting it in the label's <code>for</code>. It also gives
        the label its own id and passes that as <code>aria-labelledby</code>, and gives
        the help text or error message an id it passes as
        <code>aria-describedby</code>. Spreading <code>v-bind="f"</code> is what lands all
        three on the control's own focusable element rather than on its wrapper.
      </p>
      <ul class="list-disc pl-5 text-surface-700 dark:text-surface-300">
        <li>
          <code>for</code>/<code>id</code> alone is not enough. It forms an association
          only with <em>labelable</em> elements, which leaves a control like
          <code>CuiSelect</code> — whose focusable surface is a
          <code>div[role="combobox"]</code>, not an <code>&lt;input&gt;</code> — with no
          accessible name at all. <code>aria-labelledby</code> is what actually names it,
          which is why the field emits both and why <code>CuiTimePicker</code>, built the
          same way, takes the same prop.
        </li>
        <li>
          <code>aria-describedby</code> is only emitted when there is help text or an
          error to point at. A dangling reference to an element that was never rendered is
          worse than no reference.
        </li>
        <li>
          The error message replaces the help text rather than joining it, so the
          description a control carries is always the one that currently matters.
        </li>
        <li>
          The asterisk is <code>aria-hidden</code> — it is a visual marker, and reading
          "star" before every required field helps nobody.
        </li>
        <li>
          Wrapping a group — a <code>CuiRadioGroup</code>, a
          <code>CuiCheckboxGroup</code> — works visually, but the label points at a single
          id and a group has no single control to own it. Use the group's own
          <code>label</code> prop, or a <code>CuiFieldset</code>, where a
          <code>&lt;legend&gt;</code> names the whole group natively.
        </li>
      </ul>
      <p class="text-surface-700 dark:text-surface-300">
        <strong>Known gaps.</strong> <code>required</code> draws the marker but is not
        forwarded to the control, so nothing sets <code>required</code> or
        <code>aria-required</code> and the field is not announced as required. Pass it to
        the control as well as to the field until that changes. The error message is also
        not a live region — it is referenced by <code>aria-describedby</code>, so it is
        read when focus reaches the control, but its appearance is not announced. On an
        invalid submit, move focus to the first failing field yourself.
      </p>
    </template>

    <template #examples>
      <!-- Required (asterisk) -->
      <Example title="Required (asterisk)" :code="`<CuiFormField label=&quot;Email Address&quot; required help-text=&quot;We will never share your email&quot;>
  <CuiInput v-model=&quot;email&quot; type=&quot;email&quot; />
</CuiFormField>`">
        <div class="max-w-md">
          <CuiFormField label="Email Address" required help-text="We will never share your email" v-slot="f">
            <CuiInput v-bind="f" v-model="email" type="email" placeholder="you@example.com" required />
          </CuiFormField>
        </div>
      </Example>

      <!-- Required (custom text) -->
      <Example title="Required (custom text)" :code="`<CuiFormField label=&quot;Phone Number&quot; required required-text=&quot;Required&quot;>
  <CuiMaskedInput v-model=&quot;phone&quot; mask=&quot;+1 (###) ###-####&quot; />
</CuiFormField>`">
        <div class="max-w-md">
          <CuiFormField label="Phone Number" required required-text="Required" help-text="Include country code" v-slot="f">
            <CuiMaskedInput v-bind="f" v-model="phone" mask="+1 (###) ###-####" placeholder="Phone" />
          </CuiFormField>
        </div>
      </Example>

      <!-- Error state -->
      <Example title="Error State" :code="`<CuiFormField label=&quot;Email&quot; required error error-message=&quot;Invalid email&quot; v-slot=&quot;f&quot;>
  <CuiInput v-bind=&quot;f&quot; v-model=&quot;email&quot; />
</CuiFormField>`">
        <CuiStack spacing="4" class="max-w-md">
          <CuiFormField label="Email" required error error-message="Please enter a valid email address" v-slot="f">
            <CuiInput v-bind="f" v-model="email" type="email" placeholder="you@example.com" />
          </CuiFormField>
          <CuiFormField label="Bio" error error-message="Bio must be at least 20 characters" v-slot="f">
            <CuiTextarea v-bind="f" v-model="bio" placeholder="Tell us about yourself..." :rows="3" />
          </CuiFormField>
        </CuiStack>
      </Example>

      <!-- Left label -->
      <Example title="Left Label Position" :code="`<CuiFormField label=&quot;Username&quot; label-position=&quot;left&quot; v-slot=&quot;f&quot;>
  <CuiInput v-bind=&quot;f&quot; v-model=&quot;name&quot; />
</CuiFormField>`">
        <CuiStack spacing="4" class="max-w-lg">
          <CuiFormField label="Full Name" label-position="left" required v-slot="f">
            <CuiInput v-bind="f" v-model="name" placeholder="John Doe" />
          </CuiFormField>
          <CuiFormField label="Email" label-position="left" required help-text="Your primary email" v-slot="f">
            <CuiInput v-bind="f" v-model="email" type="email" placeholder="you@example.com" />
          </CuiFormField>
          <CuiFormField label="Role" label-position="left" v-slot="f">
            <CuiSelect v-bind="f" v-model="role" :options="['Admin', 'Editor', 'Viewer']" placeholder="Choose..." />
          </CuiFormField>
        </CuiStack>
      </Example>

      <!-- Wrapping different controls -->
      <Example title="Wrapping Different Controls" :code="`<CuiFormField label=&quot;Select a Plan&quot; required>
  <CuiRadioGroup v-model=&quot;plan&quot;>
    <CuiRadio value=&quot;free&quot; label=&quot;Free&quot; />
    <CuiRadio value=&quot;pro&quot; label=&quot;Pro&quot; />
  </CuiRadioGroup>
</CuiFormField>
<CuiFormField label=&quot;Newsletter&quot;>
  <CuiToggle v-model=&quot;newsletter&quot; label=&quot;Send me updates&quot; />
</CuiFormField>`">
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
      <Example title="Real-World: Registration Form" :code="`<CuiFormField label=&quot;Full Name&quot; required v-slot=&quot;f&quot;>
  <CuiInput v-bind=&quot;f&quot; v-model=&quot;name&quot; placeholder=&quot;John Doe&quot; />
</CuiFormField>
<CuiFormField label=&quot;Email&quot; required help-text=&quot;We will send a confirmation link&quot; v-slot=&quot;f&quot;>
  <CuiInput v-bind=&quot;f&quot; v-model=&quot;email&quot; type=&quot;email&quot; />
</CuiFormField>
<CuiFormField label=&quot;Plan&quot; required>
  <CuiRadioGroup v-model=&quot;plan&quot;>
    <CuiRadio value=&quot;free&quot; label=&quot;Free&quot; />
    <CuiRadio value=&quot;pro&quot; label=&quot;Pro ($10/mo)&quot; />
  </CuiRadioGroup>
</CuiFormField>`">
        <CuiStack spacing="5" class="max-w-lg">
          <CuiFormField label="Full Name" required v-slot="f">
            <CuiInput v-bind="f" v-model="name" placeholder="John Doe" />
          </CuiFormField>

          <CuiFormField label="Email" required help-text="We will send a confirmation link" v-slot="f">
            <CuiInput v-bind="f" v-model="email" type="email" placeholder="you@example.com" />
          </CuiFormField>

          <CuiFormField label="Phone" help-text="Optional, for account recovery" v-slot="f">
            <CuiMaskedInput v-bind="f" v-model="phone" mask="+1 (###) ###-####" />
          </CuiFormField>

          <CuiFormField label="Role" v-slot="f">
            <CuiSelect
              v-bind="f"
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

          <CuiFormField label="Bio" help-text="Brief description (max 300 chars)" v-slot="f">
            <CuiTextarea v-bind="f" v-model="bio" auto-resize :max-length="300" placeholder="Tell us about yourself..." />
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
    </template>
  </DocPage>
</template>

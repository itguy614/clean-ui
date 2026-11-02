<script setup lang="ts">
import { ref } from "vue";
import { CuiButton, CuiForm, CuiFormField, CuiPinInput, CuiStack, useToast, type FormResolver } from "@itguy614/clean-ui";
import DocPage from "../components/DocPage.vue";
import Example from "../components/Example.vue";
import meta from "../meta/pin-input";

const { toast } = useToast();

const otp = ref("");
const completed = ref("");
const voucher = ref("");
const pin = ref("");
const wrong = ref("");
const sizes = ref("");

const formValues = ref<Record<string, unknown>>({ code: "" });
const resolver: FormResolver = (values) => {
  const errors: Record<string, string> = {};
  if (String(values.code ?? "").length !== 6) errors.code = "Enter all six digits";
  return errors;
};
function verify(values: Record<string, unknown>) {
  toast.success(`Verified ${values.code}`);
}
</script>

<template>
  <DocPage :meta="meta">
    <template #usage>
      <Example
        code-open
        :code="`<CuiPinInput
  v-model=&quot;code&quot;
  label=&quot;Verification code&quot;
  description=&quot;Enter the 6-digit code we sent to your phone.&quot;
  @complete=&quot;verify&quot;
/>`"
      >
        <CuiStack spacing="2">
          <CuiPinInput
            v-model="otp"
            label="Verification code"
            description="Enter the 6-digit code we sent to your phone."
            @complete="completed = $event"
          />
          <div class="text-sm text-surface-500">Value: "{{ otp }}" | Last complete: "{{ completed }}"</div>
        </CuiStack>
      </Example>
    </template>

    <template #accessibility>
      <p class="text-surface-700 dark:text-surface-300">
        The control is one real <code>&lt;input&gt;</code>, laid invisibly over the boxes.
        A screen reader meets a single text field named by the label, not six unnamed ones,
        and reads the code back as one value. The boxes are <code>aria-hidden</code>: they
        only draw what the input holds.
      </p>
      <ul class="list-disc pl-5 text-surface-700 dark:text-surface-300">
        <li>
          <code>autocomplete="one-time-code"</code> is the default, so iOS and Android offer
          a code from a text message above the keyboard. <code>inputmode="numeric"</code>
          opens a number pad for a digits code.
        </li>
        <li>
          Say how long the code is in <code>description</code> (or
          <code>CuiFormField</code>'s help text). It is linked by
          <code>aria-describedby</code>, so it is read when the field takes focus; the boxes
          are not.
        </li>
        <li>
          Typing a character the type doesn't accept does nothing. A paste is cleaned first,
          so <code>123-456</code> or <code> 123 456 </code> fills a six-digit code, and a
          longer paste is cut to <code>length</code>.
        </li>
        <li>
          Left and Right move between boxes, Home and End jump to the first box and the first
          empty one. A filled box under the caret is overwritten by the next character.
          Backspace deletes the character before an empty box.
        </li>
        <li>
          <code>error</code> applies to the whole code: every box turns red, the input gets
          <code>aria-invalid</code>, and <code>errorMessage</code> joins its description.
        </li>
        <li>
          The caret blinks; under <code>prefers-reduced-motion</code> it holds still.
        </li>
      </ul>
    </template>

    <template #examples>
      <Example
        title="Alphanumeric"
        :code="`<CuiPinInput v-model=&quot;voucher&quot; type=&quot;alphanumeric&quot; uppercase :length=&quot;8&quot; label=&quot;Voucher code&quot; />`"
      >
        <CuiStack spacing="2">
          <CuiPinInput v-model="voucher" type="alphanumeric" uppercase :length="8" label="Voucher code" />
          <div class="text-sm text-surface-500">Value: "{{ voucher }}"</div>
        </CuiStack>
      </Example>

      <Example
        title="Masked"
        :code="`<CuiPinInput v-model=&quot;pin&quot; mask :length=&quot;4&quot; label=&quot;PIN&quot; autocomplete=&quot;off&quot; />`"
      >
        <CuiStack spacing="2">
          <CuiPinInput v-model="pin" mask :length="4" label="PIN" autocomplete="off" />
          <div class="text-sm text-surface-500">Value: "{{ pin }}"</div>
        </CuiStack>
      </Example>

      <Example
        title="Error state"
        :code="`<CuiPinInput
  v-model=&quot;code&quot;
  label=&quot;Verification code&quot;
  error
  error-message=&quot;That code has expired. Request a new one.&quot;
/>`"
      >
        <CuiPinInput
          v-model="wrong"
          label="Verification code"
          error
          error-message="That code has expired. Request a new one."
        />
      </Example>

      <Example
        title="Sizes and colors"
        :code="`<CuiPinInput size=&quot;xs&quot; :length=&quot;4&quot; />
<CuiPinInput size=&quot;sm&quot; :length=&quot;4&quot; />
<CuiPinInput size=&quot;md&quot; :length=&quot;4&quot; color=&quot;success&quot; />
<CuiPinInput size=&quot;lg&quot; :length=&quot;4&quot; color=&quot;secondary&quot; />
<CuiPinInput size=&quot;xl&quot; :length=&quot;4&quot; color=&quot;info&quot; />`"
      >
        <CuiStack spacing="4">
          <p style="margin: 0">All five sizes, <code class="cui-code">xs</code> to <code class="cui-code">xl</code>, are distinct; none is clamped. Each box is a square, sized from the same scale as an input.</p>
          <CuiPinInput v-model="sizes" size="xs" :length="4" label="Extra small" />
          <CuiPinInput v-model="sizes" size="sm" :length="4" label="Small" />
          <CuiPinInput v-model="sizes" size="md" :length="4" color="success" label="Medium" />
          <CuiPinInput v-model="sizes" size="lg" :length="4" color="secondary" label="Large" />
          <CuiPinInput v-model="sizes" size="xl" :length="4" color="info" label="Extra large" />
        </CuiStack>
      </Example>

      <Example
        title="Disabled &amp; readonly"
        :code="`<CuiPinInput model-value=&quot;123456&quot; disabled label=&quot;Disabled&quot; />
<CuiPinInput model-value=&quot;123456&quot; readonly label=&quot;Readonly&quot; />`"
      >
        <CuiStack spacing="4">
          <CuiPinInput model-value="123456" disabled label="Disabled" />
          <CuiPinInput model-value="123456" readonly label="Readonly" />
        </CuiStack>
      </Example>

      <Example
        title="Inside CuiForm"
        :code="`<CuiForm v-model=&quot;values&quot; :resolver=&quot;resolver&quot; @submit=&quot;verify&quot;>
  <CuiFormField name=&quot;code&quot; label=&quot;Verification code&quot; help-text=&quot;Six digits&quot; required v-slot=&quot;f&quot;>
    <CuiPinInput v-bind=&quot;f&quot; />
  </CuiFormField>
  <CuiButton type=&quot;submit&quot; variant=&quot;solid&quot;>Verify</CuiButton>
</CuiForm>`"
      >
        <CuiForm v-model="formValues" :resolver="resolver" @submit="verify">
          <CuiStack spacing="4" class="items-start">
            <CuiFormField v-slot="f" name="code" label="Verification code" help-text="Six digits" required>
              <CuiPinInput v-bind="f" />
            </CuiFormField>
            <CuiButton type="submit" variant="solid">Verify</CuiButton>
          </CuiStack>
        </CuiForm>
      </Example>
    </template>
  </DocPage>
</template>

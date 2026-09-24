<script setup lang="ts">
import { ref } from "vue";
import {
  CuiButton,
  CuiFieldset,
  CuiFlex,
  CuiFormField,
  CuiInput,
  CuiMaskedInput,
  CuiRadio,
  CuiRadioGroup,
  CuiSelect,
  CuiStack,
  CuiToggle,
} from "@itguy614/clean-ui";
import DocPage from "../components/DocPage.vue";
import Example from "../components/Example.vue";
import meta from "../meta/fieldset";

const name = ref("");
const email = ref("");
const phone = ref("");
const street = ref("");
const city = ref("");
const state = ref<string | null>(null);
const zip = ref("");
const cardNumber = ref("");
const expiry = ref("");
const cvv = ref("");
const shipping = ref("standard");
const newsletter = ref(false);
const smsAlerts = ref(false);
const billingExpanded = ref(true);
const prefsExpanded = ref(false);
</script>

<template>
  <DocPage :meta="meta">
    <template #usage>
      <Example
        code-open
        :code="`<CuiFieldset legend=&quot;Personal Information&quot;>
  <CuiFormField label=&quot;Full Name&quot; required>
    <CuiInput v-model=&quot;name&quot; placeholder=&quot;John Doe&quot; />
  </CuiFormField>
  <CuiFormField label=&quot;Email&quot; required>
    <CuiInput v-model=&quot;email&quot; type=&quot;email&quot; />
  </CuiFormField>
</CuiFieldset>`"
      >
        <div class="max-w-lg">
          <CuiFieldset legend="Personal Information">
            <CuiFormField label="Full Name" required>
              <CuiInput v-model="name" placeholder="John Doe" />
            </CuiFormField>
            <CuiFormField label="Email" required>
              <CuiInput v-model="email" type="email" placeholder="you@example.com" />
            </CuiFormField>
          </CuiFieldset>
        </div>
      </Example>
    </template>

    <template #accessibility>
      <p class="text-surface-700 dark:text-surface-300">
        This is a real <code>&lt;fieldset&gt;</code> with a real
        <code>&lt;legend&gt;</code>, which is the whole point of the component: the legend
        becomes part of the accessible name of every control inside, so a screen reader
        reads "Shipping — City" rather than just "City". That association is native and
        needs no <code>aria-*</code> to hold it together.
      </p>
      <ul class="list-disc pl-5 text-surface-700 dark:text-surface-300">
        <li>
          <code>disabled</code> sets the native attribute on the
          <code>&lt;fieldset&gt;</code>, which disables every form control inside it and
          removes them from the tab order — no per-field prop, and it works for controls
          the library does not own.
        </li>
        <li>
          Nesting works the way the element does: an inner fieldset's legend joins the
          outer one in each control's name.
        </li>
        <li>
          The <code>description</code> is plain text inside the fieldset. It is read in
          document order, not as part of any control's name — if a specific field needs
          it, put it in that field's <code>helpText</code> instead.
        </li>
      </ul>
      <p class="text-surface-700 dark:text-surface-300">
        <strong>Known gaps — read before using <code>collapsible</code>.</strong> The
        legend toggles on click but is not a button: it has no <code>tabindex</code>, no
        key handler and no <code>aria-expanded</code>, so the collapse cannot be operated
        from the keyboard and its state is not announced. Collapsed content is hidden with
        <code>max-height: 0</code> rather than removed, so the fields inside it are still
        focusable and <code>Tab</code> walks into a section nobody can see. Use the
        component without <code>collapsible</code>, or reach for
        <code>CuiAccordion</code>, where the header is a real button and the panel is
        properly hidden.
      </p>
    </template>

    <template #examples>
      <!-- With Description -->
      <Example title="With Description" :code="`<CuiFieldset legend=&quot;Shipping Address&quot;
  description=&quot;Enter the address for your delivery.&quot;>
  <CuiFormField label=&quot;Street&quot;>
    <CuiInput v-model=&quot;street&quot; placeholder=&quot;123 Main St&quot; />
  </CuiFormField>
</CuiFieldset>`">
        <div class="max-w-lg">
          <CuiFieldset legend="Shipping Address" description="Enter the address where you would like your order delivered.">
            <CuiFormField label="Street">
              <CuiInput v-model="street" placeholder="123 Main St" />
            </CuiFormField>
            <CuiFlex gap="4">
              <CuiFormField label="City" class="flex-1">
                <CuiInput v-model="city" placeholder="Springfield" />
              </CuiFormField>
              <CuiFormField label="State" class="w-32">
                <CuiSelect v-model="state" :options="['CA', 'NY', 'TX', 'FL', 'IL']" placeholder="State" />
              </CuiFormField>
              <CuiFormField label="ZIP" class="w-36">
                <CuiMaskedInput v-model="zip" mask="#####" placeholder="ZIP" />
              </CuiFormField>
            </CuiFlex>
          </CuiFieldset>
        </div>
      </Example>

      <!-- Variants -->
      <Example title="Variants" :code="`<CuiFieldset legend=&quot;Outline&quot; variant=&quot;outline&quot;> ... </CuiFieldset>
<CuiFieldset legend=&quot;Subtle&quot; variant=&quot;subtle&quot;> ... </CuiFieldset>
<CuiFieldset legend=&quot;Ghost&quot; variant=&quot;ghost&quot;> ... </CuiFieldset>`">
        <CuiStack spacing="4" class="max-w-lg">
          <CuiFieldset legend="Outline" description="Border only — the default." variant="outline">
            <CuiFormField label="Field">
              <CuiInput placeholder="Outline variant" />
            </CuiFormField>
          </CuiFieldset>
          <CuiFieldset legend="Subtle" description="Subtle tinted background." variant="subtle">
            <CuiFormField label="Field">
              <CuiInput placeholder="Subtle variant" />
            </CuiFormField>
          </CuiFieldset>
          <CuiFieldset legend="Ghost" description="No border or background — grouping only." variant="ghost">
            <CuiFormField label="Field">
              <CuiInput placeholder="Ghost variant" />
            </CuiFormField>
          </CuiFieldset>
        </CuiStack>
      </Example>

      <!-- Color tint -->
      <Example title="Color (subtle)" :code="`<CuiFieldset legend=&quot;Danger Zone&quot; variant=&quot;subtle&quot; color=&quot;error&quot;> ... </CuiFieldset>`">
        <CuiStack spacing="4" class="max-w-lg">
          <CuiFieldset legend="Danger Zone" description="Irreversible actions." variant="subtle" color="error">
            <CuiFormField label="Confirm">
              <CuiInput placeholder="Type to confirm" />
            </CuiFormField>
          </CuiFieldset>
          <CuiFieldset legend="Heads Up" description="Outline tinted with a color role." variant="outline" color="warning">
            <CuiFormField label="Field">
              <CuiInput placeholder="Warning outline" />
            </CuiFormField>
          </CuiFieldset>
        </CuiStack>
      </Example>

      <!-- Rounded -->
      <Example title="Rounded" :code="`<CuiFieldset legend=&quot;None&quot; rounded=&quot;none&quot; />
<CuiFieldset legend=&quot;Large&quot; rounded=&quot;lg&quot; />`">
        <CuiStack spacing="4" class="max-w-lg">
          <CuiFieldset legend="Square" variant="subtle" rounded="none">
            <CuiFormField label="Field"><CuiInput placeholder="rounded='none'" /></CuiFormField>
          </CuiFieldset>
          <CuiFieldset legend="Large radius" variant="subtle" rounded="lg">
            <CuiFormField label="Field"><CuiInput placeholder="rounded='lg'" /></CuiFormField>
          </CuiFieldset>
        </CuiStack>
      </Example>

      <!-- Collapsible -->
      <Example title="Collapsible" :code="`<CuiFieldset legend=&quot;Billing Information&quot; collapsible v-model:expanded=&quot;open&quot;>
  ...
</CuiFieldset>`">
        <CuiStack spacing="4" class="max-w-lg">
          <CuiFieldset
            legend="Billing Information"
            collapsible
            v-model:expanded="billingExpanded"
          >
            <CuiFormField label="Card Number" required>
              <CuiMaskedInput v-model="cardNumber" mask="#### #### #### ####" placeholder="Card number">
                <template #prefix>💳</template>
              </CuiMaskedInput>
            </CuiFormField>
            <CuiFlex gap="4">
              <CuiFormField label="Expiry" class="flex-1">
                <CuiMaskedInput v-model="expiry" mask="##/##" placeholder="MM/YY" />
              </CuiFormField>
              <CuiFormField label="CVV" class="w-28">
                <CuiMaskedInput v-model="cvv" mask="###" placeholder="CVV" />
              </CuiFormField>
            </CuiFlex>
          </CuiFieldset>

          <CuiFieldset
            legend="Preferences"
            description="Optional notification settings"
            collapsible
            v-model:expanded="prefsExpanded"
          >
            <CuiFormField label="Notifications">
              <CuiToggle v-model="newsletter" label="Email newsletter" />
            </CuiFormField>
            <CuiFormField label="SMS">
              <CuiToggle v-model="smsAlerts" label="SMS shipping alerts" />
            </CuiFormField>
          </CuiFieldset>

          <div class="text-sm text-surface-500">
            Billing: {{ billingExpanded ? 'expanded' : 'collapsed' }},
            Preferences: {{ prefsExpanded ? 'expanded' : 'collapsed' }}
          </div>
        </CuiStack>
      </Example>

      <!-- Disabled -->
      <Example title="Disabled" :code="`<CuiFieldset legend=&quot;Locked Section&quot; disabled>
  <CuiFormField label=&quot;Name&quot;>
    <CuiInput model-value=&quot;John Doe&quot; />
  </CuiFormField>
</CuiFieldset>`">
        <div class="max-w-lg">
          <CuiFieldset legend="Locked Section" disabled>
            <CuiFormField label="Name">
              <CuiInput model-value="John Doe" />
            </CuiFormField>
            <CuiFormField label="Email">
              <CuiInput model-value="john@example.com" />
            </CuiFormField>
          </CuiFieldset>
        </div>
      </Example>

      <!-- Nested Fieldsets -->
      <Example title="Nested Fieldsets" :code="`<CuiFieldset legend=&quot;Account Setup&quot;>
  <CuiFormField label=&quot;Username&quot; required>
    <CuiInput v-model=&quot;name&quot; />
  </CuiFormField>
  <CuiFieldset legend=&quot;Contact Details&quot;>
    <CuiFormField label=&quot;Email&quot;>
      <CuiInput v-model=&quot;email&quot; type=&quot;email&quot; />
    </CuiFormField>
  </CuiFieldset>
</CuiFieldset>`">
        <div class="max-w-lg">
          <CuiFieldset legend="Account Setup">
            <CuiFormField label="Username" required>
              <CuiInput v-model="name" placeholder="Choose a username" />
            </CuiFormField>

            <CuiFieldset legend="Contact Details" description="At least one contact method required">
              <CuiFormField label="Email">
                <CuiInput v-model="email" type="email" placeholder="you@example.com" />
              </CuiFormField>
              <CuiFormField label="Phone">
                <CuiMaskedInput v-model="phone" mask="+1 (###) ###-####" />
              </CuiFormField>
            </CuiFieldset>
          </CuiFieldset>
        </div>
      </Example>

      <!-- Real-world: Checkout Form -->
      <Example title="Real-World: Checkout Form" :code="`<CuiFieldset legend=&quot;Contact&quot;>
  <CuiFormField label=&quot;Email&quot; required>
    <CuiInput v-model=&quot;email&quot; type=&quot;email&quot; />
  </CuiFormField>
</CuiFieldset>
<CuiFieldset legend=&quot;Payment&quot; collapsible>
  <CuiFormField label=&quot;Card Number&quot; required>
    <CuiMaskedInput v-model=&quot;cardNumber&quot; mask=&quot;#### #### #### ####&quot; />
  </CuiFormField>
</CuiFieldset>`">
        <CuiStack spacing="4" class="max-w-lg">
          <CuiFieldset legend="Contact">
            <CuiFormField label="Email" required>
              <CuiInput v-model="email" type="email" placeholder="you@example.com" />
            </CuiFormField>
            <CuiFormField label="Phone" help-text="For delivery updates">
              <CuiMaskedInput v-model="phone" mask="+1 (###) ###-####" />
            </CuiFormField>
          </CuiFieldset>

          <CuiFieldset legend="Shipping">
            <CuiFormField label="Address" required>
              <CuiInput v-model="street" placeholder="Street address" />
            </CuiFormField>
            <CuiFlex gap="4">
              <CuiFormField label="City" required class="flex-1">
                <CuiInput v-model="city" />
              </CuiFormField>
              <CuiFormField label="State" class="w-32">
                <CuiSelect v-model="state" :options="['CA', 'NY', 'TX']" placeholder="..." />
              </CuiFormField>
              <CuiFormField label="ZIP" required class="w-36">
                <CuiMaskedInput v-model="zip" mask="#####" />
              </CuiFormField>
            </CuiFlex>
            <CuiFormField label="Shipping Method" required>
              <CuiRadioGroup v-model="shipping">
                <CuiRadio value="standard" label="Standard (5-7 days)" description="Free" />
                <CuiRadio value="express" label="Express (1-2 days)" description="$12.99" />
              </CuiRadioGroup>
            </CuiFormField>
          </CuiFieldset>

          <CuiFieldset legend="Payment" collapsible>
            <CuiFormField label="Card Number" required>
              <CuiMaskedInput v-model="cardNumber" mask="#### #### #### ####">
                <template #prefix>💳</template>
              </CuiMaskedInput>
            </CuiFormField>
            <CuiFlex gap="4">
              <CuiFormField label="Expiry" required class="flex-1">
                <CuiMaskedInput v-model="expiry" mask="##/##" placeholder="MM/YY" />
              </CuiFormField>
              <CuiFormField label="CVV" required class="w-28">
                <CuiMaskedInput v-model="cvv" mask="###" />
              </CuiFormField>
            </CuiFlex>
          </CuiFieldset>

          <CuiFlex gap="3">
            <CuiButton variant="solid" color="success" size="lg">Place Order</CuiButton>
            <CuiButton variant="ghost" color="secondary">Back to Cart</CuiButton>
          </CuiFlex>
        </CuiStack>
      </Example>
    </template>
  </DocPage>
</template>
